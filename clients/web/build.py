#!/usr/bin/env python3
"""Builds clients/web/index.html: the page template index.src.html with the shared
core module (clients/core/agenda-core.js) inlined, so that the web client stays a
single file. Edit index.src.html and agenda-core.js, never index.html.

brand.json sets the default theme (outheis or ergonoi): the page's name and colour, the
manifest, and which icons from icon-src/icons/ become icon-*.png, apple-touch-icon.png,
favicon-32.png and favicon.ico. The choice in Settings still wins per device. See
docs/rebrand.md.

Usage: python3 clients/web/build.py
"""
import json
import pathlib
import re
import shutil

here = pathlib.Path(__file__).resolve().parent
brand = json.loads((here / "brand.json").read_text(encoding="utf-8"))
theme = brand["default"]
look = brand["themes"][theme]
version = (here.parents[1] / "VERSION").read_text(encoding="utf-8").strip()
DOCS_URL = "https://outheis-labs.github.io/outheis-agenda/"
core = (here.parent / "core" / "agenda-core.js").read_text(encoding="utf-8")
# The module's export statement has no meaning inside a classic script.
core = re.sub(r"\nexport \{[^}]*\};\s*$", "\n", core)
src = (here / "index.src.html").read_text(encoding="utf-8")
marker = re.compile(r"^// @@core@@.*$", re.M)
if len(marker.findall(src)) != 1:
    raise SystemExit("index.src.html must contain the core marker exactly once")
out = marker.sub(lambda _: "// ---- core: clients/core/agenda-core.js (inlined by build.py) ----\n" + core.strip() + "\n// ---- end of core ----", src)
out = out.replace("@@VERSION@@", version).replace("@@DOCS_URL@@", DOCS_URL)
out = out.replace("@@BRAND_NAME@@", look["name"]).replace("@@THEME_COLOR@@", look["color"]).replace("@@DEFAULT_THEME@@", theme)
# Fonts are embedded from clients/web/fonts, so the page stays one self-contained file.
import base64
out = re.sub(r"@@FONT:([a-z0-9-]+)@@", lambda m: base64.b64encode((here / "fonts" / (m.group(1) + ".woff2")).read_bytes()).decode(), out)
# Third-party scripts in clients/web/vendor (licences next to them) are inlined too.
vendor = re.compile(r"^// @@VENDOR:([a-z0-9-]+)@@$", re.M)
out = vendor.sub(lambda m: (here / "vendor" / (m.group(1) + ".min.js")).read_text(encoding="utf-8").strip(), out)
left = set(re.findall(r"@@[A-Z_]+@@", out)) - {"@@ORIGIN@@"}  # ORIGIN: replaced by the service per request
if left:
    raise SystemExit("unreplaced markers: " + ", ".join(sorted(set(left))))
(here / "index.html").write_text(out, encoding="utf-8")
# Manifest and icons of the default theme.
manifest = {
    "name": look["name"], "short_name": look["name"], "start_url": "./", "display": "standalone",
    "background_color": "#FFFFFF", "theme_color": look["color"],
    "icons": [{"src": f"icon-{s}.png", "sizes": f"{s}x{s}", "type": "image/png", "purpose": "any maskable"} for s in (192, 512)],
}
(here / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
icons = here / "icon-src" / "icons"
for src_name, dst in ((f"{theme}-192.png", "icon-192.png"), (f"{theme}-512.png", "icon-512.png"), (f"{theme}-180.png", "apple-touch-icon.png"), (f"{theme}-32.png", "favicon-32.png"), (f"{theme}.ico", "favicon.ico")):
    shutil.copy(icons / src_name, here / dst)
# The service reports the same version at GET /health (server/main.go).
(here / "version.txt").write_text(version + "\n", encoding="utf-8")
# The offline cache is named after version and content, so every build replaces it.
import hashlib
digest = hashlib.sha256(out.encode("utf-8")).hexdigest()[:8]
sw = (here / "sw.js").read_text(encoding="utf-8")
sw = re.sub(r'const CACHE = "[^"]*";', f'const CACHE = "agenda-shell-{version}-{digest}";', sw)
(here / "sw.js").write_text(sw, encoding="utf-8")
print(f"wrote clients/web/index.html, manifest, icons and sw.js (version {version}, theme {theme}, cache {digest})")
