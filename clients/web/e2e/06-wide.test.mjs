// Three columns on wide screens (ui.md 1a, step 3) in the click dummy.
import { device, check, sleep, DUMMY } from "./lib.mjs";

export default async function ({ b }) {
  const p = await device(b, { width: 1600, height: 950 });
  await p.goto(DUMMY); await sleep(2000);
  const box = sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.right]; }, sel);
  check(await p.evaluate(() => getComputedStyle(document.getElementById("detail")).display === "block" && /Choose an entry/.test(document.getElementById("detail").textContent)), "detail column in place with a hint");
  const [pl, pr] = await box("#fpanel"), [ml, mr] = await box("main"), [dl] = await box("#detail");
  check(pr <= ml + 1 && mr <= dl + 1, "panel, list and detail side by side");
  check(await p.evaluate(() => [...document.querySelectorAll("#agenda .item .chips")].every(c => getComputedStyle(c).display === "none")), "the list shows no tags");
  // Choose an entry with tags.
  await p.evaluate(() => [...document.querySelectorAll("#agenda .item")].find(i => i.querySelector(".chips .chip")).querySelector(".when, .marks, .text").dispatchEvent(new MouseEvent("click", { bubbles: true })));
  await sleep(300);
  check(await p.evaluate(() => !!document.querySelector("#agenda .item.sel") && document.querySelectorAll("#detail .chip").length > 0), "a click shows the entry with its tags on the right");
  check(await p.evaluate(() => !document.querySelector("#agenda input.edit, #agenda .item input")), "the click does not start editing in the list");
  // A tag in the detail opens its menu.
  await p.evaluate(() => document.querySelector("#detail .chip:not(.plus):not(.notebtn)").click()); await sleep(300);
  check(await p.evaluate(() => !document.getElementById("pop").classList.contains("hidden")), "a tag in the detail opens its menu");
  await p.evaluate(() => closePop());
  check(await p.evaluate(() => /Done or reschedule/.test(document.getElementById("detail").textContent)), "actions as rows in the detail");
  await p.evaluate(() => document.querySelector("#detail [data-dclose]").click()); await sleep(200);
  check(await p.evaluate(() => !document.querySelector("#agenda .item.sel") && /Choose an entry/.test(document.getElementById("detail").textContent)), "closing returns to the hint");
  // Below 1440 px no detail column.
  await p.setViewport({ width: 1300, height: 900 }); await p.evaluate(() => render()); await sleep(300);
  check(await p.evaluate(() => getComputedStyle(document.getElementById("detail")).display === "none"), "no detail column below 1440 px");
  check(!p.errors.length, "no page errors " + p.errors.join(" | "));
}
