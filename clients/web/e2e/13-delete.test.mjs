// Deleting (architecture 8.4b): when the owner deletes a shared journal, an ally loses it
// at the next sync, with its backups; the owner can undo it for 7 days. Backups in this
// browser (8.4c) and the backup list of the journal dialog. Deleting the account: the
// words restore it within 7 days.
import { device, newAccount, check, sleep, settled, startService, choosePin } from "./lib.mjs";

// A service of its own: the suite's service has used up the new accounts per address and day.
export default async function ({ b }) {
  const svc = await startService();
  try { await run(svc, b); } finally { svc.stop(); }
}
async function run(svc, b) {
  const A = await device(b, { width: 1400, height: 900 }), B = await device(b, { width: 1400, height: 900 });
  const phA = await newAccount(A, svc.url);
  await newAccount(B, svc.url);
  const sh = await A.evaluate(async () => { const ph = newPhrase("en"); const e = await joinJournal(ph, true, "Shared", true); return { ph, e, ally: await allyCodeOf(ph, "en") }; });
  check(!sh.e, "the owner creates a journal " + sh.e);
  await A.evaluate(() => sync()); await settled(A);
  const id = await A.evaluate(() => extraJournals()[0].id);
  const shAcct = await A.evaluate(j => acctOf(withJ(j, () => S.keys)), id);
  await A.waitForFunction(j => withJ(j, () => S.etag && !S.outbox.length), { timeout: 30000 }, id);
  const je = await B.evaluate(c => joinJournal(c), sh.ally);
  check(!je, "an ally adds it " + je);
  await B.evaluate(() => sync()); await settled(B);

  // Backups in this browser, listed in the journal dialog.
  await B.evaluate(() => localBackups()); await sleep(300);
  const bk = await B.evaluate(async j => (await BK.list(await acctOf(withJ(j, () => S.keys)))).length, id);
  check(bk === 1, "one backup of the shared journal in the ally's browser (" + bk + ")");
  await A.evaluate(j => openJournal(j), id); await sleep(800);
  const rows = await A.evaluate(() => [...document.querySelectorAll("#jBkList .bk")].map(x => x.textContent));
  check(rows.length >= 1 && /this browser/.test(rows[0]) && /Restore/.test(rows[0]), "the owner sees the backup with Download and Restore: " + rows.join(" | "));

  // The owner deletes it.
  await A.evaluate(() => { $("jDelete").click(); $("jDelete").click(); }); await sleep(800);
  check(await A.evaluate(j => !extraJournals().some(x => x.id === j) && undoList().length === 1, id), "deleted on the owner's device, with a way back");
  await B.evaluate(() => sync()); await sleep(1200); await settled(B);
  const gone = await B.evaluate(async j => ({ still: extraJournals().some(x => x.id === j), notice: S.notices.some(n => /was deleted by its owner/.test(n)) }), id);
  check(!gone.still && gone.notice, "the ally loses it at the next sync " + JSON.stringify(gone));
  check(await B.evaluate(async a => (await BK.list(a)).length, shAcct) === 0, "and its backups in the ally's browser");

  // Undo.
  await A.evaluate(() => { setView("settings"); renderJournalList(); }); await sleep(300);
  await A.evaluate(() => document.querySelector("[data-undo]").click());
  await A.waitForFunction(j => extraJournals().some(x => x.id === j) || S.notices.some(n => /Undoing the deletion failed/.test(n)), { timeout: 20000 }, id).catch(() => {});
  await settled(A);
  const und = await A.evaluate(j => ({ ok: extraJournals().some(x => x.id === j) && !undoList().length, n: S.notices.slice(-2), log: (LS.getItem("agenda.log") || "").split("\n").filter(l => /undo|undelete/i.test(l)).slice(-3) }), id);
  check(und.ok, "the owner undoes the deletion " + (und.ok ? "" : JSON.stringify(und)));
  check(!(await B.evaluate(c => joinJournal(c), sh.ally)), "after the undo the ally can add it again");

  // Deleting the account, and the words restore it.
  await A.evaluate(() => { $("btnDeleteAccount").click(); $("btnDeleteAccount").click(); });
  await sleep(2000);
  await A.waitForFunction(() => document.getElementById("dlgSetup")?.open, { timeout: 15000 });
  await sleep(500);
  await A.evaluate(u => { document.getElementById("setupServer").value = u; }, svc.url.replace(/\/$/, ""));
  await A.click("#btnExistingAccount");
  await A.type("#phraseInput", phA);
  await A.click("#setupOk"); await sleep(1500);
  const msg = await A.evaluate(() => $("setupMsg").textContent);
  check(/was deleted on/.test(msg), "the words find the deleted account: " + msg);
  await A.click("#setupOk");
  await choosePin(A);
  await A.waitForFunction(() => typeof S !== "undefined" && S.keys && S.etag, { timeout: 15000 }); await settled(A);
  const back = await A.evaluate(() => ({ entries: parseLines(S.snap).length, shared: extraJournals().length }));
  check(back.entries > 3 && back.shared === 1, "after Continue the account is back as it was " + JSON.stringify(back));
  check(!A.errors.length && !B.errors.length, "no page errors " + A.errors.concat(B.errors).join(" | "));
}
