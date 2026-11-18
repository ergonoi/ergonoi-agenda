import test from "node:test";
import assert from "node:assert/strict";
import { parse, occurrences, shownDate, checkTag } from "../agenda-core.js";

test("biweekly is a valid pattern", () => assert.ok(checkTag("recurring", "biweekly")));
test("biweekly falls every second week from the anchor", () => {
  assert.deepEqual(occurrences(parse("Müll #date-2026-11-02 #recurring-biweekly"), "2026-11-01", "2026-12-31"),
    ["2026-11-02", "2026-11-16", "2026-11-30", "2026-12-14", "2026-12-28"]);
});
test("biweekly shown date and skip", () => {
  assert.equal(shownDate(parse("Müll #date-2026-11-02 #recurring-biweekly"), "2026-11-17"), "2026-11-30");
  assert.equal(shownDate(parse("Müll #date-2026-11-02 #recurring-biweekly #skip-2026-11-16"), "2026-11-16"), "2026-11-30");
});
import { parseICS, icsEventToLine, entriesToICS } from "../agenda-core.js";
test("ICS: every second week maps to biweekly and back", async () => {
  const ics = ["BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:b@x", "SUMMARY:Bin", "DTSTART;VALUE=DATE:20261102", "RRULE:FREQ=WEEKLY;INTERVAL=2", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const out = await icsEventToLine(parseICS(ics)[0], "2026-11-01");
  assert.match(out.line, /#recurring-biweekly/);
  assert.match(entriesToICS([parse("Bin #date-2026-11-02 #recurring-biweekly")], "x"), /RRULE:FREQ=WEEKLY;INTERVAL=2/);
});
