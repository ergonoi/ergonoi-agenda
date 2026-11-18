// Calendar import and export: TZ=Europe/Berlin node --test clients/core/test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";

process.env.TZ = process.env.TZ || "Europe/Berlin";

const CAL = [
  "BEGIN:VCALENDAR", "VERSION:2.0",
  "BEGIN:VEVENT", "UID:a1@example", "SUMMARY:Team meeting #weekly", "DTSTART;TZID=Europe/Berlin:20261120T090000", "DTEND;TZID=Europe/Berlin:20261120T103000",
  "LOCATION:Room 2", "BEGIN:VALARM", "TRIGGER:-PT15M", "END:VALARM", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a2@example", "SUMMARY:Flight", "DTSTART:20261121T070000Z", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a3@example", "SUMMARY:Trade fair", "DTSTART;VALUE=DATE:20261123", "DTEND;VALUE=DATE:20261126", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a4@example", "SUMMARY:Choir", "DTSTART;TZID=Europe/Berlin:20261103T190000", "DTEND;TZID=Europe/Berlin:20261103T2", " 03000", "RRULE:FREQ=WEEKLY;BYDAY=TU,TH", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a5@example", "SUMMARY:Cancelled", "STATUS:CANCELLED", "DTSTART;VALUE=DATE:20261124", "END:VEVENT",
  "BEGIN:VEVENT", "UID:a6@example", "SUMMARY:Every third week", "DTSTART;VALUE=DATE:20261124", "RRULE:FREQ=WEEKLY;INTERVAL=3", "END:VEVENT",
  "END:VCALENDAR",
].join("\r\n");

test("events are read with time zones, spans and repetition", async () => {
  const evs = C.parseICS(CAL);
  assert.equal(evs.length, 6);
  const out = [];
  for (const ev of evs) out.push(await C.icsEventToLine(ev, "2026-11-15"));
  assert.match(out[0].line, /^Team meeting ＃weekly \(Room 2\) #date-2026-11-20 #time-09:00-10:30 #cal-[0-9a-f]{10}$/);
  assert.match(out[1].line, /#date-2026-11-21 #time-08:00 /);
  assert.match(out[2].line, /#date-2026-11-23 #date-2026-11-25 /);
  assert.match(out[3].line, /#date-2026-11-03 #time-19:00-20:30 #recurring-tue-thu/);
  assert.equal(out[4].skip, "cancelled");
  assert.match(out[5].line, /#review-needed/);
  assert.equal(out[5].note, "repetition not supported; imported once");
});

test("imported lines are valid entries", async () => {
  for (const ev of C.parseICS(CAL)) {
    const r = await C.icsEventToLine(ev, "2026-11-15");
    if (!r.line) continue;
    const e = C.parse(r.line + " #facet-work"); C.validate(e);
    assert.equal(C.has(e, "review") && !r.note, false, r.line);
  }
});

test("the same event gives the same #cal value", async () => {
  assert.equal(await C.calHash("a1@example", ""), await C.calHash("a1@example", ""));
});

test("export and re-import keep date, time and repetition", async () => {
  const es = C.parseLines("Dentist #facet-private #date-2026-11-20 #time-15:30-16:00 #id-0380197557320056832\nHoliday #facet-private #date-2026-12-24 #date-2026-12-26\nWalk #facet-private #date-2026-11-16 #recurring-mon-wed");
  const ics = C.entriesToICS(es, "Test");
  assert.ok(ics.split("\r\n").every(l => new TextEncoder().encode(l).length <= 75));
  const back = [];
  for (const ev of C.parseICS(ics)) back.push((await C.icsEventToLine(ev, "2026-11-15")).line);
  assert.match(back[0], /^Dentist #date-2026-11-20 #time-15:30-16:00/);
  assert.match(back[1], /^Holiday #date-2026-12-24 #date-2026-12-26/);
  assert.match(back[2], /#recurring-mon-wed/);
});
