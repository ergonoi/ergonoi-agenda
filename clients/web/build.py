#!/usr/bin/env python3
"""Builds clients/web/index.html: the page template index.src.html with the shared
core module (clients/core/agenda-core.js) inlined, so that the web client stays a
single file. Edit index.src.html and agenda-core.js, never index.html.

Usage: python3 clients/web/build.py
"""
import pathlib
import re

here = pathlib.Path(__file__).resolve().parent
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
# Fonts are embedded from clients/web/fonts, so the page stays one self-contained file.
import base64
out = re.sub(r"@@FONT:([a-z0-9-]+)@@", lambda m: base64.b64encode((here / "fonts" / (m.group(1) + ".woff2")).read_bytes()).decode(), out)
# Third-party scripts in clients/web/vendor (licences next to them) are inlined too.
vendor = re.compile(r"^// @@VENDOR:([a-z0-9-]+)@@$", re.M)
out = vendor.sub(lambda m: (here / "vendor" / (m.group(1) + ".min.js")).read_text(encoding="utf-8").strip(), out)
(here / "index.html").write_text(out, encoding="utf-8")
# The offline cache is named after version and content, so every build replaces it.
import hashlib
digest = hashlib.sha256(out.encode("utf-8") + (here / "guide.html").read_bytes()).hexdigest()[:8]
sw = (here / "sw.js").read_text(encoding="utf-8")
sw = re.sub(r'const CACHE = "[^"]*";', f'const CACHE = "agenda-shell-{version}-{digest}";', sw)
(here / "sw.js").write_text(sw, encoding="utf-8")
print(f"wrote clients/web/index.html and sw.js (version {version}, cache {digest})")
