// Handover codes (architecture 8.11i).
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";
const phrase = "abandon ability able about above absent absorb abstract";
const T = btoa(String.fromCharCode(...Array.from({ length: 32 }, (_, i) => i)));
const code = await C.handoverCodeOf(phrase, T);
assert.equal(C.codeKind(code), "handover");
const h = C.parseHandoverCode(code);
assert.equal(h.ally, await C.allyCodeOf(phrase));
assert.equal(h.secret, T);
const owner = await C.deriveKeysV2(phrase), ally = await C.keysFromAllyCode(h.ally);
assert.equal(ally.acct, owner.acct);
assert.equal(C.codeKind(C.guestCodeOf(owner)), "guest");
assert.throws(() => C.parseHandoverCode("h1.abc"));
console.log("handover ok");
