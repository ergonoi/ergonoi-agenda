// PIN levels (ui.md 4.12a): set, unlock, wrong attempts, change, turn off.
import { device, newAccount, addLine, check, sleep, settled } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b);
  const phrase = await newAccount(A, svc.url);
  await addLine(A, "Call the plumber #facet-self");
  const open = id => A.evaluate(i => !!document.getElementById(i)?.open, id);
  const typePin = async (a, b2) => {
    await A.evaluate((a, b2) => { document.getElementById("pin1").value = a; document.getElementById("pin2").value = b2 ?? ""; }, a, b2);
    await A.click("#pinOk"); await sleep(2000);
  };
  const level = v => A.evaluate(v => { setView("settings"); settingsTab("device"); document.querySelector(`#pinLevel [data-v="${v}"]`).click(); }, v);

  await level("session"); await sleep(400);
  check(await open("dlgPin"), "choosing a level asks for a new PIN");
  await typePin("12345", "12345");
  check(await A.evaluate(() => /six to twelve/.test(document.getElementById("pinMsg").textContent)), "too short refused");
  await typePin("123456", "123457");
  check(await A.evaluate(() => /differ/.test(document.getElementById("pinMsg").textContent)), "mismatch refused");
  await typePin("123456", "123456");
  check(!(await open("dlgPin")), "PIN set");
  check(await A.evaluate(ph => !Object.keys(localStorage).some(k => k === "agenda.phrase" || k === "agenda.keys") && !Object.values(localStorage).some(v => v.includes(ph.split(" ")[0] + " " + ph.split(" ")[1])), phrase), "words no longer stored in plain text");

  // A restart of the browser (session storage gone) asks for the PIN.
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500);
  check(await open("dlgPin") && await A.evaluate(() => typeof S === "undefined"), "restart asks for the PIN before the app starts");
  await typePin("000000");
  check(await A.evaluate(() => /Wrong PIN/.test(document.getElementById("pinMsg").textContent)), "wrong PIN refused");
  await typePin("123456"); await settled(A);
  check(!(await open("dlgPin")) && await A.evaluate(() => S.wc.includes("Call the plumber")), "right PIN opens, entries back");

  // Five wrong attempts make it wait, even for the right PIN.
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500);
  for (let i = 0; i < 5; i++) await typePin("111111");
  check(await A.evaluate(() => /Wait 60 s/.test(document.getElementById("pinMsg").textContent)), "waits after five wrong attempts");
  await typePin("123456");
  check(await open("dlgPin"), "the right PIN waits too");
  await A.evaluate(() => localStorage.setItem("agenda.pinWait", JSON.stringify({ n: 5, until: 0 })));
  await typePin("123456"); await settled(A);
  check(!(await open("dlgPin")), "after the wait the right PIN opens");

  // Change the PIN.
  await A.evaluate(() => { Vault.shownAt = 0; setView("settings"); settingsTab("device"); document.getElementById("btnPinChange").click(); }); await sleep(300);
  await typePin("123456"); await sleep(200);
  check(await A.evaluate(() => document.getElementById("pinTitle").textContent === "Choose a new PIN"), "change asks for the new PIN after the old");
  await typePin("98765432", "98765432");
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500);
  await typePin("123456");
  check(await open("dlgPin"), "old PIN no longer opens");
  await typePin("98765432"); await settled(A);
  check(!(await open("dlgPin")), "new PIN opens");

  // Turn it off: the PIN is asked once, then storage is plain again.
  await A.evaluate(() => { Vault.shownAt = 0; }); await level("off"); await sleep(300);
  await typePin("98765432"); await sleep(500);
  check(await A.evaluate(() => Vault.mode === "off" && !!localStorage.getItem("agenda.phrase")), "turned off: plain storage again");
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500); await settled(A);
  check(!(await open("dlgPin")) && await A.evaluate(() => S.wc.includes("Call the plumber")), "without PIN the app opens directly");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
