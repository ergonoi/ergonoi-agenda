// Header on wide screens (ui.md 1a): view tabs with symbols, no buttons; the sync block over the
// right column, its dot flush with the column's text; the clipboard as a ring around the sync dot (4.16); the bookmark shows the memos (4.2b); the
// microphone on the middle line of the add field.
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1600, height: 900 });
  await newAccount(A, svc.url);
  await A.evaluate(() => document.documentElement.classList.add("minimal"));
  const tab = await A.evaluate(() => { const t = getComputedStyle($("tabMonth")); return { svg: !!$("tabMonth").querySelector("svg"), border: t.borderTopWidth === "0px" || t.borderTopColor === "rgba(0, 0, 0, 0)" ? "none" : t.borderTopColor + " " + t.borderTopWidth, side: t.borderLeftWidth, bg: t.backgroundColor }; });
  check(tab.svg && tab.border === "none" && tab.side === "0px" && /rgba\(0, 0, 0, 0\)|transparent/.test(tab.bg), "view tabs with a symbol, no frame, no fill " + JSON.stringify(tab));
  const pos = await A.evaluate(() => {
    const dot = document.querySelector("#status .dot").getBoundingClientRect(), det = $("detail");
    const txt = [...det.querySelectorAll("*")].find(x => /^Choose/.test(x.textContent.trim()) && !x.children.length).getBoundingClientRect();
    return { dot: dot.left, text: txt.left, top: dot.top, hh: document.querySelector("header").getBoundingClientRect().bottom };
  });
  check(Math.abs(pos.dot - pos.text) < 2 && pos.top < pos.hh, "the sync dot stands over the right column, flush with its text " + JSON.stringify(pos));
  const right = await A.evaluate(() => { const s = [...document.querySelectorAll("header .hbtns > button")].filter(x => x.offsetParent).pop().getBoundingClientRect(), a = document.querySelector("#add > button:last-child").getBoundingClientRect(); return { s: s.right, a: a.right }; });
  check(Math.abs(right.s - right.a) < 12, "the symbols close the middle column above Add " + JSON.stringify(right));
  await A.evaluate(() => $("btnMic").classList.remove("hidden"));
  const mic = await A.evaluate(() => { const c = r => (r.top + r.bottom) / 2; return Math.abs(c($("btnMic").querySelector("svg").getBoundingClientRect()) - c(document.querySelector("#add > button:last-child").getBoundingClientRect())); });
  check(mic < 1, "the microphone on the middle line of Add (" + mic + ")");
  check(await A.evaluate(() => getComputedStyle($("btnClip")).display === "none"), "no clipboard symbol in the header");
  await A.evaluate(() => { clipLabel = "bill.pdf"; renderStatus(); });
  const cl = await A.evaluate(() => ({ ring: document.querySelector("#status .dot").classList.contains("filled"), text: /Clipboard/.test($("status").textContent) }));
  check(cl.ring && !cl.text, "a filled clipboard rings the sync dot, no line of text " + JSON.stringify(cl));
  await A.evaluate(() => document.querySelector("#status .dot").click()); await sleep(200);
  check(await A.evaluate(() => $("dlgClip").open), "a click on the dot opens the clipboard");
  await A.evaluate(() => $("dlgClip").close());

  await A.evaluate(() => { S.wc += "\nRecipe pancakes #facet-work #type-memo"; render(); });
  check(await A.evaluate(() => !/Recipe pancakes/.test($("agenda").textContent)), "a memo is not in the list");
  await A.evaluate(() => $("btnMemo").click()); await sleep(200);
  const memo = await A.evaluate(() => ({ t: $("agenda").textContent, list: $("tabAgenda").getAttribute("aria-pressed") }));
  check(/Memos/.test(memo.t) && /Recipe pancakes/.test(memo.t) && !/Example: buy/.test(memo.t) && memo.list === "false", "the bookmark shows the memos only, no view tab chosen");
  await A.evaluate(() => $("btnMemo").click()); await sleep(200);
  check(await A.evaluate(() => !/Recipe pancakes/.test($("agenda").textContent) && $("btnMemo").getAttribute("aria-pressed") === "false" && $("tabAgenda").getAttribute("aria-pressed") === "true"), "the bookmark again leads back to the view");
  await A.evaluate(() => $("btnMemo").click()); await sleep(100);
  await A.evaluate(() => $("tabAgenda").click()); await sleep(200);
  check(await A.evaluate(() => !/Recipe pancakes/.test($("agenda").textContent) && $("btnMemo").getAttribute("aria-pressed") === "false"), "List leaves the memos");
  const gap = await A.evaluate(() => $("btnMemo").getBoundingClientRect().left - document.querySelector("header .vtabs").getBoundingClientRect().right);
  check(gap >= 32, "the view tabs keep a distance from the symbols (" + Math.round(gap) + " px)");

  const P = await device(b, { phone: true });
  await newAccount(P, svc.url);
  await P.evaluate(() => { clipLabel = "photo.jpg"; renderStatus(); });
  check(await P.evaluate(() => $("hdot").classList.contains("filled")), "on the phone a filled clipboard rings the sync dot");
  check(!A.errors.length && !P.errors.length, "no page errors " + A.errors.concat(P.errors).join(" | "));
}
