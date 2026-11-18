// The start page of a new device (ui.md 4.11a): what it is, the server and whether it answers,
// two ways in; a shared journal's code entered first leads to the own journal, then adds it.
import { device, newAccount, check, sleep, settled } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { phone: true, width: 390, height: 844 });
  await A.goto(svc.url);
  await A.waitForFunction(() => document.getElementById("dlgSetup")?.open, { timeout: 10000 });
  await sleep(800);
  check(await A.evaluate(() => document.getElementById("dlgSetup").classList.contains("first") && /an open planning journal/.test(document.querySelector("#dlgSetup .sh").textContent)), "a page of its own with what it is");
  check(await A.evaluate(() => document.getElementById("srvState").textContent === "reachable"), "the server is shown as reachable");
  check(await A.evaluate(() => document.querySelectorAll("#dlgSetup .er").length === 2 && !document.getElementById("btnTakeOver").offsetParent), "two ways in, no separate takeover row");
  check(await A.evaluate(() => [...document.querySelectorAll("#dlgSetup input, #dlgSetup select, #dlgSetup textarea")].every(e => e.type === "checkbox" || parseFloat(getComputedStyle(e).fontSize) >= 16)), "no field under 16 px on a touch screen");
  // an owner shares a journal; a new device enters that code first
  const O = await device(b);
  await newAccount(O, svc.url);
  const code = await O.evaluate(() => allyCodeOf(S.phrase, "en"));
  await A.evaluate(() => document.getElementById("btnExistingAccount").click()); await sleep(200);
  await A.type("#phraseInput", code); await A.evaluate(() => document.getElementById("setupOk").click()); await sleep(1500);
  check(await A.evaluate(() => !document.getElementById("setupShared").classList.contains("hidden")), "a shared code leads to: first your own journal");
  await A.evaluate(() => document.getElementById("btnSharedNew").click()); await sleep(300);
  const words = await A.evaluate(() => { const p = pendingPhrase.split(" "); return p[checkIdx[0]] + " " + p[checkIdx[1]]; });
  await A.type("#checkWords", words); await A.type("#newName", "Mine");
  await A.evaluate(() => document.getElementById("setupOk").click());
  await A.waitForFunction(() => !document.getElementById("setupJoin").classList.contains("hidden") || document.getElementById("pinWithout")?.offsetParent, { timeout: 20000 }).catch(() => {});
  await sleep(500);
  check(await A.evaluate(() => !document.getElementById("setupJoin").classList.contains("hidden") || typeof setupOther === "string"), "afterwards the shared journal is offered");
  check(!A.errors.length && !O.errors.length, "no page errors " + A.errors.concat(O.errors).join(" | "));
}
