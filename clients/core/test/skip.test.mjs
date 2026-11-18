import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";

const p = l => C.parse(l);

test("skip passes over an occurrence of a weekly series", () => {
  // 2026-11-16 is a Monday; series Mondays and Wednesdays
  const e = p("Fitness #date-2026-11-02 #time-18:00 #recurring-mon-wed #skip-2026-11-16");
  assert.equal(C.shownDate(e, "2026-11-16"), "2026-11-18");
  const e2 = p("Fitness #date-2026-11-02 #time-18:00 #recurring-mon-wed #skip-2026-11-16 #skip-2026-11-18");
  assert.equal(C.shownDate(e2, "2026-11-16"), "2026-11-23");
});

test("skip tags are valid, several allowed, in canonical order", () => {
  const e = p("Fitness #facet-self #skip-2026-11-18 #recurring-weekly #date-2026-11-04 #skip-2026-11-25 #type-fix");
  C.validate(e);
  assert.equal(C.toLine(e).replace(/ #(id|rev)-\d+/g, ""), "Fitness #facet-self #date-2026-11-04 #recurring-weekly #skip-2026-11-18 #skip-2026-11-25 #type-fix");
  const b = p("x #facet-self #type-maybe"); C.validate(b);
  assert.ok(b.text.includes("type-maybe") && C.has(b, "review"));
});

test("binding: explicit type wins, then journal, calendar, repetition, time", () => {
  assert.equal(C.bindingOf(p("Angebot schreiben #date-2026-11-10")), "flex");
  assert.equal(C.bindingOf(p("Besuch #date-2026-11-10 #time-15:40")), "fix");
  assert.equal(C.bindingOf(p("Besuch MdL #date-2026-11-10 #type-fix")), "fix");
  assert.equal(C.bindingOf(p("Rückruf #date-2026-11-10 #time-15:00 #type-flex")), "flex");
  assert.equal(C.bindingOf(p("Oma #date-2026-11-10"), true), "fix");
  assert.equal(C.bindingOf(p("Ferien #date-2026-11-10 #cal-0123456789")), "fix");
  assert.equal(C.passesSilently(p("Ferien #date-2026-11-10 #cal-0123456789")), true);
  assert.equal(C.passesSilently(p("Besuch #date-2026-11-10 #time-15:40")), false);
});

test("ICS: EXDATE and a changed occurrence become skips; export writes EXDATE", async () => {
  const ics = ["BEGIN:VCALENDAR",
    "BEGIN:VEVENT", "UID:gym", "DTSTART:20261102T180000", "DTEND:20261102T190000", "RRULE:FREQ=WEEKLY", "EXDATE:20261123T180000", "SUMMARY:Fitness", "END:VEVENT",
    "BEGIN:VEVENT", "UID:gym", "RECURRENCE-ID:20261130T180000", "DTSTART:20261201T180000", "DTEND:20261201T190000", "SUMMARY:Fitness", "END:VEVENT",
    "END:VCALENDAR"].join("\r\n");
  const evs = C.parseICS(ics);
  const series = await C.icsEventToLine(evs[0], "2026-11-16");
  assert.match(series.line, /#skip-2026-11-23/);
  assert.match(series.line, /#skip-2026-11-30/);
  const moved = await C.icsEventToLine(evs[1], "2026-11-16");
  assert.match(moved.line, /^Fitness #date-2026-12-01 #time-18:00-19:00 #cal-/);
  assert.notEqual(moved.cal, series.cal);
  const out = C.entriesToICS([p(series.line)], "x");
  assert.match(out, /EXDATE:20261123T\d{6}Z/);
});
