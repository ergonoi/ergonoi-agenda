// Notes of entries ({{…}}, architecture 3.6): TZ=Europe/Berlin node --test clients/core/test/*.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../agenda-core.js";

test("a note is parsed and written back unchanged", () => {
  const line = "Termin weißer Rabe {{Adresse: Gärtnerplatz 3\\nTel. #42 \\} ok}} #facet-work #date-2026-11-18";
  const e = C.parse(line);
  assert.equal(e.text, "Termin weißer Rabe");
  assert.equal(e.note, "Adresse: Gärtnerplatz 3\nTel. #42 } ok");
  assert.equal(C.get(e, "facet"), "work");
  assert.equal(e.tags.length, 2);
  assert.equal(C.contentKey(e), line);
  assert.deepEqual(C.parse(C.toLine(e)), e);
});
test("spaces inside a note are kept", () => {
  assert.equal(C.parse("A {{x   y}} #facet-work").note, "x   y");
});
test("braces in the text without tags after them are text", () => {
  const e = C.parse("Read {{this}} later #facet-work");
  assert.equal(e.note, "");
  assert.equal(e.text, "Read {{this}} later");
  const f = C.parse("Use {{a}} and {{b}} #facet-work");
  assert.equal(f.text, "Use {{a}} and");
  assert.equal(f.note, "b");
  const g = C.parse("Brace {{ not closed #facet-work");
  assert.equal(g.note, "");
  assert.equal(g.text, "Brace {{ not closed");
});
test("encode and decode are inverse", () => {
  for (const n of ["a\\b", "x}}y", "line1\nline2", "{{nested}}", "back\\nslash"]) assert.equal(C.decodeNote(C.encodeNote(n)), n);
  const e = C.parse("T #facet-work"); e.note = "x}}y\n#tag \\"; assert.equal(C.parse(C.toLine(e)).note, e.note);
});
test("calendar description becomes the note and goes back out", async () => {
  const cal = ["BEGIN:VCALENDAR", "BEGIN:VEVENT", "UID:n1", "SUMMARY:Meeting", "DTSTART;VALUE=DATE:20991120", "DESCRIPTION:Agenda:\\n1. budget\\, plan", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  const [ev] = C.parseICS(cal);
  const r = await C.icsEventToLine(ev, "2026-11-15");
  const e = C.parse(r.line);
  assert.equal(e.note, "Agenda:\n1. budget, plan");
  const out = C.entriesToICS([e], "x");
  assert.match(out, /DESCRIPTION:Agenda:\\n1\. budget\\, plan/);
});

test("up to three facets; the first owns the entry", () => {
  const e = C.parse("Projekt #facet-garden #facet-school #facet-work #facet-private #topic-cooperation");
  C.validate(e);
  assert.deepEqual(C.facetsOf(e), ["garden", "school", "work"]);
  assert.equal(C.get(e, "facet"), "garden");
  assert.match(e.text, /facet-private/);
  const f = C.parse("X #facet-garden #facet-garden"); C.validate(f);
  assert.deepEqual(C.facetsOf(f), ["garden"]);
});
