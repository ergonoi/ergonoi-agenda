// Views and the facet panel (ui.md 1a, 4.14), on a phone, in the click dummy.
import { device, check, sleep, DUMMY } from "./lib.mjs";

export default async function ({ b }) {
  const p = await device(b, { phone: true });
  await p.goto(DUMMY); await sleep(2000);
  check(await p.evaluate(() => !document.getElementById("fbar")), "facet bar gone");
  await p.click("#btnMenu"); await sleep(300);
  check(await p.evaluate(() => document.getElementById("fpanel").classList.contains("open")), "panel opens");
  const heads = await p.evaluate(() => [...document.querySelectorAll("#fpanel .jh")].map(x => x.textContent));
  const facs = await p.evaluate(() => [...document.querySelectorAll("#fpanel .fac")].map(x => x.dataset.facetf));
  check(facs.length > 2, "facets listed");
  const n0 = await p.evaluate(() => document.querySelectorAll("#agenda .item").length);
  // tap a facet: off
  await p.evaluate(k => document.querySelector(`#fpanel .fac[data-facetf="${k}"]`).click(), facs[0]); await sleep(300);
  check(await p.evaluate(k => filterState().facet.includes(k), facs[0]), "tap switches facet off");
  check(await p.evaluate(() => !document.getElementById("fline").classList.contains("hidden") && /facets/.test(document.getElementById("fline").textContent)), "fline tells that facets are hidden");
  await p.evaluate(() => openPanel(false)); await sleep(300);
  // save as view via title menu
  await p.click("#homeLink"); await sleep(200);
  check(await p.evaluate(() => !document.getElementById("viewMenu").classList.contains("hidden")), "title opens menu");
  await p.click("#viewMenu [data-vsave]"); await sleep(200);
  await p.type("#viewNewName", "Work view"); await p.keyboard.press("Enter"); await sleep(300);
  check(await p.evaluate(() => viewLines().length === 1 && /^View: Work view \| on /.test(withJ("", () => S.wc.split("\n").find(l => l.startsWith("View:"))))), "view line written");
  check(await p.evaluate(() => document.getElementById("viewName").textContent === "Work view" && document.querySelector("header h1").classList.contains("hasview")), "title shows view");
  check(await p.evaluate(() => document.getElementById("fline").classList.contains("hidden")), "no fline when view unchanged");
  // change: switch another facet off → changed
  await p.evaluate(k => toggleFilter("facet", k, false), facs[1]); await sleep(300);
  check(await p.evaluate(() => document.getElementById("viewName").classList.contains("changed")), "dot when changed");
  const fl = await p.evaluate(() => document.getElementById("fline").textContent);
  check(/changed: − /.test(fl), "fline names the change");
  await p.evaluate(() => document.querySelector("#fline [data-vrev]").click()); await sleep(300);
  check(await p.evaluate(k => !filterState().facet.includes(k) && !document.getElementById("viewName").classList.contains("changed"), facs[1]), "revert restores view");
  // second view: all
  await p.evaluate(() => { saveFilter({ facet: [], off: {} }); writeView("Everything"); }); await sleep(300);
  check(await p.evaluate(() => /on \*$/.test(viewLines()[1] ? withJ("", () => parse(S.wc.split("\n")[viewLines()[1].idx]).text) : "")), "everything stored as *");
  await p.evaluate(() => applyView("Work view")); await sleep(300);
  check(await p.evaluate(k => filterState().facet.includes(k), facs[0]), "applying view restores facets");
  const n1 = await p.evaluate(() => document.querySelectorAll("#agenda .item").length);
  // long press = only, undo
  await p.evaluate(() => openPanel(true)); await sleep(200);
  const el = await p.$(`#fpanel .fac[data-facetf="${facs[2]}"]`);
  const bx = await el.boundingBox();
  await p.mouse.move(bx.x + 20, bx.y + 10); await p.mouse.down(); await sleep(700); await p.mouse.up(); await sleep(300);
  check(await p.evaluate(k => { const f = filterState(); return valuesOf("facet").filter(x => !f.facet.includes(x)).join() === k; }, facs[2]), "long press: only this facet");
  check(await p.evaluate(() => /Only/.test(document.getElementById("toast").textContent)), "toast with undo");
  await p.click("#toastUndo"); await sleep(300);
  check(await p.evaluate(() => !document.getElementById("viewName").classList.contains("changed")), "undo restores");
  // journal heading toggles
  const j0 = await p.evaluate(() => document.querySelector("#fpanel .jh").dataset.fj);
  await p.evaluate(() => document.querySelector("#fpanel .jh").click()); await sleep(300);
  check(await p.evaluate(j => valuesOf("facet").filter(k => k && keyJ(k) === j).every(k => filterState().facet.includes(k)), j0), "tapping a journal heading switches its facets off");
  // edit: rename and delete
  await p.evaluate(() => { panelEdit = true; renderPanel(); }); await sleep(200);
  await p.evaluate(() => { const i = document.querySelector('#fpanel [data-vren="Everything"]'); i.value = "All"; i.dispatchEvent(new Event("change", { bubbles: true })); }); await sleep(300);
  check(await p.evaluate(() => !!viewByName("All") && !viewByName("Everything")), "rename");
  await p.evaluate(() => document.querySelector('#fpanel [data-vdel="All"]').click()); await sleep(300);
  check(await p.evaluate(() => !viewByName("All")), "delete");
  await p.evaluate(() => openPanel(false)); await sleep(300);
  await p.setViewport({ width: 1400, height: 900 }); await sleep(400); await p.evaluate(() => render()); await sleep(300);
  check(await p.evaluate(() => getComputedStyle(document.getElementById("fpanel")).transform === "none"), "panel docked on a wide screen");
  check(!p.errors.length, "no page errors " + p.errors.join(" | "));
}
