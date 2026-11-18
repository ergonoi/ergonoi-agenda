// Views (architecture 3.4, ui.md 4.14): saved, renamed, changed and deleted on one device;
// a deleted view stays deleted after the next sync and on a second device.
import { device, newAccount, joinAccount, addLine, check, sleep, settled } from "./lib.mjs";

const names = p => p.evaluate(() => viewLines().map(v => v.name).sort().join(","));
const sync = async p => { await p.evaluate(() => sync()); await settled(p); };

export default async function ({ svc, b }) {
  const A = await device(b);
  const phrase = await newAccount(A, svc.url);
  await addLine(A, "Write the report #facet-work");
  await addLine(A, "Call grandma #facet-private");
  await A.evaluate(() => { writeView("Work"); writeView("Private"); }); await sync(A);
  check(await names(A) === "Private,Work", "two views saved");
  await A.evaluate(() => renameView("Private", "Home")); await sync(A);
  check(await names(A) === "Home,Work", "renamed");
  await A.evaluate(() => deleteView("Work")); await sync(A);
  await sleep(500); await sync(A);
  check(await names(A) === "Home", "a deleted view stays deleted after the next sync: " + await names(A));
  await A.reload(); await settled(A); await sync(A);
  check(await names(A) === "Home", "and after a reload: " + await names(A));
  const B = await device(b);
  await joinAccount(B, svc.url, phrase); await sync(B);
  check(await names(B) === "Home", "a second device sees only Home: " + await names(B));
  check(!A.errors.length && !B.errors.length, "no page errors " + A.errors.concat(B.errors).join(" | "));
}
