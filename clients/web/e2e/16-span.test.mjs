// A span when adding (ui.md 4.2): one calendar, a second pick makes a span, each date has its
// own ×; the line and the sheet together make at most two dates, the earlier first.
import { device, newAccount, check, sleep, settled } from "./lib.mjs";

const fileLine = (p, t) => p.evaluate(t => S.wc.split("\n").find(l => l.startsWith(t + " ")) || "", t);

export default async function ({ svc, b }) {
  const A = await device(b);
  await newAccount(A, svc.url);
  const sheet = async line => {
    await A.evaluate(() => { document.getElementById("addLine").value = ""; document.getElementById("addLine").focus(); });
    await A.type("#addLine", line); await A.keyboard.press("Enter"); await sleep(300);
  };
  const pick = (sel, v) => A.evaluate((sel, v) => { const i = document.querySelector(sel + " input"); i.value = v; i.dispatchEvent(new Event("change")); }, sel, v);
  const facet = () => A.evaluate(() => document.querySelector("#facetButtons button.tag").click());

  const cal = v => pick("#facetCal", v);
  const shown = () => A.evaluate(() => !document.getElementById("facetCal").classList.contains("hidden"));
  await sheet("Trip to Kyoto");
  check(await A.evaluate(() => document.querySelectorAll("#facetPick .pick input[type=date]").length === 1), "one calendar only");
  await cal("2026-12-06");
  check(await shown(), "after a date the calendar stays for a second one");
  await cal("2026-12-02");
  check(!(await shown()), "with two dates the calendar is gone");
  check(await A.evaluate(() => document.querySelectorAll("#facetWhen [data-nodate]").length === 2), "each date has its own ×");
  await A.evaluate(() => document.querySelector('#facetWhen [data-nodate="0"]').click()); await sleep(100);
  check(await shown() && await A.evaluate(() => document.querySelectorAll("#facetWhen [data-nodate]").length === 1), "removing the first leaves the other as a plain date, the calendar is back");
  await cal("2026-12-02");
  await facet(); await sleep(500);
  check(/#date-2026-12-02 #date-2026-12-06/.test(await fileLine(A, "Trip to Kyoto")), "two dates written, the earlier first: " + await fileLine(A, "Trip to Kyoto"));

  await sheet("Fair #date-2026-12-10");
  await cal("2026-12-08");
  await facet(); await sleep(500);
  check(/#date-2026-12-08 #date-2026-12-10/.test(await fileLine(A, "Fair")), "line date and sheet date make a span, earlier first: " + await fileLine(A, "Fair"));

  await sheet("Course #date-2026-12-10 #date-2026-12-12");
  await cal("2026-12-20");
  await facet(); await sleep(500);
  check(/#date-2026-12-10 #date-2026-12-12/.test(await fileLine(A, "Course")) && !/2026-12-20/.test(await fileLine(A, "Course")), "never a third date: the line keeps its own");

  await settled(A);
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
