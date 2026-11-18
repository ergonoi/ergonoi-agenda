// Meta lines and memos appear in no view (decisions 3.2, architecture 5.6), also not under
// Show all; a facet with only its Tag definition is not listed in the facet panel; several
// facets can be removed from a journal at once (ui.md 4.10); on a wide screen with a mouse
// the sheet opens below the add field (ui.md 4.2).
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1600, height: 1000 });
  await newAccount(A, svc.url);
  await A.evaluate(() => {
    writeDefinition("", "facet", "empty1"); writeDefinition("", "facet", "empty2");
    S.wc += "\nA phone number #facet-work #type-memo\nAn old meta line #type-meta #date-3000-12-31";
    render();
  });
  await sleep(300);
  await A.evaluate(() => document.querySelector('[data-beyond="1"]')?.click()); await sleep(300);
  const txt = await A.evaluate(() => document.getElementById("agenda").textContent);
  check(!/Tag definition|Journal name|Journal key|An old meta line/.test(txt), "no meta line in the list, also with Show all");
  check(!/A phone number/.test(txt), "no memo in the list");
  const panel = await A.evaluate(() => document.getElementById("fpanel").textContent);
  check(!/empty1|empty2/.test(panel), "facets with only a definition are not in the panel");

  await A.evaluate(() => openJournal("")); await sleep(300);
  const smalls = await A.evaluate(() => [...document.querySelectorAll("#jRmFacets button")].map(x => x.textContent));
  check(smalls.some(t => /empty1definition only/.test(t)) && smalls.some(t => /work\d/.test(t)), "counts beside the facets: " + smalls.join(" | "));
  await A.evaluate(() => { for (const v of ["empty1", "empty2"]) document.querySelector(`#jRmFacets [data-rmf="${v}"]`).click(); });
  check(await A.evaluate(() => document.querySelectorAll('#jRmFacets [aria-pressed="true"]').length) === 2, "two facets chosen");
  await A.evaluate(() => { $("jRmGo").click(); $("jRmGo").click(); }); await sleep(300);
  const left = await A.evaluate(() => [...document.querySelectorAll("#jRmFacets [data-rmf]")].map(x => x.dataset.rmf));
  check(!left.includes("empty1") && !left.includes("empty2"), "both removed with one Remove");
  await A.evaluate(() => $("dlgJournal").close()); await sleep(200);

  await A.evaluate(() => document.getElementById("addLine").focus());
  await A.type("#addLine", "Something new"); await A.keyboard.press("Enter"); await sleep(500);
  const pos = await A.evaluate(() => { const p = document.querySelector("#facetSheet .panel").getBoundingClientRect(), a = document.getElementById("add").getBoundingClientRect(); return { pt: p.top, ab: a.bottom, pl: p.left, al: a.left, hidden: document.getElementById("facetSheet").classList.contains("hidden") }; });
  check(!pos.hidden && pos.pt >= pos.ab && pos.pt < pos.ab + 40 && Math.abs(pos.pl - pos.al) < 2, "the sheet opens below the add field " + JSON.stringify(pos));
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
