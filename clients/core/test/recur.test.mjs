// Recurring entries with two dates (architecture 4.4a): TZ=Europe/Berlin node --test clients/core/test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";

const P = l => C.parse(l);
test("reading of two dates with a repetition", () => {
  assert.equal(C.recurrenceMode(P("Fest #facet-f #date-2026-07-10 #date-2026-07-12 #recurring-yearly")), "occurrence");
  assert.equal(C.recurrenceMode(P("Training #facet-f #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed")), "series");
  assert.equal(C.recurrenceMode(P("Kurs #facet-f #date-2026-11-16 #date-2026-12-31 #recurring-weekly")), "series");
  assert.equal(C.recurrenceMode(P("Wochenende #facet-f #date-2026-11-20 #date-2026-11-22 #recurring-weekly")), "occurrence");
  assert.equal(C.recurrenceMode(P("X #facet-f #date-2026-11-20 #recurring-weekly")), null);
});
test("shown date of a bounded series and of a multi-day occurrence", () => {
  const tr = P("Training #facet-f #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed");
  assert.equal(C.shownDate(tr, "2026-11-17"), "2026-11-18");
  assert.equal(C.shownDate(tr, "2027-04-01"), "9999-12-31");
  const fest = P("Fest #facet-f #date-2026-07-10 #date-2026-07-12 #recurring-yearly");
  assert.equal(C.shownDate(fest, "2027-07-11"), "2027-07-11"); // in progress
  assert.equal(C.shownDate(fest, "2027-07-13"), "2028-07-10");
});
test("doubtful cases are named", () => {
  assert.match(C.recurrenceDoubt(P("X #facet-f #date-2026-11-02 #date-2026-11-06 #recurring-weekly")), /more than half/);
  assert.match(C.recurrenceDoubt(P("X #facet-f #date-2026-11-17 #date-2026-11-18 #recurring-mon")), /no occurrence/);
  assert.equal(C.recurrenceDoubt(P("Training #facet-f #date-2026-11-16 #date-2027-03-31 #recurring-mon-wed")), "");
});
test("export and import keep the reading", async () => {
  const tr = P("Training #facet-f #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed");
  const fest = P("Fest #facet-f #date-2026-07-10 #date-2026-07-12 #recurring-yearly");
  const ics = C.entriesToICS([tr, fest], "x");
  assert.match(ics, /RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20270331T\d{6}Z/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260710\r\nDTEND;VALUE=DATE:20260713\r\nRRULE:FREQ=YEARLY\r\n/);
  const evs = C.parseICS(ics);
  const lines = await Promise.all(evs.map(ev => C.icsEventToLine(ev, "2026-11-15")));
  const a = C.parse(lines[0].line), b = C.parse(lines[1].line);
  assert.equal(C.recurrenceMode(a), "series");
  assert.equal(a.tags.filter(t => t.dim === "date").map(t => t.val).join(","), "2026-11-16,2027-03-31");
  assert.equal(C.recurrenceMode(b), "occurrence");
});
