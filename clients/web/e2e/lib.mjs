// Helpers for the browser tests: a local service on a free port with an empty data
// directory, Chrome via puppeteer-core, and small assertions.
import puppeteer from "puppeteer-core";
import { spawn, execFileSync } from "node:child_process";
import { mkdtempSync, existsSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
export const DUMMY = "file://" + join(ROOT, "clients/demo/dist/agenda-click-dummy.html");
export const CHROME = process.env.CHROME || "/usr/bin/google-chrome";
export const sleep = ms => new Promise(r => setTimeout(r, ms));

let failures = 0;
export const failed = () => failures;
export function check(cond, msg) {
  console.log((cond ? "  PASS " : "  FAIL ") + msg);
  if (!cond) failures++;
}

const freePort = () => new Promise(res => { const s = createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => res(p)); }); });

// The service binary, built once from the working tree.
function binary() {
  const bin = join(tmpdir(), "agenda-e2e-service");
  // Rebuilt when the service or the embedded client is newer than the binary.
  const newest = Math.max(...["server/main.go", "server/relay.go", "server/auth.go", "clients/web/index.html"].map(f => statSync(join(ROOT, f)).mtimeMs));
  if (!existsSync(bin) || statSync(bin).mtimeMs < newest || process.env.REBUILD)
    execFileSync("go", ["build", "-o", bin, "./server"], { cwd: ROOT, stdio: "inherit" });
  return bin;
}

export async function startService() {
  const port = await freePort(), data = mkdtempSync(join(tmpdir(), "agenda-e2e-"));
  const proc = spawn(binary(), ["-listen", "127.0.0.1:" + port, "-data", data], { stdio: "ignore" });
  const url = "http://127.0.0.1:" + port + "/";
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(url + "health"); if (r.ok) break; } catch {}
    await sleep(100);
  }
  return { url, data, stop: () => proc.kill() };
}

export async function browser() {
  return puppeteer.launch({ executablePath: CHROME, args: ["--no-sandbox", "--no-proxy-server"] });
}

// A page in a fresh browser context (a separate device), collecting page errors.
export async function device(b, { phone = false, width = 1280, height = 900 } = {}) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  p.errors = [];
  p.on("pageerror", e => p.errors.push(e.message));
  if (phone) await p.emulate({ viewport: { width: 390, height: 844, isMobile: true, hasTouch: true }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" });
  else await p.setViewport({ width, height });
  return p;
}

// Sets up a new account on the service (new words in the given language) with the PIN
// 111111, and waits for the first sync.
export async function newAccount(p, url, lang = "en") {
  let phrase = null;
  await p.goto(url); await sleep(800);
  phrase = phrase || await p.evaluate(l => newPhrase(l), lang);
  p.evaluate(async ph => { await finishSetup(ph, { mode: "server", server: location.origin }, "Journal", await deriveKeysV2(ph)); }, phrase).catch(() => {});
  await choosePin(p);
  return phrase;
}

// Joins an existing account the way a person does: setup, "existing", the words, and the
// confirmation that the journal found is meant.
export async function joinAccount(p, url, phrase) {
  await p.goto(url);
  await p.waitForFunction(() => document.getElementById("dlgSetup")?.open, { timeout: 10000 });
  await p.evaluate(u => { document.getElementById("setupServer").value = u; }, url.replace(/\/$/, ""));
  await p.click("#btnExistingAccount");
  await p.type("#phraseInput", phrase);
  await p.click("#setupOk");
  await p.waitForFunction(() => { const b = document.getElementById("btnExistsGo"); return b && b.offsetParent; }, { timeout: 15000 });
  await p.click("#btnExistsGo");
  await choosePin(p);
}

// The PIN is required once on every device (architecture 8.13); the tests use 111111.
export async function choosePin(p, pin = "111111") {
  await p.waitForFunction(() => document.getElementById("dlgPin")?.open, { timeout: 15000 });
  await p.evaluate(v => { for (const id of ["pin1", "pin2"]) document.getElementById(id).value = v; document.getElementById("pinOk").click(); }, pin);
  await p.waitForFunction(() => !document.getElementById("dlgPin").open, { timeout: 15000 });
  await p.waitForFunction(() => typeof S !== "undefined" && S.keys && S.etag, { timeout: 15000 });
  await settled(p);
}

// Waits until no sync is running and nothing is pending.
export async function settled(p) {
  await p.waitForFunction(() => typeof syncing !== "undefined" && !syncing && !(S.outbox && S.outbox.length), { timeout: 20000 }).catch(() => {});
  await sleep(300);
}

// Adds an entry through the add field (as typed) and waits for the sync.
export async function addLine(p, line) {
  await settled(p);
  await p.evaluate(() => { const i = document.getElementById("addLine"); i.value = ""; i.focus(); });
  await p.type("#addLine", line);
  await p.keyboard.press("Enter");
  await sleep(300);
  await settled(p);
}

export const itemTexts = p => p.evaluate(() => [...document.querySelectorAll("#agenda .item .text")].map(x => x.textContent.trim()));
