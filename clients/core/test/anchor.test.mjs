import test from "node:test";
import assert from "node:assert/strict";
import { parse, toLine, bindingOf, isMemo, isMeta, migrateLine, checkTag, shownDate } from "../agenda-core.js";

test("older #type-fix/-flex become #anchor", () => {
  assert.equal(migrateLine("A #facet-x #date-2026-11-20 #time-08:00-10:00 #type-flex"), "A #facet-x #date-2026-11-20 #time-08:00-10:00 #anchor-flex");
  assert.equal(migrateLine("B #facet-x #date-2026-11-20 #type-fix"), "B #facet-x #date-2026-11-20 #anchor-fix");
  const same = "C #facet-x #date-2026-11-20 #type-memo";
  assert.equal(migrateLine(same), same);
});
test("binding: anchor wins, then kind, then heuristic", () => {
  assert.equal(bindingOf(parse("W #date-2026-11-20 #time-08:00-10:00 #anchor-flex")), "flex");
  assert.equal(bindingOf(parse("W #date-2026-11-20 #time-08:00-10:00")), "fix");
  assert.equal(bindingOf(parse("T #date-2026-11-20 #anchor-fix")), "fix");
  assert.equal(bindingOf(parse("T #date-2026-11-20 #type-task #time-09:00")), "flex");
  assert.equal(bindingOf(parse("E #date-2026-11-20 #type-event")), "fix");
  assert.equal(bindingOf(parse("Old #date-2026-11-20 #type-flex #time-09:00")), "flex");
});
test("memo", () => {
  assert.ok(isMemo(parse("EORI DE123 #facet-self #date-3000-12-31")));
  assert.ok(isMemo(parse("X #type-memo #date-3000-12-31")));
  assert.ok(!isMemo(parse("Tag definition: self #facet-self #date-3000-12-31")));
  assert.ok(checkTag("type", "memo") && checkTag("anchor", "flex") && !checkTag("anchor", "memo"));
});

test("meta lines and memos lose the far date and carry their kind", () => {
  assert.equal(migrateLine("Tag definition: self #facet-self #date-3000-12-31"), "Tag definition: self #facet-self #type-meta");
  assert.equal(migrateLine("Journal name: Home #date-3000-12-31"), "Journal name: Home #type-meta");
  assert.equal(migrateLine("EORI DE1 #facet-self #date-3000-12-31"), "EORI DE1 #facet-self #type-memo");
  assert.equal(migrateLine("EORI DE1 #facet-self #type-memo #date-3000-12-31"), "EORI DE1 #facet-self #type-memo");
  const done = "Journal name: Home #type-meta"; assert.equal(migrateLine(done), done);
  assert.ok(isMeta(parse("Journal name: X #type-meta")) && isMemo(parse("X #type-memo")));
  assert.equal(shownDate(parse("X #type-memo"), "2026-11-17"), "9999-12-31");
});

test("a facet whose Tag definition carries #anchor-fix fixes the dates of its entries", async () => {
  const { fixedFacetsOf } = await import("../agenda-core.js");
  const defs = [parse("Tag definition: school dates #type-meta #facet-schule #anchor-fix"), parse("Tag definition: friends #type-meta #facet-freunde"), parse("Tag definition: old #type-meta #facet-alt #anchor-fix #done-2026-11-01")];
  const f = fixedFacetsOf(defs);
  assert.deepEqual([...f], ["schule"]);
  assert.equal(bindingOf(parse("Leseprobe #facet-schule #date-2026-11-26"), false, f), "fix");
  assert.equal(bindingOf(parse("Leseprobe #facet-schule #date-2026-11-26 #anchor-flex"), false, f), "flex");
  assert.equal(bindingOf(parse("Kino mit Paul #facet-freunde #date-2026-11-26"), false, f), "flex");
  assert.equal(bindingOf(parse("Alt #facet-alt #date-2026-11-26"), false, f), "flex");
});
