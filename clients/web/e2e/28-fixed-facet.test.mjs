// A facet of fixed dates (architecture 5.5): #anchor-fix on its Tag definition; its passed
// entries leave the list instead of being carried to Today, other facets are carried as before.
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1440, height: 900 });
  await newAccount(A, svc.url);
  const past = await A.evaluate(() => addDays(today(), -2));
  await A.evaluate(p => { withJ("", () => { S.wc = S.wc + `\nTag definition: school dates #type-meta #facet-schule #anchor-fix\nLeseprobe #facet-schule #date-${p}\nCall Paul #facet-freunde #date-${p}\nExam moved #facet-schule #date-${p} #anchor-flex`; }); render(); }, past);
  await sleep(400);
  const shown = await A.evaluate(() => [...document.querySelectorAll("#agenda .item .text")].map(e => e.textContent.trim()));
  check(!shown.some(t => /Leseprobe/.test(t)), "a passed entry of the fixed facet is gone " + JSON.stringify(shown));
  check(shown.some(t => /Call Paul/.test(t)), "a passed entry of another facet is carried to Today");
  check(shown.some(t => /Exam moved/.test(t)), "an entry's own #anchor-flex wins over its facet");
  await A.evaluate(() => { openSearch(true); $("searchQ").value = "Leseprobe"; $("searchQ").dispatchEvent(new Event("input")); }); await sleep(300);
  check(await A.evaluate(() => /Leseprobe/.test(document.getElementById("agenda").textContent)), "the search still finds it");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
