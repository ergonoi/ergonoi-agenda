// A span when adding (ui.md 4.2): after a date, "until" appears beside it, as "to" does after
// a start time; the line and the sheet together make at most two dates, the earlier first.
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

  await sheet("Trip to Kyoto");
  check(await A.evaluate(() => document.getElementById("facetUntil").classList.contains("hidden")), "no until before a date");
  await pick("#facetPick > .pick:first-child", "2026-12-02");
  check(await A.evaluate(() => !document.getElementById("facetUntil").classList.contains("hidden")), "until appears after a date");
  await pick("#facetUntil", "2026-12-06");
  check(await A.evaluate(() => /–/.test(document.getElementById("facetWhen").textContent)), "the sheet shows the span");
  await facet(); await sleep(500);
  check(/#date-2026-12-02 #date-2026-12-06/.test(await fileLine(A, "Trip to Kyoto")), "two dates written: " + await fileLine(A, "Trip to Kyoto"));

  await sheet("Fair #date-2026-12-10");
  await pick("#facetPick > .pick:first-child", "2026-12-08");
  await facet(); await sleep(500);
  check(/#date-2026-12-08 #date-2026-12-10/.test(await fileLine(A, "Fair")), "line date and sheet date make a span, earlier first: " + await fileLine(A, "Fair"));

  await sheet("Course #date-2026-12-10 #date-2026-12-12");
  await pick("#facetPick > .pick:first-child", "2026-12-20");
  await facet(); await sleep(500);
  check(/#date-2026-12-10 #date-2026-12-12/.test(await fileLine(A, "Course")) && !/2026-12-20/.test(await fileLine(A, "Course")), "never a third date: the line keeps its own");

  await settled(A);
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
