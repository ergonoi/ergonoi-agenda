// Runs the browser tests (*.test.mjs) one after the other against one local service and one
// browser. Usage: node run.mjs [part of a file name …]
// Needs Go (to build the service), Python 3 (to build client and click dummy) and Chrome
// (CHROME=/path/to/chrome).
import { readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, startService, browser, failed } from "./lib.mjs";

const only = process.argv.slice(2);
const files = readdirSync(new URL(".", import.meta.url)).filter(f => f.endsWith(".test.mjs")).sort()
  .filter(f => !only.length || only.some(o => f.includes(o)));

execFileSync("python3", [join(ROOT, "clients/web/build.py")], { stdio: "ignore" });
execFileSync("python3", [join(ROOT, "clients/demo/build.py")], { stdio: "ignore" });
const svc = await startService(), b = await browser();
let crashed = 0;
for (const f of files) {
  console.log(f);
  const t0 = Date.now();
  try { await (await import("./" + f)).default({ svc, b }); }
  catch (e) { crashed++; console.log("  CRASH " + (e.stack || e).toString().split("\n").slice(0, 3).join(" | ")); }
  console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
}
await b.close(); svc.stop();
const n = failed() + crashed;
console.log(n ? `${failed()} failed, ${crashed} crashed` : "all passed");
process.exit(n ? 1 : 0);
