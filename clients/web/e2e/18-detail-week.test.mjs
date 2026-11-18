// The detail column on wide screens (ui.md 1a, step 3): the note is written in the column and
// wraps at the field's width; Done and Reschedule work there; a double click opens the
// larger note dialog. The month view (4.13b): a week at a time from the week column.
import { device, newAccount, addLine, check, sleep, settled } from "./lib.mjs";

const fileLine = (p, t) => p.evaluate(t => S.wc.split("\n").find(l => l.startsWith(t + " ")) || "", t);
const pick = (p, t) => p.evaluate(t => [...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes(t)).querySelector(".text").click(), t);

export default async function ({ svc, b }) {
  const A = await device(b, { width: 1500, height: 900 });
  await newAccount(A, svc.url); await settled(A);
  const t0 = await A.evaluate(() => today()), d2 = await A.evaluate(() => addDays(today(), 2));
  await addLine(A, `Order oak boards #facet-work #date-${d2}`);
  await addLine(A, `Call the joiner #facet-work #date-${d2}`);
  await pick(A, "Order oak boards"); await sleep(300);
  check(await A.evaluate(() => !!document.getElementById("dNote") && !document.querySelector("#detail [data-dsheet]")), "the note field and the actions are in the column");
  const long = "Ask the timber yard for quarter-sawn boards, 26 mm, about 0.4 m³, and a price for delivery to the workshop before Friday.";
  await A.click("#dNote"); await A.type("#dNote", long);
  check(await A.evaluate(() => { const t = document.getElementById("dNote"); return t.scrollWidth <= t.clientWidth + 1 && t.scrollHeight <= t.clientHeight + 2; }), "the note wraps and grows, nothing hidden");
  await A.evaluate(() => sync()); await sleep(300);
  check(await A.evaluate(v => document.getElementById("dNote")?.value === v && document.activeElement.id === "dNote", long), "a redraw while writing keeps the text and the focus");
  await A.evaluate(() => document.querySelector("#addLine").focus()); await sleep(300);
  check((await fileLine(A, "Order oak boards")).includes("{{Ask the timber yard"), "leaving the field saves the note");
  check(await A.evaluate(v => document.getElementById("dNote").value === v, long), "the note stays visible in the column");
  // List note symbol on wide screens: no dialog, the field instead.
  await A.evaluate(() => [...document.querySelectorAll("#agenda .item")].find(x => x.textContent.includes("Call the joiner")).querySelector("[data-note]").click()); await sleep(300);
  check(await A.evaluate(() => !document.getElementById("dlgNote").open && document.activeElement.id === "dNote" && /Call the joiner/.test(document.querySelector("#detail .text").textContent)), "the note symbol goes to the field, no dialog");
  // Double click: the larger dialog with the text.
  await pick(A, "Order oak boards"); await sleep(300);
  await A.evaluate(() => document.getElementById("dNote").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))); await sleep(300);
  const dbg = await A.evaluate(v => ({ open: document.getElementById("dlgNote").open, same: document.getElementById("noteText").value === v, val: document.getElementById("noteText").value.slice(0, 30), rs: getComputedStyle(document.getElementById("dlgNote")).resize, fine: matchMedia("(pointer: fine)").matches, sel: document.querySelector("#detail .text")?.textContent }), long);
  check(dbg.open && dbg.same && dbg.rs === "both", "double click opens the resizable dialog with the note " + JSON.stringify(dbg));
  await A.evaluate(() => document.getElementById("dlgNote").close()); await sleep(300);
  // Reschedule and Done in the column.
  await pick(A, "Order oak boards"); await sleep(300);
  await A.evaluate(() => document.querySelector('#detail [data-dact="weeks1"]').click()); await sleep(400);
  check((await fileLine(A, "Order oak boards")).includes("#date-" + await A.evaluate(() => addDays(today(), 7))), "1 week moves the date, counted from today " + await fileLine(A, "Order oak boards"));
  await pick(A, "Call the joiner"); await sleep(300);
  await A.evaluate(() => document.querySelector('#detail [data-dact="done"]').click()); await sleep(400);
  check((await fileLine(A, "Call the joiner")).includes("#done-" + t0), "Done closes the entry");

  // Status apart from the note, nothing standing out; a memo is not rescheduled.
  await pick(A, "Order oak boards"); await sleep(300);
  check(await A.evaluate(() => { const b = document.querySelector('#detail [data-dact="done"]'); return b.textContent === "Mark as done" && !b.classList.contains("primary") && /^Status/.test(document.querySelector("#detail .dre").textContent); }), "Mark as done under Status, not emphasised");
  await A.evaluate(() => { S.wc += "\nGlasses #facet-work #type-memo"; render(); document.getElementById("btnMemo").click(); }); await sleep(300);
  await pick(A, "Glasses"); await sleep(300);
  check(await A.evaluate(() => !!document.querySelector('#detail [data-dact="done"]') && !document.querySelector('#detail [data-dact="tomorrow"]') && !document.getElementById("dDate")), "a memo: Mark as done, no reschedule");
  await A.evaluate(() => document.getElementById("btnMemo").click()); await sleep(200);

  // The head of the column holds everything about time.
  await addLine(A, `Team standup #facet-work #date-${d2} #date-${await A.evaluate(d => addDays(d, 35), d2)} #time-09:00-09:15 #recurring-weekly #skip-${await A.evaluate(d => addDays(d, 14), d2)}`);
  await pick(A, "Team standup"); await sleep(300);
  const row = await A.evaluate(() => { const r = document.querySelector("#detail .chron"); return r && { lbl: r.querySelector(".clbl").innerText, vals: [...r.querySelectorAll(".chip")].map(c => c.innerText.replace(/\s+/g, " ").trim()), rows: document.querySelectorAll("#detail .chip:not(.plus):not(.notebtn)").length }; });
  check(row && row.lbl === "date:" && row.vals.length === 5 && /until/.test(row.vals[1]) && /09:00/.test(row.vals[2]) && /weekly/.test(row.vals[3]) && /^not /.test(row.vals[4]), "one row date: with dates, time, repetition and dates left out: " + JSON.stringify(row));
  await A.evaluate(() => document.querySelectorAll("#detail .chron .chip")[3].click()); await sleep(200);
  check(await A.evaluate(() => !document.getElementById("pop").classList.contains("hidden")), "each value opens its menu");
  await A.evaluate(() => closePop());
  check(await A.evaluate(() => [...document.querySelectorAll("#agenda .item .chron .clbl")].every(x => !x.offsetParent)), "the list keeps one chip per tag");

  // Month: the week column.
  await A.evaluate(() => { selKey = null; setView("month"); }); await sleep(300);
  check(await A.evaluate(() => document.querySelectorAll(".cal .cwk").length === 6), "a week number per row");
  const geo = await A.evaluate(() => { const w = document.querySelector(".cal .cwk small").getBoundingClientRect(), c = document.querySelector(".cal .cd > span").getBoundingClientRect(), wb = document.querySelector(".cal .cwk").getBoundingClientRect(), cb = document.querySelector(".cal .cd").getBoundingClientRect(); return { wm: w.top + w.height / 2, cm: c.top + c.height / 2, gap: cb.left - wb.right }; });
  check(Math.abs(geo.wm - geo.cm) < 1.5 && geo.gap >= 8, "week number centred on the line of the day numbers, apart from Monday " + JSON.stringify(geo));
  const mon = await A.evaluate(() => { const b = [...document.querySelectorAll(".cal .cwk")].find(x => { const d = x.dataset.cweek; return d <= today() && addDays(d, 6) >= today(); }); b.click(); return b.dataset.cweek; }); await sleep(300);
  check(await A.evaluate(() => document.querySelectorAll(".cal .cd.wk").length === 7 && /^Week \d+ · /.test(document.querySelector("#agenda .wkhead").textContent)), "the whole week is marked and named");
  check(await A.evaluate(() => document.querySelectorAll("#agenda section.calday.wk h2").length >= 1 && [...document.querySelectorAll("#agenda section.calday.wk")].every(s => s.querySelector(".item"))), "days with entries, each under its heading, empty days left out");
  await A.evaluate(() => { document.getElementById("addLine").value = "Week task"; document.getElementById("add").requestSubmit(); }); await sleep(300);
  await A.evaluate(() => document.querySelector("#facetButtons button.tag").click()); await sleep(400);
  check(mon === t0 ? !(await fileLine(A, "Week task")).includes("#date-") || (await fileLine(A, "Week task")).includes("#date-" + mon) : (await fileLine(A, "Week task")).includes("#date-" + mon), "a new entry gets the Monday of the week: " + await fileLine(A, "Week task"));
  await A.evaluate(() => document.querySelector(".cal .cd").click()); await sleep(200);
  check(await A.evaluate(() => !document.querySelector(".cal .cd.wk") && !document.querySelector("#agenda .wkhead")), "a day shows that day again");
  await settled(A);
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
