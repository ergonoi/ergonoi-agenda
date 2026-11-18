import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";

const h = s => Uint8Array.from(s.match(/../g).map(x => parseInt(x, 16)));

test("account and read token agree with the service (server/auth_test.go)", async () => {
  // keysV2 is internal; the guest code carries K, R and F, so build the vector through it.
  const W = h("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f");
  const k = await crypto.subtle.importKey("raw", W, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const R = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("outheis-agenda/read")));
  assert.equal(Buffer.from(R).toString("hex"), "1abf8e051a666ee4556dc7802b26ea8ccbdba10e5b7933a822e3aabd13b50698");
  const F = h("72dbb7336c76780023f83d");
  const raw = new Uint8Array([...new Uint8Array(32), ...R, ...F]);
  const code = "g1." + Buffer.from(raw).toString("base64url");
  const g = await C.keysFromGuestCode(code);
  assert.equal(g.acct, "672c022ed6a8b8533441efe1735fe3b86a2b3684ec5262f6ddb6ce31c890cefb");
  assert.equal(g.level, "guest");
  assert.equal(C.canWrite(g), false);
});

test("owner, ally and guest reach the same account", async () => {
  const phrase = C.newPhrase();
  const o = await C.deriveKeysV2(phrase);
  const code = await C.allyCodeOf(phrase);
  assert.equal(code.split(" ").length, 16);
  assert.equal(C.codeKind(code), "ally");
  assert.equal(C.codeKind(phrase), "phrase");
  const a = await C.keysFromAllyCode(code);
  const g = await C.keysFromGuestCode(C.guestCodeOf(o));
  assert.equal(C.codeKind(C.guestCodeOf(o)), "guest");
  assert.equal(a.acct, o.acct); assert.equal(g.acct, o.acct);
  assert.equal(a.enc, o.enc); assert.equal(g.enc, o.enc);
  assert.equal(a.w, o.w); assert.ok(!a.d && !a.priv); assert.ok(o.d && o.priv);
  assert.ok(!g.w && !g.d);
  assert.equal(C.authHeaders(o).Authorization, "Write " + o.w);
  assert.equal(C.authHeaders(g).Authorization, "Read " + g.r);
  assert.equal(C.deleteHeaders(a), null);
  assert.equal(C.deleteHeaders(o).Authorization, "Delete " + o.d);
});

test("version 1 keys keep their account", async () => {
  const k = await C.deriveKeys(C.newPhrase());
  assert.equal(await C.acctOf(k), await C.accountId(k.token));
  assert.equal(C.authHeaders(k).Authorization, "Bearer " + k.token);
  assert.equal(C.canWrite(k), true);
});

test("word lists: a German phrase and an ally code in any list reach the same account", async () => {
  for (const [k, l] of Object.entries(C.WORDLISTS)) {
    assert.equal(l.words.length, 2048, k);
    assert.equal(new Set(l.words).size, 2048, k);
    assert.ok(l.words.every(w => /^[a-z]+$/.test(w)), k);
  }
  const phrase = C.newPhrase("de");
  assert.equal(C.wordlistOf(phrase.split(" ")), "de");
  assert.equal(C.codeKind(phrase), "phrase");
  assert.equal(C.phraseProblem(phrase), "");
  const o = await C.deriveKeysV2(phrase);
  const en = await C.allyCodeOf(phrase), fr = await C.allyCodeOf(phrase, "fr");
  assert.notEqual(en, fr);
  assert.equal(C.codeKind(fr), "ally");
  assert.equal((await C.keysFromAllyCode(en)).acct, o.acct);
  assert.equal((await C.keysFromAllyCode(fr)).acct, o.acct);
  // Accents typed or not: the same words.
  const accented = fr.replace(/e/, "é");
  assert.equal((await C.keysFromAllyCode(accented)).acct, o.acct);
});

test("English phrases derive as before", async () => {
  const p = "abandon ability able about above absent absorb abstract";
  assert.equal(C.phraseProblem(p), "");
  assert.equal(C.wordlistOf(p.split(" ")), "en");
  assert.equal(C.phraseProblem("abandon ability able about above absent absorb xyzzy"), "Unknown word(s): xyzzy");
});
