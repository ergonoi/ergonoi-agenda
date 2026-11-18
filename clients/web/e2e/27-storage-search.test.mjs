// Search past the filter with one tap (ui.md 4.6); storage per journal and the largest entries,
// a warning from 80 % (ui.md 4.11g); notes are cut to fit one encrypted line (architecture 2.4).
import { device, newAccount, check, sleep, settled } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1440, height: 900 });
  await newAccount(A, svc.url);
  await A.evaluate(() => { withJ("", () => { S.wc = S.wc + "\nCall Katrin about the oak #facet-work\nKatrin birthday #facet-private"; }); render(); });
  await A.evaluate(() => { saveFilter({ facet: [valuesOf("facet").find(k => /work/.test(k))], off: {} }); render(); }); await sleep(300);
  await A.evaluate(() => { openSearch(true); $("searchQ").value = "katrin"; $("searchQ").dispatchEvent(new Event("input")); }); await sleep(400);
  check(await A.evaluate(() => !!document.querySelector("#sline [data-sall]")), "the search line offers to show what the filter hides");
  await A.evaluate(() => document.querySelector("#sline [data-sall]").click()); await sleep(400);
  check(await A.evaluate(() => /without the filter/.test($("sline").textContent) && [...document.querySelectorAll("#agenda .item")].filter(e => /Katrin/.test(e.textContent)).length === 2), "one tap shows both, the filter stays as it was");
  check(await A.evaluate(() => filterState().facet.length === 1), "the filter itself is unchanged");
  await A.evaluate(() => openSearch(false)); await sleep(200);

  // A note too long for one encrypted line is cut to fit.
  const fit = await A.evaluate(() => { const x = parse("Umlauts #facet-private"); const v = "ä".repeat(3000); const out = fitNoteTo(x, v); return { n: out.length, fits: lineFits(toLine({ ...x, note: out })) }; });
  check(fit.n < 3000 && fit.fits, "a note of two-byte letters is cut to fit one line " + JSON.stringify(fit));

  // Storage: the entry with the long note comes first.
  await A.evaluate(() => { withJ("", () => { S.wc = S.wc + "\nOld meeting {{" + "x".repeat(3000) + "}} #date-2025-01-10 #facet-work"; }); render(); sync(); });
  await A.waitForFunction(() => withJ("", () => /Old meeting/.test(S.snap)), { timeout: 20000 });
  await A.evaluate(() => { document.getElementById("btnSettings").click(); document.querySelector('[data-stab="data"]').click(); }); await sleep(400);
  const first = await A.evaluate(() => document.querySelector("#storageList .stitem")?.textContent || "");
  check(/Old meeting/.test(first) && /note 2\.9 KB/.test(first), "the largest entry is listed first with its note " + first);
  check(await A.evaluate(() => /%/.test(document.querySelector("#storageList .strow").textContent)), "the journal shows its share of 5 MB");
  // Warning from 80 %.
  const warned = await A.evaluate(() => { const keep = S.snap; S.snap = keep + ("\n" + "y".repeat(3000)).repeat(1100); storageCheck(); S.snap = keep; return /of its 5 MB/.test(document.body.textContent); });
  check(warned, "a journal above 80 % gets a warning");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
