// Swipes (ui.md 5.2, 5.2a): leftward on an entry opens Done / reschedule; rightward anywhere in
// the list opens the panel on touch screens; leftward on the panel closes it. The desktop with
// its docked panel has no panel swipe.
import { device, newAccount, addLine, check, sleep } from "./lib.mjs";

const swipe = (p, sel, dx, type = "touch") => p.evaluate((sel, dx, type) => {
  const el = typeof sel === "string" ? document.querySelector(sel) : null;
  const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + Math.min(r.height / 2, 20);
  const ev = (t, cx) => new PointerEvent(t, { bubbles: true, pointerId: 7, pointerType: type, clientX: cx, clientY: y, button: 0 });
  el.dispatchEvent(ev("pointerdown", x));
  for (let i = 1; i <= 10; i++) window.dispatchEvent(ev("pointermove", x + dx * i / 10));
  window.dispatchEvent(ev("pointerup", x + dx));
}, sel, dx, type);

export default async function ({ svc, b }) {
  const P = await device(b, { phone: true });
  await newAccount(P, svc.url);
  await addLine(P, "Call the plumber #facet-home");
  const first = '#agenda .item[data-line]';
  await swipe(P, first, 140); await sleep(300);
  check(await P.evaluate(() => document.getElementById("sheet").classList.contains("hidden") && document.getElementById("fpanel").classList.contains("open")), "rightward on an entry: the panel, not the sheet");
  await swipe(P, "#fpanel", -140); await sleep(300);
  check(await P.evaluate(() => !document.getElementById("fpanel").classList.contains("open")), "leftward on the panel closes it");
  await swipe(P, first, -140); await sleep(300);
  check(await P.evaluate(() => !document.getElementById("sheet").classList.contains("hidden") && !document.getElementById("fpanel").classList.contains("open")), "leftward on an entry: Done / reschedule");
  check(await P.evaluate(() => !document.querySelector("#agenda .item[style*=translate]")), "no entry stays shifted");
  await P.evaluate(() => closeSheet && closeSheet()); await sleep(200);
  await swipe(P, first, -30); await sleep(300);
  check(await P.evaluate(() => document.getElementById("sheet").classList.contains("hidden")), "a short swipe springs back");

  const D = await device(b, { width: 1500, height: 900 });
  await newAccount(D, svc.url);
  await addLine(D, "Call the plumber #facet-home");
  const before = await D.evaluate(() => document.getElementById("fpanel").classList.contains("open"));
  await swipe(D, first, 160); await sleep(300);
  check(await D.evaluate(b => document.getElementById("fpanel").classList.contains("open") === b && document.getElementById("sheet").classList.contains("hidden"), before), "desktop: rightward changes nothing");
  check(!P.errors.length && !D.errors.length, "no page errors " + P.errors.concat(D.errors).join(" | "));
}
