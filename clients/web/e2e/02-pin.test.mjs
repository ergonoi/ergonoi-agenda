// PIN levels (ui.md 4.12a): required at setup, unlock, wrong attempts, change, silent.
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

  // The PIN is required at setup (111111 here); no way past it is offered.
  check(await A.evaluate(() => Vault.mode === "on" && !document.getElementById("pinWithout")), "a PIN from the start, no way without");
  check(await A.evaluate(ph => !Object.keys(localStorage).some(k => k === "agenda.phrase" || k === "agenda.keys") && !Object.values(localStorage).some(v => v.includes(ph.split(" ")[0] + " " + ph.split(" ")[1])), phrase), "words not stored in plain text");
  await A.evaluate(() => { Vault.shownAt = 0; setView("settings"); settingsTab("device"); document.getElementById("btnPinChange").click(); }); await sleep(300);
  await typePin("111111");
  await typePin("12345", "12345");
  check(await A.evaluate(() => /six to twelve/.test(document.getElementById("pinMsg").textContent)), "too short refused");
  await typePin("123456", "123457");
  check(await A.evaluate(() => /differ/.test(document.getElementById("pinMsg").textContent)), "mismatch refused");
  await typePin("123456", "123456");
  check(!(await open("dlgPin")), "PIN changed to 123456");

  // A restart of the browser (session storage gone) asks for the PIN.
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500);
  check(await open("dlgPin") && await A.evaluate(() => typeof S === "undefined"), "restart asks for the PIN before the app starts");
  await typePin("000000");
  check(await A.evaluate(() => /Wrong PIN/.test(document.getElementById("pinMsg").textContent)), "wrong PIN refused");
  await typePin("123456"); await settled(A);
  check(!(await open("dlgPin")) && await A.evaluate(() => S.wc.includes("Call the plumber")), "right PIN opens, entries back");

  // Five wrong attempts make it wait, even for the right PIN.
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500);
  for (let i = 0; i < 5; i++) await typePin("000001");
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

  // Silent: the PIN is asked once to lower the level; then the app opens without it, the
  // store stays encrypted, and words still need the PIN.
  await A.evaluate(() => { Vault.shownAt = 0; }); await level("silent"); await sleep(300);
  await typePin("98765432"); await sleep(500);
  check(await A.evaluate(() => Vault.level() === "silent" && !localStorage.getItem("agenda.phrase") && !!localStorage.getItem("agenda.vkeep")), "silent: store encrypted, key kept in the browser");
  await A.evaluate(() => sessionStorage.clear()); await A.reload(); await sleep(1500); await settled(A);
  check(!(await open("dlgPin")) && await A.evaluate(() => S.wc.includes("Call the plumber")), "silent: the app opens directly");
  await A.evaluate(() => { setView("settings"); settingsTab("account"); document.getElementById("btnShowPhrase").click(); }); await sleep(300);
  check(await open("dlgPin"), "silent: words still need the PIN");
  await typePin("98765432");
  check(await A.evaluate(() => document.getElementById("phraseBox").textContent.split(" ").length === 8), "after the PIN the words are shown");
  await level("strict"); await sleep(300);
  check(!(await open("dlgPin")) && await A.evaluate(() => !localStorage.getItem("agenda.vkeep")), "a stronger level needs no PIN and drops the kept key");

  // A browser of before 0.9.21 without a PIN must choose one at the next start.
  const B = await device(b);
  await B.goto(svc.url); await sleep(800);
  await B.evaluate(() => { localStorage.setItem("agenda.pin", JSON.stringify({ v: 1, mode: "off" })); localStorage.setItem("agenda.phrase", "x"); localStorage.setItem("agenda.cfg", "{}"); });
  await B.reload(); await sleep(1500);
  check(await B.evaluate(() => document.getElementById("dlgPin")?.open && document.getElementById("pinTitle").textContent === "Choose a PIN"), "an old browser without PIN must choose one");

  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
