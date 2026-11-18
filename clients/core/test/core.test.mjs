// Tests of the shared core module: TZ=Europe/Berlin node --test clients/core/test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";

const DEMO_PHRASE = "garden window river cable orbit maple quote harbor";
// Keys of the demo account, as computed by the web client (clients/demo/mock.js).
const DEMO_KEYS = { enc: "4WxbVtUfue6Vzygm1lYyQEcpynGzKDZ/ZfdhdgvVGpU=", token: "0ef3ae3665c3a71177e34bea83f285ab4f53d666bbfaaa301a649bd8cef7dee9" };

test("parse and toLine round trip in canonical order", () => {
  const e = C.parse("- Call the plumber #time-08:00 #facet-home #date-2026-11-20 #id-1 #rev-2");
  assert.equal(e.text, "Call the plumber");
  assert.equal(C.toLine(e), "Call the plumber #facet-home #date-2026-11-20 #time-08:00 #id-0000000000000000001 #rev-0000000000000000002");
});

test("validate moves invalid tags into the text and flags them", () => {
  const e = C.parse("Something #facet-work #rank-urgent");
  C.validate(e);
  assert.equal(C.get(e, "review"), "needed");
  assert.match(e.text, /rank-urgent/);
});

test("definitions, names, learned rules and comments need no facet", () => {
  for (const l of ["Tag definition: x #date-3000-12-31 #topic-x", "Journal name: A #date-3000-12-31",
    "Learned Rule: y #source-bot #date-3000-12-31", "> why? #ref-0380197557320056832 #source-bot #date-2026-11-15"]) {
    const e = C.parse(l); C.validate(e);
    assert.equal(C.has(e, "review"), false, l);
  }
});

test("source, ref and decision are valid tags", () => {
  const e = C.parse("Proposal #facet-work #date-2026-11-20 #source-bot #ref-0380197557320056832 #decision-rejected");
  C.validate(e);
  assert.equal(C.has(e, "review"), false);
});

test("keys from the phrase match the web client", async () => {
  assert.deepEqual(await C.deriveKeys(DEMO_PHRASE), DEMO_KEYS);
});

test("encryption round trip with padding", async () => {
  const key = await C.importEncKey(DEMO_KEYS.enc);
  const line = "Ä test line #facet-work #date-2026-11-20";
  const c = await C.encryptWith(key, line);
  assert.equal(Buffer.from(c, "base64").length, C.NONCE + C.GCM_TAG + C.PAD);
  assert.equal(await C.decryptWith(key, c), line);
  const other = await C.importEncKey((await C.deriveKeys("abandon ability able about above absent absorb abstract")).enc);
  assert.equal(await C.decryptWith(other, c), null);
});

test("current version is the highest rev", () => {
  const cur = C.currentOf(C.parseLines("A #facet-x #id-5 #rev-5\nB #facet-x #id-5 #rev-9\nC #facet-x #id-5 #rev-7"));
  assert.equal(cur.get("0000000000000000005").text, "B");
});

test("recurring items appear at their next occurrence", () => {
  assert.equal(C.nextOccurrence("2026-11-03", "tue", "2026-11-15"), "2026-11-17");
  assert.equal(C.shownDate(C.parse("Walk #facet-x #date-2026-11-01 #recurring-daily"), "2026-11-15"), "2026-11-15");
});

test("journal name and declared facets", () => {
  const es = C.parseLines("Journal name: Familie #date-3000-12-31 #id-1 #rev-1\nTag definition: f #facet-familie #date-3000-12-31\nTag definition: t #date-3000-12-31 #topic-x");
  assert.equal(C.journalNameOf(es), "Familie");
  assert.deepEqual([...C.declaredFacetsOf(es)], ["familie"]);
});

test("a bot may not write over an entry of a human", () => {
  const lines = [
    "Human entry #facet-x #date-2026-11-20 #id-0380197557320056832 #rev-0380197557320056832",
    "Changed by bot #facet-x #date-2026-11-21 #source-bot #id-0380197557320056832 #rev-0380197557320056900",
    "Bot proposal #facet-x #date-2026-11-22 #source-bot #id-0380197557320056950 #rev-0380197557320056950",
    "Bot revises its proposal #facet-x #date-2026-11-23 #source-bot #id-0380197557320056950 #rev-0380197557320056990",
  ];
  const r = C.enforceBotRules(lines);
  assert.equal(r.rejected.length, 1);
  assert.equal(r.lines.length, 3);
  assert.match(r.rejected[0].line, /Changed by bot/);
});

test("learned rules count only once accepted", () => {
  const es = C.parseLines("Learned Rule: a #source-bot #date-3000-12-31\nLearned Rule: b #source-mixed #date-3000-12-31");
  assert.deepEqual(C.learnedRulesOf(es), ["b"]);
});
