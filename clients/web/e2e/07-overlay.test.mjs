// Overlays and references across journals (architecture 8.11c) in the click dummy, desktop.
import { device, check, sleep, DUMMY } from "./lib.mjs";

export default async function ({ b }) {
  const p = await device(b, { width: 1400, height: 1000 });
  await p.goto(DUMMY); await sleep(3000);
  await p.click("#btnSettings"); await sleep(300);
  await p.click("#btnAddJournal"); await sleep(200);
  await p.click("#jNewPhrase"); await p.type("#jName", "Johann");
  await p.click("#jOk"); await sleep(4000);
  await p.evaluate(() => setView("agenda"));
  const jj = await p.evaluate(() => journals()[1]);
  await p.evaluate(j => { withJ(j, () => { S.wc += "\nTag definition: school #facet-school #date-3000-12-31\nMusik SA #facet-school #date-2026-11-19 #topic-school"; }); sync(); }, jj); await sleep(2500);
  const item = () => p.evaluateHandle(() => [...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes("Musik SA")));
  // + on Johann's entry: another facet -> family (overlay)
  await p.evaluate(() => [...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes("Musik SA")).querySelector(".chip.plus").click()); await sleep(300);
  const opts = await p.$$eval("#pop .opt", os => os.map(o => o.textContent));
  check(opts.includes("another facet") && opts.includes("another topic") && opts.includes("reference to an entry"), "+ offers another facet, another topic, reference: " + opts.join(","));
  await p.evaluate(() => [...document.querySelectorAll("#pop .opt")].find(o => o.textContent === "another facet").click()); await sleep(200);
  await p.evaluate(() => [...document.querySelectorAll("#pop .opt")].find(o => o.textContent.startsWith("family")).click()); await sleep(600);
  const jline = await p.evaluate(j => withJ(j, () => S.wc.split("\n").find(l => l.startsWith("Musik SA"))), jj);
  const ovline = await p.evaluate(() => withJ("", () => S.wc.split("\n").find(l => l.startsWith("Tag overlay:"))));
  check(!/facet-family/.test(jline), "Johann's line unchanged");
  check(/#facet-family/.test(ovline || ""), "overlay written in own journal");
  check(await p.evaluate(() => !![...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes("Musik SA")).querySelector(".chip.ov")), "overlay chip shown (dashed)");
  await p.evaluate(() => openPanel(true)); await sleep(300);
  // filter: switch off school; item still visible via family overlay
  await p.evaluate(() => [...document.querySelectorAll("#fpanel [data-facetf]")].find(b => b.dataset.facetf === "school").click()); await sleep(300);
  check(await p.evaluate(() => document.getElementById("agenda").textContent.includes("Musik SA")), "shown via overlay facet");
  await p.evaluate(() => document.querySelector("#fpanel [data-fall]").click()); await sleep(300);
  // ref: own entry referencing Musik SA
  await p.evaluate(() => { S.wc += "\nNoten heraussuchen #facet-family #date-2026-11-18"; render(); }); await sleep(300);
  await p.evaluate(() => sync()); await sleep(1500);
  await p.evaluate(() => [...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes("Noten heraussuchen")).querySelector(".chip.plus").click()); await sleep(300);
  await p.evaluate(() => [...document.querySelectorAll("#pop .opt")].find(o => o.textContent === "reference to an entry").click()); await sleep(200);
  await p.type("#pop .row input", "Musik"); await sleep(200);
  await p.evaluate(() => [...document.querySelectorAll("#pop .opt")].find(o => o.textContent.startsWith("Musik SA")).click()); await sleep(600);
  const refline = await p.evaluate(() => S.wc.split("\n").find(l => l.startsWith("Noten heraussuchen")));
  check(/#ref-\d{19}/.test(refline), "ref tag written");
  check(await p.evaluate(() => [...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes("Noten heraussuchen")).textContent.includes("ref:Musik SA")), "ref chip shows the target's text");
  // closing Johann's entry closes the overlay
  await p.evaluate(j => { withJ(j, () => { S.wc = S.wc.split("\n").map(l => l.startsWith("Musik SA") ? l.replace(" #id-", " #done-2026-11-15 #id-") : l).join("\n"); }); sync(); }, jj); await sleep(3000);
  await p.evaluate(() => sync()); await sleep(2000);
  check(!(await p.evaluate(() => withJ("", () => S.wc.split("\n").some(l => l.startsWith("Tag overlay:"))))), "overlay closed when the entry is gone");
  check(!p.errors.length, "no page errors " + p.errors.join(" | "));
}
