// Several persons on one browser (ui.md 4.11e): each keeps its journals apart under a PIN of
// its own; the chooser comes after Switch person; with several persons a PIN is required,
// any PIN will do; clearing removes only the current person.
import { device, newAccount, check, sleep, settled } from "./lib.mjs";

async function setPin(p, pin) {
  await p.waitForFunction(() => document.getElementById("dlgPin")?.open, { timeout: 20000 });
  const without = await p.evaluate(() => !document.getElementById("pinWithout").classList.contains("hidden"));
  await p.evaluate(v => { document.getElementById("pin1").value = v; document.getElementById("pin2").value = v; document.getElementById("pinOk").click(); }, pin);
  await p.waitForFunction(() => !document.getElementById("dlgPin").open, { timeout: 20000 });
  return without;
}
async function choose(p, name) {
  await p.waitForFunction(() => document.getElementById("dlgPerson")?.open, { timeout: 20000 });
  return p.evaluate(n => { const b = [...document.querySelectorAll("#personList [data-person]")].find(x => x.textContent.includes(n)); b?.click(); return [...document.querySelectorAll("#personList [data-person]")].map(x => x.textContent); }, name);
}

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1400, height: 900 });
  await newAccount(A, svc.url); await settled(A);
  const first = await A.evaluate(() => S.phrase);

  // Someone new; the first time, the person here gives a name.
  await A.evaluate(() => { openViewMenu(); document.querySelector('#viewMenu [data-person]').click(); });
  check(await A.evaluate(() => !!document.getElementById("personFirstName")), "the first switch asks for the name of the person here");
  A.evaluate(() => { $("personFirstName").value = "Markus"; document.querySelector('#viewMenu form[data-pname]').requestSubmit(); }).catch(() => {});
  await A.waitForFunction(() => document.getElementById("dlgPerson")?.open, { timeout: 20000 });
  await A.evaluate(() => { const g = id => document.getElementById(id); g("personAdd").click(); g("personName").value = "Lena"; g("personGo").click(); });
  await A.waitForFunction(() => document.getElementById("dlgSetup")?.open, { timeout: 20000 });
  const lena = await A.evaluate(() => newPhrase("en"));
  A.evaluate(async ph => { await finishSetup(ph, { mode: "server", server: location.origin }, "Journal", await deriveKeysV2(ph)); }, lena).catch(() => {});
  check(!(await setPin(A, "111111")), "with several persons there is no way without a PIN, and 111111 is accepted");
  await A.waitForFunction(() => typeof S !== "undefined" && S.keys && S.etag, { timeout: 20000 }); await settled(A);
  check(await A.evaluate(p => S.phrase === p, lena), "Lena has her own account");

  // Back to the first person: no PIN yet, so one is required now.
  A.evaluate(() => switchPerson()).catch(() => {});
  const names = await choose(A, "Markus").catch(() => []);
  check(names.length === 2, "the chooser lists both persons: " + names.join(" | "));
  check(!(await setPin(A, "222222")), "the first person must choose a PIN now");
  await A.waitForFunction(() => typeof S !== "undefined" && S.keys, { timeout: 20000 });
  check(await A.evaluate(p => S.phrase === p, first), "the first person sees her own account");
  const store = await A.evaluate(() => { const ks = Object.keys(localStorage); return { plainKeys: ks.filter(k => /^agenda\.keys/.test(k) || /^p[0-9a-z]{6}\/agenda\.keys/.test(k)).length, vault: ks.filter(k => k.startsWith("agv:")).length, lena: ks.filter(k => /^p[0-9a-z]{6}\/agv:/.test(k)).length }; });
  check(store.plainKeys === 0 && store.vault > 0 && store.lena > 0, "both are kept encrypted, apart " + JSON.stringify(store));

  // Lena again: her PIN is asked, the first person's key is gone with the switch.
  A.evaluate(() => switchPerson()).catch(() => {});
  await choose(A, "Lena");
  await A.waitForFunction(() => document.getElementById("dlgPin")?.open && /Enter your PIN/.test(document.getElementById("pinTitle").textContent), { timeout: 20000 });
  await A.evaluate(() => { document.getElementById("pin1").value = "111111"; document.getElementById("pinOk").click(); });
  await A.waitForFunction(() => typeof S !== "undefined" && S.keys, { timeout: 20000 });
  check(await A.evaluate(p => S.phrase === p, lena), "Lena unlocks hers with her PIN");
  check(await A.evaluate(() => { openViewMenu(); return /Lena/.test($("viewMenu").textContent) && /Switch person/.test($("viewMenu").textContent); }), "the menu names the person and offers to switch");

  // Clearing removes Lena only.
  A.evaluate(() => clearThisBrowser(null)).catch(() => {});
  await A.waitForFunction(() => document.getElementById("dlgSetup")?.open || document.getElementById("dlgPin")?.open || document.getElementById("dlgPerson")?.open, { timeout: 20000 });
  const left = await A.evaluate(() => JSON.parse(localStorage.getItem("agenda.persons") || "[]").map(x => x.name));
  check(left.length === 1 && left[0] !== "Lena", "clearing removes only Lena: " + left.join(", "));
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
