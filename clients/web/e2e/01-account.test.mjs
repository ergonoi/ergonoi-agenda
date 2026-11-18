// Account on the service: a new account in German words, an entry, a second device with
// the same words, and the connection test.
import { device, newAccount, joinAccount, addLine, check, sleep, itemTexts } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b);
  const phrase = await newAccount(A, svc.url, "de");
  check(phrase.split(" ").length === 8 && await A.evaluate(ph => wordlistOf(ph.split(" ")) === "de", phrase), "new phrase has eight German words");
  await addLine(A, "Call the plumber #facet-self");
  check((await itemTexts(A)).includes("Call the plumber"), "entry shown on the first device");

  const B = await device(b);
  await joinAccount(B, svc.url, phrase);
  check((await itemTexts(B)).includes("Call the plumber"), "second device with the same words sees it");
  await addLine(B, "Buy screws #facet-self");
  await A.evaluate(() => sync()); await sleep(800);
  check((await itemTexts(A)).includes("Buy screws"), "and the first device sees an entry of the second");

  // Connection test in Account (decisions 6.4b).
  await A.evaluate(() => { setView("settings"); settingsTab("account"); });
  await A.evaluate(() => document.getElementById("btnTestConn").click());
  await A.waitForFunction(() => document.querySelectorAll("#connTest li").length >= 5 && !document.querySelector("#connTest li.run"), { timeout: 15000 });
  const rows = await A.evaluate(() => [...document.querySelectorAll("#connTest li")].map(li => li.className + " " + li.textContent));
  check(rows.length === 5 && rows.every(r => r.startsWith("ok")), "connection test: five steps passed (" + rows.map(r => r.split(" ")[0]).join(",") + ")");
  check(rows.some(r => /version \d+\.\d+\.\d+/.test(r)), "connection test names the service version");
  // A wrong address fails with a reason.
  await A.evaluate(() => { document.getElementById("cfgServer").value = "http://192.0.2.10"; document.getElementById("btnTestConn").click(); });
  await sleep(300);
  check(await A.evaluate(() => /only reached over https/.test(document.getElementById("connTest").textContent)), "plain http to another host is refused with a reason");
  check(!A.errors.length && !B.errors.length, "no page errors " + [...A.errors, ...B.errors].join(" | "));
}
