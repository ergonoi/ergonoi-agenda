// The clipboard (ui.md 4.16): a chosen picture shows at once, a stick shows the share sent,
// the result is the item; a picture above 4 MB is made smaller before sending.
import { device, newAccount, check, sleep } from "./lib.mjs";

export default async function ({ svc, b }) {
  const A = await device(b, { phone: true });
  await newAccount(A, svc.url);
  await A.evaluate(() => openClip()); await sleep(200);
  // A noisy picture of about 3.5 MB (PNG of random pixels).
  const seen = await A.evaluate(async () => {
    const c = document.createElement("canvas"); c.width = 1100; c.height = 900;
    const g = c.getContext("2d"), d = g.createImageData(c.width, c.height);
    for (let i = 0; i < d.data.length; i++) d.data[i] = i % 4 === 3 ? 255 : (Math.random() * 256) | 0;
    g.putImageData(d, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    const seenP = [], seenS = [];
    const obs = new MutationObserver(() => { const p = document.getElementById("clipProg"); if (!p.classList.contains("hidden")) seenS.push(p.firstElementChild.style.width); if (document.querySelector("#clipPreview.sending img")) seenP.push(1); });
    obs.observe(document.getElementById("dlgClip"), { subtree: true, attributes: true, childList: true });
    await clipPut(blob, "photo.png");
    obs.disconnect();
    return { size: blob.size, preview: seenP.length > 0, steps: seenS, msg: document.getElementById("clipMsg").textContent, filled: CLIP.filled, img: !!document.querySelector("#clipPreview img"), hidden: document.getElementById("clipProg").classList.contains("hidden") };
  });
  check(seen.size > 3e6 && seen.preview, "the picture shows at once while sending: " + seen.size);
  check(seen.steps.length > 0 && seen.hidden, "the stick shows the share sent and goes: " + seen.steps.slice(-3).join(" "));
  check(seen.filled && seen.img && /In the clipboard/.test(seen.msg), "afterwards the item is in the clipboard: " + seen.msg);
  // Above 4 MB: made smaller.
  const big = await A.evaluate(async () => {
    const c = document.createElement("canvas"); c.width = 1600; c.height = 1300;
    const g = c.getContext("2d"), d = g.createImageData(c.width, c.height);
    for (let i = 0; i < d.data.length; i++) d.data[i] = i % 4 === 3 ? 255 : (Math.random() * 256) | 0;
    g.putImageData(d, 0, 0);
    const blob = await new Promise(r => c.toBlob(r, "image/png"));
    await clipPut(blob, "large.png");
    return { size: blob.size, name: CLIP.meta && CLIP.meta.name, type: CLIP.meta && CLIP.meta.type, sent: CLIP.meta && CLIP.meta.size };
  });
  check(big.size > 4 << 20 && big.name === "large.jpg" && big.type === "image/jpeg" && big.sent < 4 << 20, "a picture above 4 MB goes as a smaller JPEG: " + JSON.stringify(big));
  check(!A.errors.length, "no page errors " + A.errors.join(" | "));
}
