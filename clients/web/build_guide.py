#!/usr/bin/env python3
"""Builds clients/web/guide.html from docs/guide.md (the guide reachable from the app).

Usage: python3 clients/web/build_guide.py
"""
import pathlib
import re

import markdown

root = pathlib.Path(__file__).resolve().parents[2]
src = (root / "docs" / "guide.md").read_text(encoding="utf-8")
# Links to repository files are not reachable from the app; keep their text.
src = re.sub(r"\[([^\]]+)\]\([^)]+\.md\)", r"\1", src)
body = markdown.markdown(src, extensions=["tables", "fenced_code"])

page = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>οὐθείς Agenda — Guide</title>
<link rel="icon" href="favicon-32.png">
<style>
  @font-face {{ font-family:"IBM Plex Sans"; font-weight:100 700; font-display:swap; src:url(fonts/ibm-plex-sans-variable.woff2) format("woff2"); }}
  @font-face {{ font-family:"Inter"; font-weight:100 900; font-display:swap; src:url(fonts/inter-latin-wght.woff2) format("woff2"); unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+20AC,U+2122,U+2212; }}
  @font-face {{ font-family:"Inter"; font-weight:100 900; font-display:swap; src:url(fonts/inter-greek-wght.woff2) format("woff2"); unicode-range:U+0370-03FF; }}
  @font-face {{ font-family:"Inter"; font-weight:100 900; font-display:swap; src:url(fonts/inter-greek-ext-wght.woff2) format("woff2"); unicode-range:U+1F00-1FFF; }}
  @font-face {{ font-family:"IBM Plex Mono"; font-weight:400; font-display:swap; src:url(fonts/ibm-plex-mono-latin-400.woff2) format("woff2"); }}
  :root {{ --fg:#1A1A1A; --muted:#6B6767; --line:#B8B4B4; --aqua:#97EAD2; }}
  body {{ margin:0; font:16px/1.55 "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif; color:var(--fg); background:#fff; }}
  header {{ background:var(--aqua); border-bottom:.5px solid #1A1A1A; padding:14px 16px; }}
  header a {{ color:var(--fg); text-decoration:none; font-size:15px; }}
  main {{ max-width:720px; margin:0 auto; padding:8px 16px 48px; }}
  h1, h2, h3, header .name {{ font-family:"Inter", sans-serif; }}
  h1 {{ font-size:26px; margin:18px 0 8px; }}
  h2 {{ font-size:20px; margin:32px 0 8px; border-top:.5px solid var(--line); padding-top:20px; }}
  h3 {{ font-size:17px; margin:22px 0 6px; }}
  code {{ font:14px "IBM Plex Mono", ui-monospace, "SF Mono", Consolas, monospace; }}
  pre {{ overflow:auto; padding:10px 12px; border:.5px solid var(--line); border-radius:6px; }}
  table {{ border-collapse:collapse; width:100%; font-size:14px; }}
  th, td {{ text-align:left; vertical-align:top; padding:6px 8px 6px 0; border-bottom:.5px solid var(--line); }}
  li {{ margin:4px 0; }}
</style>
</head>
<body>
<header><a href="./">← οὐθείς Agenda</a></header>
<main>
{body}
</main>
</body>
</html>
"""
(root / "clients" / "web" / "guide.html").write_text(page, encoding="utf-8")
print("wrote clients/web/guide.html")
