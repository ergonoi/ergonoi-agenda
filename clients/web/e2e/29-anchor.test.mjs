// Anchor when adding (architecture 5.5): one tap writes #anchor-fix, with today's date when
// none is chosen, and the list marks it; facets of fixed dates are chosen in the journal dialog.
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1440, height: 900 });
  await newAccount(A, svc.url);
  await A.evaluate(() => { $("addLine").value = "Dentist"; $("add").requestSubmit(); }); await sleep(400);
  check(await A.evaluate(() => !!document.getElementById("facetAnchor")), "the add sheet offers the anchor");
  await A.evaluate(() => document.getElementById("facetAnchor").click()); await sleep(200);
  check(await A.evaluate(() => document.getElementById("facetAnchor").getAttribute("aria-pressed") === "true" && /fixed date/.test($("facetWhen").textContent)), "one tap sets it and the sheet says so");
  await A.evaluate(() => document.querySelector('#facetButtons [data-facet="work"]').click()); await sleep(500);
  const line = await A.evaluate(() => withJ("", () => S.wc.split("\n").find(l => l.startsWith("Dentist"))));
  check(/#anchor-fix/.test(line) && new RegExp("#date-" + await A.evaluate(() => today())).test(line), "the entry gets #anchor-fix and today's date " + line);
  check(await A.evaluate(() => { const it = [...document.querySelectorAll("#agenda .item")].find(e => /Dentist/.test(e.textContent)); return !!it && !!it.querySelector('[aria-label="Fixed date"]'); }), "the list marks it with the anchor");

  // Journal dialog: anchor behind a facet, written with Save.
  await A.evaluate(() => openJournal("")); await sleep(400);
  check(await A.evaluate(() => !document.getElementById("jFixRow").classList.contains("hidden") && !!document.querySelector('#jFixFacets [data-fixf="private"]')), "the journal dialog lists the facets with an anchor");
  await A.evaluate(() => document.querySelector('#jFixFacets [data-fixf="private"]').click()); await sleep(100);
  await A.evaluate(() => document.getElementById("jOk").click()); await sleep(400);
  check(await A.evaluate(() => [...withJ("", () => fixedFacetsOf(parseLines(S.wc)))].join(",") === "private"), "Save writes #anchor-fix on the definition of private");
  await A.evaluate(() => openJournal("")); await sleep(300);
  check(await A.evaluate(() => document.querySelector('#jFixFacets [data-fixf="private"]').getAttribute("aria-pressed") === "true"), "the dialog shows it again");
  await A.evaluate(() => { document.querySelector('#jFixFacets [data-fixf="private"]').click(); document.getElementById("jOk").click(); }); await sleep(400);
  check(await A.evaluate(() => withJ("", () => fixedFacetsOf(parseLines(S.wc))).size === 0), "and takes it off again");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
