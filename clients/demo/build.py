# Builds the click dummy from clients/web/index.html: removes the service worker,
# adds a demo bar and a simulated server (fetch override) that keeps data in localStorage.
# Usage: python3 clients/demo/build.py  ->  clients/demo/dist/agenda-click-dummy.html
import os
import re
HERE = os.path.dirname(os.path.abspath(__file__))
s = open(os.path.join(HERE, '..', 'web', 'index.html')).read()
def rep(a, b):
    global s
    assert a in s, a[:60]
    s = s.replace(a, b, 1)
rep('<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">', '<meta name="viewport" content="width=device-width, initial-scale=1">')
rep('<link rel="manifest" href="manifest.webmanifest">\n', '')
s = re.sub(r'<title>([^<]*)</title>', r'<title>\1 — click dummy</title>', s, count=1)  # either brand (brand.json)
rep('if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});\n', '')
rep('</style>', '''  #demobar { background:var(--amethyst); color:#fff; font-size:12px; padding:6px 16px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  #demobar button { color:#fff; border-color:rgba(255,255,255,.5); min-height:30px; padding:0 8px; font-size:12px; }
  #demobar .spacer { flex:1; }
</style>''')
rep('<body>', '''<body>
<div id="demobar">
  <span>Click dummy — no real server. A simulated relay runs in this page; it stores only encrypted lines. Demo phrase: garden window river cable orbit maple quote harbor.</span>
  <span class="spacer"></span>
  <button id="demoNet">Simulated server: online</button>
  <button id="demoServer">Show server journal</button>
  <button id="demoReset">Reset demo</button>
</div>
<div id="demoJournal" class="hidden" style="padding:10px 14px;border-bottom:1px solid var(--line)"><pre style="white-space:pre-wrap;font-size:11px;margin:0" id="demoJournalText"></pre></div>''')
rep('<script>\n"use strict";', open(os.path.join(HERE, 'mock.js')).read() + '\n<script>\n"use strict";')
rep('\nsetView(monthMode ? "month" : "agenda");', '''
document.getElementById("demoNet").onclick = () => {
  DEMO.online = !DEMO.online;
  document.getElementById("demoNet").textContent = "Simulated server: " + (DEMO.online ? "online" : "offline");
  if (DEMO.online) sync(); else { serverState = "offline (simulated)"; render(); }
};
document.getElementById("demoServer").onclick = () => {
  const box = document.getElementById("demoJournal");
  box.classList.toggle("hidden");
  document.getElementById("demoJournalText").textContent = demoJournal() || "(empty)";
};
document.getElementById("demoReset").onclick = () => {
  for (const k of Object.keys(localStorage)) if (k.startsWith("agenda.") || k.startsWith("demo.")) localStorage.removeItem(k);
  location.reload();
};
const _origRender = render;
render = function () { _origRender(); const b = document.getElementById("demoJournal"); if (!b.classList.contains("hidden")) document.getElementById("demoJournalText").textContent = demoJournal() || "(empty)"; };

setView(monthMode ? "month" : "agenda");''')
os.makedirs(os.path.join(HERE, 'dist'), exist_ok=True)
open(os.path.join(HERE, 'dist', 'agenda-click-dummy.html'), 'w').write(s)
