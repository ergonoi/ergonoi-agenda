// Reschedule (ui.md 4.9): the steps count from the entry's date when it lies ahead, from today
// when it is overdue or has none; Next week is the Monday after the week of that day; the grid
// holds one column per unit, Other date last.
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1440, height: 900 });
  await newAccount(A, svc.url);
  const t = await A.evaluate(() => today());
  const ahead = await A.evaluate(t => addDays(t, 10), t), over = await A.evaluate(t => addDays(t, -8), t);
  await A.evaluate((a, o) => { withJ("", () => { S.wc = S.wc + `\nAhead #date-${a}\nOverdue #date-${o}\nUndated`; }); render(); }, ahead, over);
  await sleep(500);
  const step = async (text, act) => {
    await A.evaluate((text, act) => { const i = [...document.querySelectorAll("#agenda .item")].find(e => e.querySelector(".text")?.textContent.trim().startsWith(text)); i.click(); }, text, act);
    await sleep(300);
    await A.evaluate(act => document.querySelector(`#detail [data-dact="${act}"]`).click(), act);
    await sleep(400);
    return A.evaluate(text => { const e = parseLines(S.wc).find(e => e.text.startsWith(text)); return (e.tags.find(x => x.dim === "date") || {}).val; }, text);
  };
  const exp = (base, n) => A.evaluate((b, n) => addDays(b, n), base, n);
  check(await step("Ahead", "tomorrow") === await exp(ahead, 1), "Next day counts from a date ahead");
  const nextMon = await A.evaluate(b => { const d = addDays(b, 1); return addDays(d, 7 - (new Date(d + "T12:00:00").getDay() + 6) % 7); }, ahead);
  check(await step("Ahead", "nextweek") === nextMon, "Next week is the Monday after the week of the entry's date");
  check(await A.evaluate(d => new Date(d + "T12:00:00").getDay() === 1, nextMon), "that day is a Monday");
  check(await step("Overdue", "tomorrow") === await exp(t, 1), "an overdue entry counts from today");
  check(await step("Undated", "days3") === await exp(t, 3), "an entry without a date counts from today, 3 days");
  await A.evaluate(() => [...document.querySelectorAll("#agenda .item")].find(e => /Ahead/.test(e.textContent)).click()); await sleep(300);
  const order = await A.evaluate(() => [...document.querySelectorAll("#detail .dgrid > *")].map(e => e.textContent.trim()));
  check(order.join("|") === "Next day|Next week|1 month|2 days|1 week|3 months|3 days|2 weeks|Other date", "detail grid order " + order.join("|"));
  const sheet = await A.evaluate(() => [...document.querySelectorAll("#sheet .grid > *")].map(e => e.textContent.trim()));
  check(sheet.join("|") === order.join("|"), "sheet grid in the same order");
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
