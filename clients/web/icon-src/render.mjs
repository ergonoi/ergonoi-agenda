// Renders the app icons from icon.html for both themes in ../brand.json into
// icons/<theme>-<size>.png and icons/<theme>.ico (16, 32, 48 px). build.py copies the set of
// the default theme to the names the page and the manifest use. Needs Chrome, puppeteer-core
// (from ../e2e: npm install there) and Python with Pillow for the .ico.
// Usage: node clients/web/icon-src/render.mjs
import { readFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
const here = dirname(fileURLToPath(import.meta.url)), web = join(here, "..");
const require = createRequire(join(web, "e2e", "package.json"));
const puppeteer = require("puppeteer-core");
const themes = Object.keys(JSON.parse(readFileSync(join(web, "brand.json"), "utf8")).themes);
mkdirSync(join(here, "icons"), { recursive: true });
const b = await puppeteer.launch({ executablePath: process.env.CHROME || "/usr/bin/google-chrome", args: ["--no-sandbox", "--allow-file-access-from-files"] });
const p = await b.newPage();
for (const t of themes) {
  for (const s of [32, 48, 180, 192, 512]) {
    await p.setViewport({ width: s, height: s });
    await p.goto(`file://${join(here, "icon.html")}?t=${t}&s=${s}`);
    await p.evaluate(() => document.fonts.ready);
    await (await p.$("#icon")).screenshot({ path: join(here, "icons", `${t}-${s}.png`) });
  }
  execFileSync("python3", ["-c", `from PIL import Image; Image.open("${join(here, "icons", t + "-48.png")}").save("${join(here, "icons", t + ".ico")}", sizes=[(16,16),(32,32),(48,48)])`]);
  console.log("icons for " + t);
}
await b.close();
