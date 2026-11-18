// Screenshots of the current state for design/index.html (appendix A). Run: node design-shots.mjs
import { join } from "node:path";
import { ROOT, browser, device, newAccount, joinAccount, sleep, startService, settled } from "./lib.mjs";
const OUT = join(ROOT, "design", "shots") + "/";
const svc = await startService(); const b = await browser();
const D = await device(b, { width: 1440, height: 900 }); await D.emulateTimezone("Europe/Berlin");
const phrase = await newAccount(D, svc.url);
const data = [
  "School #facet-family #date-2026-11-28 #time-08:00 #recurring-weekly",
  "Athletics #facet-family #date-2026-11-28 #time-17:30-19:00",
  "Send the invoice to the joinery #facet-work #date-2026-11-26 #rank-high",
  "Climbing #facet-family #date-2026-11-29 #time-17:30",
  "Reading rehearsal #facet-school #date-2026-11-29",
  "Review the offer #facet-work #date-2026-11-30 #time-10:00",
  "Trombone lesson #facet-music #date-2026-12-01 #time-13:45-14:00 #recurring-weekly",
  "Handball #facet-sport #date-2026-12-01 #time-15:30-17:00",
  "Volleyball #facet-sport #date-2026-12-02 #time-18:30-20:30",
  "Big band #facet-music #date-2026-12-03 #time-14:45",
  "Workshop on planing #facet-work #date-2026-12-04 #date-2026-12-05",
  "Maths test #facet-school #date-2026-12-07",
  "Christmas market #facet-family #date-2026-12-12 #time-18:00",
  "Plumber {{Phone 089 123456}} #facet-private"];
await D.evaluate(d => { withJ("", () => { S.wc = S.wc.split("\n").filter(l => !/^Example/.test(l)).concat(d).join("\n"); }); render(); sync(); }, data);
await sleep(2500); await settled(D);
const shot = async (p, n) => { await sleep(500); await p.screenshot({ path: OUT + n + ".png" }); };
await shot(D, "desktop-list");
await D.evaluate(() => document.querySelectorAll("#agenda .item")[4].click()); await shot(D, "desktop-detail");
await D.evaluate(() => document.querySelector('[data-v="month"], #tabMonth, header .vtabs button:nth-child(2)').click()); await shot(D, "desktop-month");
await D.evaluate(() => document.querySelector("header .vtabs button").click()); await sleep(300);
await D.evaluate(() => document.getElementById("btnSettings").click()); await shot(D, "desktop-settings");
await D.evaluate(() => document.getElementById("btnSettings").click()); await sleep(300);
await D.evaluate(() => { const i = document.querySelectorAll("#agenda .item")[2]; openSheet?.(i.dataset.line ?? 2); }).catch(e => console.log("sheet", e.message)); await shot(D, "desktop-sheet");
await D.reload(); await sleep(1500);
const P = await device(b, { phone: true }); await P.emulateTimezone("Europe/Berlin");
await joinAccount(P, svc.url, phrase); await sleep(1500); await settled(P);
await shot(P, "phone-list");
await P.evaluate(() => openPanel(true)); await shot(P, "phone-panel");
await P.evaluate(() => openPanel(false)); await sleep(300);
await P.evaluate(() => document.querySelector("#bnav button:nth-child(2)")?.click()); await shot(P, "phone-month");
await P.evaluate(() => document.querySelector("#bnav button")?.click()); await sleep(300);
await P.evaluate(() => { const i = document.querySelectorAll("#agenda .item")[2]; openSheet?.(i.dataset.line ?? 2); }).catch(e => console.log("sheet", e.message)); await shot(P, "phone-sheet");
await P.reload(); await sleep(1500);
await P.evaluate(() => document.getElementById("btnSettings").click()); await shot(P, "phone-settings");
console.log("errors", D.errors, P.errors);
await b.close(); process.exit(0);
