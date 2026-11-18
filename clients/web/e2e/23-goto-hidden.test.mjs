// "Go to item" for an entry hidden by the filter (ui.md 4.2): the search shows it without the
// filter, and the filter applies again once the search is left.
import { device, newAccount, addLine, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { phone: true });
  await newAccount(A, svc.url);
  await addLine(A, "Call the plumber #facet-home");
  await addLine(A, "Order boards #facet-work");
  await A.evaluate(() => { const f = filterState(); f.facet = valuesOf("facet").filter(k => facetName(k) === "work"); saveFilter(f); render(); });
  await addLine(A, "Order more boards #facet-work");
  await A.evaluate(() => document.getElementById("addedGo")?.click()); await sleep(400);
  const st = await A.evaluate(() => ({ open: SEARCH.open, line: document.getElementById("sline").textContent, hits: [...document.querySelectorAll("#agenda .item .text")].map(x => x.textContent) }));
  check(st.open && st.hits.some(t => /Order more boards/.test(t)) && /without the filter/.test(st.line), "the hidden entry is shown, without the filter: " + JSON.stringify(st));
  await A.evaluate(() => openSearch(false)); await sleep(300);
  check(await A.evaluate(() => ![...document.querySelectorAll("#agenda .item .text")].some(x => /boards/.test(x.textContent))), "after leaving the search the filter applies again");
  await A.evaluate(() => openSearch(true)); await sleep(200);
  await A.evaluate(() => { document.getElementById("searchQ").value = "boards"; document.getElementById("searchQ").dispatchEvent(new Event("input")); }); await sleep(300);
  check(await A.evaluate(() => /hidden by the filter/.test(document.getElementById("sline").textContent)), "a search of one's own keeps the filter");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
