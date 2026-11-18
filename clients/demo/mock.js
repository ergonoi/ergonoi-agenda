<script>
"use strict";
// ---------------------------------------------------------------------------
// Demo only: storage fallback and a simulated server (POST /append, GET /journal)
// ---------------------------------------------------------------------------
(function () {
  let ok = true;
  try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); } catch { ok = false; }
  if (!ok) {
    const mem = {};
    const shim = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); },
      removeItem: k => { delete mem[k]; }, key: i => Object.keys(mem)[i] ?? null, get length() { return Object.keys(mem).length; } };
    try { Object.defineProperty(window, "localStorage", { value: shim }); } catch {}
  }
  const ls = window.localStorage;
  // Demo account: fixed phrase, keys precomputed with the derivation of spec 8.2.
  if (!ls.getItem("agenda.keys")) {
    ls.setItem("agenda.cfg", JSON.stringify({ mode: "server", server: "https://agenda.example.org" }));
    ls.setItem("agenda.phrase", "garden window river cable orbit maple quote harbor");
    ls.setItem("agenda.keys", JSON.stringify({ enc: "4WxbVtUfue6Vzygm1lYyQEcpynGzKDZ/ZfdhdgvVGpU=", token: "0ef3ae3665c3a71177e34bea83f285ab4f53d666bbfaaa301a649bd8cef7dee9" }));
  }
})();

window.DEMO = { online: true };

function demoIso(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

// One stored journal per token; the demo account keeps the key "demo.server".
const DEMO_TOKEN = "0ef3ae3665c3a71177e34bea83f285ab4f53d666bbfaaa301a649bd8cef7dee9";
function demoKey(token) { return !token || token === DEMO_TOKEN ? "demo.server" : "demo.server." + token.slice(0, 12); }
function demoJournal(token) { return localStorage.getItem(demoKey(token)) || ""; }

function demoSeed() {
  if (localStorage.getItem("demo.seeded")) return;
  localStorage.setItem("demo.seeded", "1");
  const seed = [
    `Quote for the kitchen renovation #date-${demoIso(-1)} #facet-work #rank-high #size-l #action-now #topic-quotes`,
    `Morning walk #date-${demoIso(-3)} #recurring-daily #facet-self`,
    `Training #date-${demoIso(0)} #time-11:55-13:15 #facet-self`,
    `Call the plumber #date-${demoIso(0)} #facet-self #action-required`,
    `Follow up on the supplier offer #date-${demoIso(0)} #facet-work #action-waiting`,
    `Renew library books #date-${demoIso(0)} #facet-family #rank-low`,
    `Sort tax documents #date-${demoIso(0)} #facet-self #topic-taxes`,
    `Order printer paper #date-${demoIso(0)} #facet-work`,
    `Plan the school trip packing list #date-${demoIso(0)} #facet-family`,
    `Breakfast with the neighbours #date-${demoIso(1)} #time-08:00 #facet-family`,
    `Pick up the parcel #date-${demoIso(1)} #time-15:00 #facet-self #review-needed`,
    `Contact the camera vendor about the trial #date-${demoIso(2)} #facet-work #topic-partners`,
    `Tidy the workbench #date-${demoIso(3)} #time-1h #facet-work`,
    `Trade fair #date-${demoIso(10)} #date-${demoIso(12)} #time-09:00-17:00 #facet-work`,
    `Book the summer holiday #date-${demoIso(45)} #facet-family`,
    `Tag definition: annual tax return #date-3000-12-31 #facet-self #topic-taxes`,
  ];
  // Plain lines go into the working copy; the client encrypts and sends them.
  localStorage.setItem("agenda.wc", seed.join("\n"));
}

// Simulated relay (spec 8.4): stores encrypted lines, never decrypts.
function demoEtag(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return '"' + (h >>> 0).toString(16) + '"'; }

window.fetch = async function (url, opts = {}) {
  await new Promise(r => setTimeout(r, 120));
  if (!window.DEMO.online) throw new TypeError("Failed to fetch");
  const u = String(url), m = (opts.method || "GET").toUpperCase(), h = opts.headers || {};
  const token = String(h.Authorization || "").replace(/^Bearer /, ""), dk = demoKey(token);
  const body = demoJournal(token), etag = demoEtag(body);
  const valid = t => t.split("\n").filter(Boolean).every(l => /^[A-Za-z0-9+/]+={0,2}$/.test(l));
  if (u.endsWith("/append") && m === "POST") {
    if (!valid(String(opts.body || ""))) return new Response("invalid line format", { status: 400 });
    localStorage.setItem(dk, body + String(opts.body || ""));
    return new Response(null, { status: 204, headers: { ETag: demoEtag(demoJournal(token)) } });
  }
  if (u.endsWith("/journal") && m === "GET") {
    if (h["If-None-Match"] === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
    return new Response(body, { status: 200, headers: { "Content-Type": "text/plain", ETag: etag } });
  }
  if (u.endsWith("/journal") && m === "PUT") {
    if (h["If-Match"] !== etag) return new Response("journal changed", { status: 412 });
    localStorage.setItem(dk, String(opts.body || ""));
    return new Response(null, { status: 204, headers: { ETag: demoEtag(demoJournal(token)) } });
  }
  if (u.endsWith("/journal") && m === "DELETE") { localStorage.removeItem(dk); return new Response(null, { status: 204 }); }
  return new Response("not found", { status: 404 });
};
demoSeed();
</script>
