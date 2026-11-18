// The panel (ui.md 4.6): the own journal's facets first; the further journals folded below as
// "More journals (n)", allies first, then guests, each by name; it keeps the state it was left
// in and names hidden facets; one journal only: no fold. "without facet" only with such entries.
import { device, newAccount, addLine, check, sleep, settled } from "./lib.mjs";

const make = (p, name, line) => p.evaluate(async (name, line) => {
  const ph = newPhrase("en"); const e = await joinJournal(ph, true, name, true); if (e) return e;
  const id = extraJournals().find(x => x.pendingName === name || journalName(x.id) === name)?.id || extraJournals().slice(-1)[0].id;
  await sync();
  withJ(id, () => { S.wc = (S.wc.trim() ? S.wc + "\n" : "") + line; S.outbox.push({ op: "replace" }); });
  return id;
}, name, line);

export default async function ({ svc, b }) {
  const A = await device(b, { phone: true });
  await newAccount(A, svc.url);
  await addLine(A, "Call the plumber #facet-home");
  await A.evaluate(() => openPanel(true)); await sleep(300);
  check(await A.evaluate(() => !document.getElementById("fpJour")), "one journal: no fold");
  await A.evaluate(() => openPanel(false));

  const z = await make(A, "Zeta", "Zeta task #facet-zz");
  const a = await make(A, "Alpha", "Alpha task #facet-aa");
  const B = await device(b);
  await newAccount(B, svc.url);
  const guest = await B.evaluate(async () => {
    const ph = newPhrase("en"); await joinJournal(ph, true, "Aardvark", true); const id = extraJournals()[0].id;
    await sync(); withJ(id, () => { S.wc = (S.wc.trim() ? S.wc + "\n" : "") + "Guest task #facet-gg"; S.outbox.push({ op: "replace" }); });
    for (let i = 0; i < 10 && withJ(id, () => S.outbox.length); i++) { await sync(); await new Promise(r => setTimeout(r, 500)); }
    return journalCode(id, "guest");
  });
  check(!(await A.evaluate(c => joinJournal(c), guest)), "a guest journal is added");
  await A.waitForFunction(async () => { await sync(); return journals().length === 4 && journals().every(j => !j || journalName(j) !== j.slice(0, 4).toUpperCase()) && journals().some(j => /Guest task/.test(withJ(j, () => S.wc))); }, { timeout: 30000, polling: 1000 }).catch(() => {});
  await settled(A);
  await A.evaluate(() => openPanel(true)); await sleep(300);
  const st = await A.evaluate(() => { const d = document.getElementById("fpJour"); return d && { sum: d.querySelector("summary").textContent, open: d.open, order: [...d.querySelectorAll(".jh")].map(x => x.textContent.trim()), firstOwn: document.querySelector("#fpanel .jh")?.closest("#fpJour") === null }; });
  check(st && /^More journals \(3\) · 3 facets$/.test(st.sum) && !st.open && st.firstOwn, "the further journals folded under the own one: " + JSON.stringify(st));
  check(st && JSON.stringify(st.order.map(x => x.replace("read only", ""))) === JSON.stringify(["Alpha", "Zeta", "Aardvark"]), "guests after allies, whatever their names: " + JSON.stringify(st && st.order));
  // A hidden facet in there keeps it open.
  await A.evaluate(() => { document.getElementById("fpJour").open = true; }); await sleep(100);
  await A.evaluate(() => [...document.querySelectorAll("#fpJour .fac")].pop().click()); await sleep(200);
  // Closed by hand: it stays closed, and its line says what is hidden.
  await A.evaluate(() => { document.getElementById("fpJour").open = false; }); await sleep(200);
  await A.evaluate(() => { openPanel(false); openPanel(true); }); await sleep(200);
  check(await A.evaluate(() => !document.getElementById("fpJour").open && /· 3 facets$/.test(document.querySelector("#fpJour summary").textContent)), "closed stays closed after closing and opening the panel, with the number of their facets");
  await A.evaluate(() => { document.getElementById("fpJour").open = true; }); await sleep(200);
  await A.evaluate(() => { openPanel(false); openPanel(true); }); await sleep(200);
  check(await A.evaluate(() => document.getElementById("fpJour").open), "open stays open");
  // Without facet: only with entries without a facet, below the own journal.
  await A.evaluate(() => document.querySelector('#fpanel [data-fnone]').click()); await sleep(200);
  check(await A.evaluate(() => !document.querySelector('#fpanel [data-facetf=""]')), "no row without facet when no entry lacks one");
  await A.evaluate(() => document.querySelector('#fpanel [data-fall]').click()); await sleep(100);
  await A.evaluate(() => openPanel(false));
  await A.evaluate(() => { S.wc += "\nLoose note #date-" + today(); render(); }); await sleep(200);
  await A.evaluate(() => openPanel(true)); await sleep(200);
  check(await A.evaluate(() => { const r = document.querySelector('#fpanel [data-facetf=""]'); return r && r.nextElementSibling && r.nextElementSibling.id === "fpJour"; }), "with one, the row stands below the own journal, before More journals");
  // A facet without current entries stays in the list when switched on.
  await A.evaluate(() => { S.wc += "\nAbout quiet #facet-quiet #type-meta"; render(); });
  await A.evaluate(() => document.querySelector('#fpanel [data-fnone]').click()); await sleep(150);
  await A.evaluate(() => [...document.querySelectorAll("#fpanel .fac")].find(x => /quiet/.test(x.textContent)).click()); await sleep(150);
  check(await A.evaluate(() => { const b = [...document.querySelectorAll("#fpanel .fac")].find(x => /quiet/.test(x.textContent)); return b && !b.classList.contains("off"); }), "a facet without entries stays in the list when switched on");
  await A.evaluate(() => document.querySelector('#fpanel [data-fall]').click());
  check(!A.errors.length && !B.errors.length, "no page errors " + A.errors.concat(B.errors).join(" | "));
}
