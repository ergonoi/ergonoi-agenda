// A view chosen before all journals are loaded (ui.md 4.14): facets of a journal that comes
// later follow the view; the line "changed" appears only after the user's own change.
import { device, newAccount, addLine, check, sleep, settled } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { phone: true });
  await newAccount(A, svc.url);
  await addLine(A, "Call the plumber #facet-home");
  await addLine(A, "Order boards #facet-work");
  // A view with only "home", then chosen.
  await A.evaluate(() => { const f = filterState(); f.facet = valuesOf("facet").filter(k => facetName(k) !== "home"); saveFilter(f); writeView("Home"); applyView("Home"); }); await sleep(300);
  check(await A.evaluate(() => !document.getElementById("fline").textContent.includes("changed")), "the chosen view shows no change");
  // A further journal with its own facet arrives afterwards.
  await A.evaluate(async () => {
    const ph = newPhrase("en"); await joinJournal(ph, true, "Office", true); await sync();
    const id = extraJournals().slice(-1)[0].id; withJ(id, () => { S.wc += "\nProject task #facet-projects"; S.outbox.push({ op: "replace" }); }); await sync();
  });
  await settled(A); await A.evaluate(() => render()); await sleep(300);
  const st = await A.evaluate(() => ({ line: document.getElementById("fline").textContent, shown: [...document.querySelectorAll("#agenda .item .text")].map(x => x.textContent) }));
  check(!st.line.includes("changed"), "a journal loaded later shows no change: " + st.line);
  check(!st.shown.some(t => /Project task/.test(t)) && st.shown.some(t => /Call the plumber/.test(t)), "its facets follow the view: hidden");
  // The user's own change: now the line appears.
  await A.evaluate(() => toggleFilter("facet", valuesOf("facet").find(k => facetName(k) === "work"))); await sleep(300);
  check(await A.evaluate(() => /Home changed: \+ work/.test(document.getElementById("fline").textContent)), "after the user's change the line names it");
  await A.evaluate(() => document.querySelector("#fline [data-vrev]").click()); await sleep(300);
  check(await A.evaluate(() => !document.getElementById("fline").textContent.includes("changed")), "Revert returns to the view");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
