// The phone layout (ui.md 1a, steps 1, 2 and 4) in the click dummy: bottom bar, header,
// menu, settings pages, search in the header.
import { device, check, sleep, DUMMY } from "./lib.mjs";

export default async function ({ b }) {
  const p = await device(b, { phone: true });
  await p.goto(DUMMY); await sleep(2000);
  const shown = sel => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== "none" && e.offsetParent !== null; }, sel);

  // Header: one task, icons on one centre line, no tabs.
  check(await shown("#btnMenu") && await shown("#btnSearch") && await shown("#hdot") && !(await shown(".vtabs")) && !(await shown("#btnSettings")), "header: menu, search, sync dot; no tabs or gear");
  const centres = await p.evaluate(() => ["btnMenu", "btnClip", "btnSearch", "hdot"].map(id => document.getElementById(id)).filter(e => e && e.offsetParent)
    .map(e => { const g = (e.querySelector("svg, .dot") || e).getBoundingClientRect(); return Math.round((g.top + g.height / 2) * 2) / 2; }));
  check(Math.max(...centres) - Math.min(...centres) <= 1, "header icons on one centre line (" + centres.join(", ") + ")");

  // Bottom bar.
  for (const v of ["month", "text", "agenda"]) {
    await p.evaluate(v => document.querySelector(`#bnav [data-bv="${v}"]`).click(), v); await sleep(200);
    const ok = await p.evaluate(v => document.querySelector(`#bnav [data-bv="${v}"]`).getAttribute("aria-pressed") === "true"
      && (v === "month" ? monthMode && !!document.querySelector("#agenda .cal") : v === "agenda" ? view === "agenda" && !monthMode : view === v), v);
    check(ok, "bottom bar opens " + v);
  }

  // Menu → settings pages with back arrow and title.
  const titles = { device: "Device", system: "System", account: "Account", data: "Journals and data" };
  for (const [k, t] of Object.entries(titles)) {
    await p.evaluate(k => { openPanel(true); document.querySelector(`#fpanel [data-mset="${k}"]`).click(); }, k); await sleep(250);
    check(await p.evaluate(t => document.getElementById("setTitle").textContent === t && view === "settings", t) && !(await shown("#setTabs")), "menu opens the page " + t + " without tabs");
  }
  await p.click("#setBack"); await sleep(250);
  check(await p.evaluate(() => view === "agenda" && document.getElementById("fpanel").classList.contains("open")), "back arrow returns to the menu");
  await p.evaluate(() => openPanel(false));

  // Switches instead of check boxes; danger as a red row.
  await p.evaluate(() => { setView("settings"); settingsTab("device"); }); await sleep(200);
  check(await p.evaluate(() => { const i = document.getElementById("cfgCompact"); const cs = getComputedStyle(i); return cs.appearance === "none" && parseInt(cs.width) >= 48; }), "display options are switches");
  check(await p.evaluate(() => getComputedStyle(document.getElementById("cfgReset")).color.replace(/\s/g, "") === "rgb(255,46,0)"), "clearing the browser is a Scarlet row");
  check(await p.evaluate(() => !/Server account/.test(document.getElementById("viewSettings").innerText) || !document.getElementById("setMode").offsetParent), "mode line only on the account page");

  // Journal rows open the journal.
  await p.evaluate(() => settingsTab("data")); await sleep(200);
  await p.evaluate(() => document.querySelector("#journalList .jr .nm, #journalList .jr").click()); await sleep(300);
  check(await p.evaluate(() => document.getElementById("dlgJournal").open), "a journal row opens its dialog");
  await p.evaluate(() => document.getElementById("dlgJournal").close());

  // Search in the header.
  await p.evaluate(() => setView("agenda")); await sleep(200);
  await p.click("#btnSearch"); await sleep(200);
  check(await shown("#hsearch") && !(await shown("header h1")) && !(await shown("#add")), "search takes the place of the title; add field hidden");
  await p.type("#searchQ", "a"); await sleep(300);
  check(await p.evaluate(() => /Search: /.test(document.getElementById("sline").textContent) && !!document.querySelector("#sline [data-sdone]")), "result line with include done");
  await p.click("#searchBack"); await sleep(200);
  check(await shown("header h1") && await shown("#add") && await p.evaluate(() => !SEARCH.open), "back arrow closes the search");
  check(!p.errors.length, "no page errors " + p.errors.join(" | "));
}
