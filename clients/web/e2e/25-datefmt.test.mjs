// Date format (ui.md 4.11f): with an English browser in Germany, "automatic" writes dates the
// German way and times to 24 hours; "Browser" keeps the browser's own format, "ISO" writes
// year-month-day; the choice stays after a reload.
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b);
  await A.emulateTimezone("Europe/Berlin");
  await newAccount(A, svc.url);
  const fmt = () => A.evaluate(() => { const d = new Date("2026-11-25T23:26:00"); return [fmtDate("2026-11-25"), fmtDT(d, { dateStyle: "short", timeStyle: "short" }), fmtDT(d, { weekday: "long", day: "numeric", month: "long" })]; });
  const auto = await fmt();
  check(auto[0] === "Wed, 25.11." && auto[1] === "25.11.2026, 23:26" && /^Wednesday/.test(auto[2]), "automatic in Germany: " + JSON.stringify(auto));
  const pick = async v => { await A.evaluate(v => { document.querySelector(`#dateFmt [data-v="${v}"]`).click(); }, v); await sleep(200); };
  await A.evaluate(() => renderDateFmt());
  await pick("iso");
  const iso = await fmt();
  check(iso[0] === "Wed, 11-25" && iso[1] === "2026-11-25, 23:26", "ISO: " + JSON.stringify(iso));
  check(await A.evaluate(() => /2026-|\d\d-\d\d/.test(document.getElementById("dateFmtHint").textContent)), "the hint shows the chosen format");
  await pick("browser");
  const br = await fmt();
  check(br[0] === "Wed, 11/25" && /11\/25\/26/.test(br[1]), "Browser: " + JSON.stringify(br));
  await A.reload(); await sleep(1200);
  check(await A.evaluate(() => dateFmt()) === "browser", "the choice stays after a reload");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
