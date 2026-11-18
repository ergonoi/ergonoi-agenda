// After adding (ui.md 4.2a): a card below the add field names the new item; Go to item opens
// it in the list.
import { device, newAccount, check, sleep, settled } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b);
  await newAccount(A, svc.url);
  await A.evaluate(() => document.getElementById("addLine").focus());
  await A.type("#addLine", "Order the tools #facet-work"); await A.keyboard.press("Enter"); await sleep(400);
  check(await A.evaluate(() => !document.getElementById("added").classList.contains("hidden") && /Order the tools/.test(document.getElementById("added").textContent)), "the card names the new item");
  check(await A.evaluate(() => document.getElementById("added").getBoundingClientRect().top >= document.getElementById("add").getBoundingClientRect().bottom), "below the add field");
  await A.evaluate(() => document.getElementById("addedGo").click()); await sleep(600);
  check(await A.evaluate(() => /Order the tools/.test(document.querySelector("#agenda .item.open")?.textContent || "")), "Go to item opens it");
  await settled(A);
  await A.type("#addLine", "Call the bank #facet-work"); await A.keyboard.press("Enter"); await sleep(4800);
  check(await A.evaluate(() => document.getElementById("added").classList.contains("hidden")), "gone after a few seconds");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
