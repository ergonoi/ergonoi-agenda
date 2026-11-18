// A further server (decisions 6.4, stage 1): the owner adds it in the journal dialog; the
// journal is copied there, every new line follows, lines wait while it is not reached;
// deleting reaches it too.
import { device, newAccount, check, sleep, settled, startService } from "./lib.mjs";

export default async function ({ b }) {
  const main = await startService(), mirror = await startService();
  try { await run(main, mirror, b); } finally { main.stop(); mirror.stop(); }
}
async function run(main, mirror, b) {
  const A = await device(b, { width: 1400, height: 900 });
  // Both test services speak plain http on 127.0.0.1; the page's policy allows only https
  // to other hosts, as a real further server is.
  await A.setBypassCSP(true);
  await newAccount(A, main.url);
  const mu = mirror.url.replace(/\/$/, "");
  const count = (u, j) => A.evaluate(async (u, j) => withJAsync(j, async () => { const r = await fetch(u + "/journal", { headers: await serverBackend.auth(), cache: "no-store" }); return r.status === 200 ? (await r.text()).split("\n").filter(Boolean).length : -r.status; }), u, j);

  await A.evaluate(() => openJournal("")); await sleep(500);
  await A.evaluate(u => { $("jSrvInput").value = u; $("jSrvGo").click(); }, mu);
  await A.waitForFunction(() => /^Added|^Not added/.test($("jSrvMsg").textContent), { timeout: 20000 });
  const msg = await A.evaluate(() => $("jSrvMsg").textContent);
  check(/^Added/.test(msg), "the owner adds a further server: " + msg);
  await A.evaluate(() => sync()); await settled(A); await sleep(500); await A.evaluate(() => sync()); await settled(A);
  const n0 = await count(main.url.replace(/\/$/, ""), ""), m0 = await count(mu, "");
  check(m0 > 0 && m0 === n0, "the journal is on both servers (" + n0 + " / " + m0 + ")");
  const list = await A.evaluate(() => { renderServers(""); return $("jSrvList").textContent; });
  check(/main server/.test(list) && /up to date/.test(list), "the dialog lists both: " + list);
  await A.evaluate(() => $("dlgJournal").close());

  await A.evaluate(() => { $("addLine").value = "Mirrored entry #facet-work"; $("add").requestSubmit(); }); await sleep(300);
  await A.evaluate(() => sync()); await settled(A);
  const n1 = await count(main.url.replace(/\/$/, ""), ""), m1 = await count(mu, "");
  check(n1 === n0 + 1 && m1 === n1, "a new line reaches both servers (" + n1 + " / " + m1 + ")");

  // A journal of its own with the mirror, then deleted: the deletion reaches the mirror.
  const e = await A.evaluate(async () => joinJournal(newPhrase("en"), true, "Mirrored", true));
  check(!e, "a second journal " + e);
  await A.evaluate(() => sync()); await settled(A);
  const id = await A.evaluate(() => extraJournals()[0].id);
  await A.waitForFunction(j => withJ(j, () => S.etag && !S.outbox.length), { timeout: 30000 }, id);
  await A.evaluate((j, u) => addMirror(j, u), id, mu);
  await A.evaluate(() => sync()); await settled(A);
  check(await count(mu, id) > 0, "the second journal is on the further server");
  const hdr = await A.evaluate(j => withJ(j, () => authHeaders(S.keys)), id);
  await A.evaluate(j => openJournal(j), id); await sleep(300);
  await A.evaluate(() => { $("jDelete").click(); $("jDelete").click(); }); await sleep(1500);
  const after = await A.evaluate(async (u, h) => (await fetch(u + "/journal", { headers: { ...h, "X-Agenda-Member": "0".repeat(64) } })).status, mu, hdr);
  check(after === 410, "deleting reaches the further server too (" + after + ")");

  // The further server goes away: lines wait.
  mirror.stop(); await sleep(300);
  await A.evaluate(() => { $("addLine").value = "While the mirror is away #facet-work"; $("add").requestSubmit(); }); await sleep(300);
  await A.evaluate(() => sync()); await settled(A, 30000);
  const st = await A.evaluate(u => withJ("", () => mirrorState()[u]), mu);
  check(st && st.q.length >= 1 && st.err, "lines wait for the server that is away " + JSON.stringify(st && { q: st.q.length, err: st.err }));

  // Removing it from the list.
  await A.evaluate(u => removeMirror("", u), mu); await sleep(200);
  check(await A.evaluate(() => mirrorServers("").length === 0), "the owner removes it from the list");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
