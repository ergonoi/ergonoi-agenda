// Header colour per person (ui.md 4.11e) and Lock (4.12a): the colour stays with the person in
// this browser; the lock sits at the right end on desktops only, centred with the other icons,
// and closes the journals until the PIN is entered again.
import { device, newAccount, check, sleep, settled } from "./lib.mjs";

const bg = p => p.evaluate(() => getComputedStyle(document.querySelector("header")).backgroundColor);
const mid = (p, id) => p.evaluate(i => { const r = document.getElementById(i).getBoundingClientRect(); return r.width ? r.top + r.height / 2 : null; }, id);

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1400, height: 900 });
  await newAccount(A, svc.url); await settled(A);
  const before = await bg(A);
  await A.evaluate(() => { setView("settings"); settingsTab("device"); document.querySelector('#hdrColor [data-hdr="robin"]').click(); }); await sleep(200);
  check(await bg(A) === "rgb(151, 226, 227)" && before !== await bg(A), "Robin colours the header: " + await bg(A));
  check(await A.evaluate(() => document.querySelector('#hdrColor [data-hdr="robin"]').getAttribute("aria-checked") === "true"), "the choice is marked");
  await A.reload(); await sleep(1500); await settled(A);
  check(await bg(A) === "rgb(151, 226, 227)", "the colour stays after a reload");

  // Lock: at the right end, centred with the other icons.
  check(await A.evaluate(() => !document.getElementById("btnLock").classList.contains("hidden") && document.querySelector("header .hbtns").lastElementChild.id === "btnLock"), "the lock is the last icon of the header");
  const dl = await mid(A, "btnLock"), ds = await mid(A, "btnSettings");
  check(dl !== null && Math.abs(dl - ds) < 1, `centred with the other icons (${dl} / ${ds})`);
  A.evaluate(() => document.getElementById("btnLock").click()).catch(() => {});
  await A.waitForFunction(() => document.getElementById("dlgPin")?.open, { timeout: 15000 });
  check(await A.evaluate(() => typeof S === "undefined"), "Lock closes the journals until the PIN");
  await A.evaluate(() => { document.getElementById("pin1").value = "111111"; document.getElementById("pinOk").click(); });
  await A.waitForFunction(() => typeof S !== "undefined" && S.keys, { timeout: 15000 });

  // Silent PIN: nothing to lock, so no lock.
  await A.evaluate(() => { setView("settings"); settingsTab("device"); document.querySelector('#pinLevel [data-v="silent"]').click(); });
  await A.waitForFunction(() => document.getElementById("dlgPin")?.open, { timeout: 15000 });
  await A.evaluate(() => { document.getElementById("pin1").value = "111111"; document.getElementById("pinOk").click(); }); await sleep(2500);
  check(await A.evaluate(() => document.getElementById("btnLock").classList.contains("hidden") && document.getElementById("btnLockNow").classList.contains("hidden")), "no lock with the silent PIN");

  // Phone: never in the header.
  const P = await device(b, { phone: true });
  await newAccount(P, svc.url);
  check(await P.evaluate(() => getComputedStyle(document.getElementById("btnLock")).display === "none" && !document.getElementById("btnLockNow").classList.contains("hidden")), "phone: no lock in the header, but in the settings");
  check(!A.errors.length && !P.errors.length, "no page errors " + A.errors.concat(P.errors).join(" | "));
}
