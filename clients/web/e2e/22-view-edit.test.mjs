// Editing views (ui.md 4.6): after Edit each view offers Select; the selected view takes every
// change of the filter at once, without Save and without the line "changed"; another view can be
// selected next; Done ends editing. About stands below Log in System.
import { device, newAccount, addLine, check, sleep } from "./lib.mjs";

const onOf = (p, n) => p.evaluate(n => viewByName(n)?.on.join(" "), n);
const fac = (p, n) => p.evaluate(n => [...document.querySelectorAll("#fpanel .fac")].find(x => x.textContent.startsWith(n)).click(), n);

export default async function ({ svc, b }) {
  const A = await device(b, { phone: true });
  await newAccount(A, svc.url);
  for (const l of ["Call the plumber #facet-home", "Order boards #facet-work", "Ride #facet-sport"]) await addLine(A, l);
  await A.evaluate(() => { const f = filterState(); f.facet = valuesOf("facet").filter(k => facetName(k) !== "home"); saveFilter(f); writeView("Home");
    const g = filterState(); g.facet = valuesOf("facet").filter(k => facetName(k) !== "work"); saveFilter(g); writeView("Work"); applyView("Home"); });
  await A.evaluate(() => openPanel(true)); await sleep(200);
  await A.evaluate(() => document.querySelector("#fpanel [data-vedit]").click()); await sleep(200);
  check(await A.evaluate(() => document.querySelectorAll("#fpanel [data-vsel]").length === 2 && !document.querySelector("#fpanel [data-vdel]")), "Edit: Select for every view, no Delete yet");
  await A.evaluate(() => document.querySelector('#fpanel [data-vsel="Home"]').click()); await sleep(200);
  check(await A.evaluate(() => !!document.querySelector('#fpanel .vedit.sel [data-vdel="Home"]') && document.querySelectorAll("#fpanel [data-vsel]").length === 1), "the selected view shows Delete and its name field");
  await fac(A, "sport"); await sleep(300);
  check(/sport@/.test(await onOf(A, "Home")) && await A.evaluate(() => !document.getElementById("fline").textContent.includes("changed")), "a tap goes into the view at once, no line changed: " + await onOf(A, "Home"));
  await A.evaluate(() => document.querySelector('#fpanel [data-vsel="Work"]').click()); await sleep(200);
  await fac(A, "home"); await sleep(300);
  check(/home@/.test(await onOf(A, "Work")) && /sport@/.test(await onOf(A, "Home")), "the next view selected takes the next change: " + await onOf(A, "Work"));
  await A.evaluate(() => document.querySelector("#fpanel [data-vedit]").click()); await sleep(200);
  await fac(A, "work"); await sleep(300);
  check(/work@/.test(await onOf(A, "Work")) && await A.evaluate(() => document.getElementById("fline").textContent.includes("changed")), "after Done a change is reported, not written");
  await A.evaluate(() => { openPanel(false); setView("settings"); settingsTab("system"); }); await sleep(200);
  check(await A.evaluate(() => { const hs = [...document.querySelectorAll('section[data-st="system"] h3')].map(h => h.textContent); return hs.indexOf("Log") < hs.indexOf("About"); }), "About below Log");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
