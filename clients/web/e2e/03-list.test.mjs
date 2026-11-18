// The list (architecture 5.5, ui.md 5.4): passed fixed entries are gone, flexible ones are
// carried to Today, everything after 30 days on request, the search finds what is hidden.
import { device, newAccount, addLine, check, sleep, itemTexts } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b);
  await newAccount(A, svc.url);
  const d = n => A.evaluate(n => addDays(today(), n), n);
  await addLine(A, `Dentist #facet-private #date-${await d(-2)} #time-09:00`);
  await addLine(A, `Send the invoice #facet-work #date-${await d(-2)}`);
  await addLine(A, `Tax return #facet-work #date-${await d(200)}`);
  await addLine(A, `Visit grandma #facet-private #date-${await d(10)}`);
  const texts = await itemTexts(A);
  check(!texts.includes("Dentist"), "a fixed entry is gone after its day");
  check(await A.evaluate(() => !document.querySelector('section[data-g="past"]') && !document.querySelector("[data-pastdone], .pastbtns")), "no group Past and no Done/Reschedule buttons");
  check(await A.evaluate(() => { const s = document.querySelector('section[data-g="today"]'); return !!s && /Send the invoice/.test(s.textContent) && /now/.test([...s.querySelectorAll(".item")].find(i => /Send the invoice/.test(i.textContent)).textContent); }), "a flexible entry is carried to Today as now");
  check(texts.includes("Visit grandma") && !texts.includes("Tax return"), "within 30 days shown, after 30 days not");
  check(await A.evaluate(() => /^Show all \(\d+\)$/.test(document.querySelector('[data-beyond="1"]')?.textContent || "")), "button Show all (N)");
  await A.evaluate(() => document.querySelector('[data-beyond="1"]').click()); await sleep(300);
  check((await itemTexts(A)).includes("Tax return") && await A.evaluate(() => /After 30 days/.test(document.getElementById("agenda").textContent)), "Show all lists entries after 30 days, without a horizon");
  // The line itself is untouched: still open in the journal.
  check(await A.evaluate(() => S.wc.split("\n").some(l => l.startsWith("Dentist") && !/#done/.test(l))), "the passed fixed entry stays open in the journal");
  // The search finds it, in Past.
  await A.evaluate(() => document.getElementById("btnSearch").click());
  await A.type("#searchQ", "Dentist"); await sleep(400);
  check(await A.evaluate(() => /Dentist/.test(document.querySelector('section[data-g="past"]')?.textContent || "")), "the search finds it under Past");
  await A.keyboard.press("Escape"); await sleep(200);
  // Month view: not on its past day either.
  await A.evaluate(() => { setView("month"); calDay = addDays(today(), -2); render(); }); await sleep(300);
  check(await A.evaluate(() => !/Dentist/.test(document.getElementById("agenda").textContent)), "month view does not show it on its past day either");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
