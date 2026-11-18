import test from "node:test";
import assert from "node:assert/strict";
import { parse, occurrences } from "../agenda-core.js";

const occ = (l, a, b) => occurrences(parse(l), a, b);

test("weekly series with a skip", () => {
  assert.deepEqual(occ("Unit #facet-fit #date-2026-11-02 #recurring-weekly #skip-2026-11-16", "2026-11-01", "2026-11-30"),
    ["2026-11-02", "2026-11-09", "2026-11-23", "2026-11-30"]);
});
test("series ends at its second date", () => {
  assert.deepEqual(occ("Kurs #date-2026-11-03 #date-2026-11-20 #recurring-weekly", "2026-11-01", "2026-11-30"),
    ["2026-11-03", "2026-11-10", "2026-11-17"]);
});
test("nothing before the first date", () => {
  assert.deepEqual(occ("X #date-2026-11-25 #recurring-daily", "2026-11-20", "2026-11-27"), ["2026-11-25", "2026-11-26", "2026-11-27"]);
});
test("a span covers every day, clipped to the range", () => {
  assert.deepEqual(occ("Messe #date-2026-10-30 #date-2026-11-02", "2026-11-01", "2026-11-30"), ["2026-11-01", "2026-11-02"]);
});
test("recurring occurrences that span days", () => {
  assert.deepEqual(occ("Reise #date-2026-11-06 #date-2026-11-08 #recurring-monthly", "2026-11-28", "2026-12-08"), ["2026-12-06", "2026-12-07", "2026-12-08"]);
});
test("an entry without a date has no day", () => {
  assert.deepEqual(occ("Flex #facet-x", "2026-11-01", "2026-11-30"), []);
});
