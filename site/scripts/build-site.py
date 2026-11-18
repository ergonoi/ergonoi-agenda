#!/usr/bin/env python3
"""
Builds the user documentation of οὐθείς Agenda from site/content/ into site/html/.

The structure and the templates follow outheis-docs (https://outheis.com):
directories are sections, numbered files are pages, index.md of a section comes
first, every H2 is a section of the page. English is the base (html/), German is
built alongside (html/de/); a page without German text is built from the English
one with a note.

Usage: python3 site/scripts/build-site.py   (needs: pip install markdown)
"""

import re
import shutil
from pathlib import Path

import markdown

SITE = Path(__file__).resolve().parent.parent
CONTENT = SITE / "content"
TEMPLATES = SITE / "templates"
OUT = SITE / "html"
VERSION = (SITE.parent / "VERSION").read_text(encoding="utf-8").strip()

LANGS = ["en", "de"]
SITE_TITLE = "οὐθείς Agenda"
BASE_URL = "https://outheis-labs.github.io/outheis-agenda/"

# Section order and labels; the pages come from the file tree.
SECTIONS = [
    ("start", {"en": "Start", "de": "Start"}),
    ("using", {"en": "Using the agenda", "de": "Mit der Agenda arbeiten"}),
    ("journals", {"en": "Journals and sharing", "de": "Journale und Teilen"}),
    ("reference", {"en": "Reference", "de": "Nachschlagen"}),
]

TEXT = {
    "en": {"contents": "Contents", "prev": "Previous", "next": "Next",
           "footer": "οὐθείς Agenda " + VERSION + " · an ergonoi project",
           "hero_subtitle": "An open and lightweight planning journal",
           "untranslated": "",
           "description": "Appointments, tasks and notes in one place. Encrypted on your device, shared by codes, in any browser.",
           "locale": "en_US"},
    "de": {"contents": "Inhalt", "prev": "Zurück", "next": "Weiter",
           "footer": "οὐθείς Agenda " + VERSION + " · ein ergonoi-Projekt",
           "hero_subtitle": "Ein offenes und leichtgewichtiges Planungsjournal",
           "untranslated": "<p class=\"subtitle\">Diese Seite ist noch nicht übersetzt; es folgt der englische Text.</p>",
           "description": "Termine, Aufgaben und Notizen an einem Ort. Auf dem Gerät verschlüsselt, mit Codes geteilt, in jedem Browser.",
           "locale": "de_DE"}
}


def page_files(lang_root: Path, section: str) -> list:
    d = lang_root / section
    if not d.exists():
        return []
    return sorted(d.glob("*.md"), key=lambda f: ("0" if f.name == "index.md" else "1", f.name))


def title_and_subtitle(md: str) -> tuple:
    title, sub = "", ""
    lines = md.strip().split("\n")
    for i, line in enumerate(lines):
        if line.startswith("# "):
            title = line[2:].strip()
            for nxt in lines[i + 1:i + 6]:
                n = nxt.strip()
                if n.startswith("*") and n.endswith("*") and not n.startswith("**"):
                    sub = n.strip("*").strip()
                    break
                if n and not n.startswith("---"):
                    break
            break
    return title, sub


def md_to_html(md: str) -> str:
    html = markdown.markdown(md, extensions=["tables", "fenced_code", "attr_list", "toc"],
                             extension_configs={"toc": {"permalink": False}})
    return re.sub(r"οὐθείς", '<span class="greek">οὐθείς</span>', html)


def wrap_sections(html: str) -> str:
    """Every H2 starts a section: heading left, text right (as in outheis-docs)."""
    html = re.sub(r"<h1[^>]*>.*?</h1>\s*", "", html, count=1, flags=re.S)
    html = re.sub(r"\s*<hr\s*/?>\s*", "\n", html)
    parts = re.split(r"(<h2[^>]*>.*?</h2>)", html, flags=re.S)
    out = []
    intro = re.sub(r"^(\s*<p><em>.*?</em></p>\s*)", "", parts[0].strip(), count=1).strip()
    if intro:
        out.append(f'<section class="section"><h2></h2><div class="section-text">{intro}</div></section>')
    for i in range(1, len(parts), 2):
        head, body = parts[i], parts[i + 1].strip() if i + 1 < len(parts) else ""
        m = re.search(r'id="([^"]*)"', head)
        sid = f' id="{m.group(1)}"' if m else ""
        text = re.sub(r"</?h2[^>]*>", "", head).strip()
        out.append(f'<section class="section"{sid}>\n      <h2>{text}</h2>\n'
                   f'      <div class="section-text"><h2>{text}</h2>\n        {body}\n      </div>\n    </section>')
    return "\n\n    ".join(out)


def nav_list(lang: str) -> list:
    """All pages in reading order, with titles from the language's file or the English one."""
    flat = []
    for sid, labels in SECTIONS:
        for f in page_files(CONTENT / "en", sid):
            rel = f.relative_to(CONTENT / "en")
            src = CONTENT / lang / rel
            md = (src if src.exists() else f).read_text(encoding="utf-8")
            title, sub = title_and_subtitle(md)
            flat.append({"rel": rel, "url": str(rel.with_suffix(".html")), "title": title, "desc": sub,
                         "section": sid, "section_label": labels[lang], "translated": src.exists()})
    return flat


def lang_switch(lang: str, page_url: str, depth_root: str) -> str:
    """Links to the same page in the other language; the active one is not a link."""
    out = []
    for l in LANGS:
        if l == lang:
            out.append(f'<span class="lang-active">{l.upper()}</span>')
        else:
            # from html/<page> to html/de/<page>, and back
            base = depth_root + ("de/" if l == "de" else "../")
            out.append(f'<a href="{base}{page_url}" hreflang="{l}">{l.upper()}</a>')
    return " · ".join(out)


def meta(lang: str, title: str, desc: str, url: str) -> str:
    """Description and link-preview tags; the image needs an absolute address."""
    e = lambda x: x.replace("&", "&amp;").replace('"', "&quot;")
    full = BASE_URL + ("" if lang == "en" else lang + "/") + (url if url != "index.html" else "")
    tags = [f'<meta name="description" content="{e(desc)}">',
            f'<meta property="og:type" content="website">',
            f'<meta property="og:site_name" content="{SITE_TITLE}">',
            f'<meta property="og:title" content="{e(title)}">',
            f'<meta property="og:description" content="{e(desc)}">',
            f'<meta property="og:url" content="{full}">',
            f'<meta property="og:locale" content="{TEXT[lang]["locale"]}">',
            f'<meta property="og:image" content="{BASE_URL}assets/og.jpg">',
            '<meta property="og:image:width" content="1200">',
            '<meta property="og:image:height" content="630">',
            '<meta name="twitter:card" content="summary_large_image">',
            f'<link rel="canonical" href="{full}">']
    return "\n  ".join(tags)


def fill(tpl: str, **kv) -> str:
    for k, v in kv.items():
        tpl = tpl.replace(f"<!-- {k} -->", v)
    return tpl


def build_lang(lang: str, default_tpl: str, hero_tpl: str):
    t = TEXT[lang]
    out_root = OUT if lang == "en" else OUT / lang
    flat = nav_list(lang)

    def roots(url: str) -> tuple:
        depth = url.count("/")
        root = "../" * depth
        assets = root + ("" if lang == "en" else "../")
        return root, assets

    common = {"LANG": lang, "CONTENTS_LABEL": t["contents"], "FOOTER": t["footer"]}

    # Pages
    for i, p in enumerate(flat):
        src = CONTENT / lang / p["rel"]
        md = (src if src.exists() else CONTENT / "en" / p["rel"]).read_text(encoding="utf-8")
        root, assets = roots(p["url"])
        sub = f'<p class="subtitle">{p["desc"]}</p>' if p["desc"] else ""
        if not p["translated"]:
            sub += t["untranslated"]
        crumb = (f'<div class="breadcrumb">\n        <span class="separator">/</span>\n'
                 f'        <a href="{root}contents.html#{p["section"]}">{p["section_label"]}</a>\n'
                 f'        <span class="separator">/</span>\n        <span class="current">{p["title"]}</span>\n      </div>')
        prev, nxt = (flat[i - 1] if i else None), (flat[i + 1] if i + 1 < len(flat) else None)
        book = ('<nav class="book-nav">\n'
                f'      <div class="prev">{"" if not prev else f"""<a href="{root}{prev["url"]}"><span class="label">← {t["prev"]}</span><span class="title">{prev["title"]}</span></a>"""}</div>\n'
                f'      <div class="toc-center"><a href="{root}contents.html#{p["section"]}"><span class="label">{t["contents"]}</span><span class="title">{p["section_label"]}</span></a></div>\n'
                f'      <div class="next">{"" if not nxt else f"""<a href="{root}{nxt["url"]}"><span class="label">{t["next"]} →</span><span class="title">{nxt["title"]}</span></a>"""}</div>\n'
                '    </nav>')
        page = fill(default_tpl, ROOT=root, ASSETS=assets, TITLE=f'{p["title"]} · {SITE_TITLE}', PAGE_TITLE=p["title"],
                    SUBTITLE=sub, BREADCRUMB=crumb, SECTION_ANCHOR="#" + p["section"],
                    LANG_SWITCH=lang_switch(lang, p["url"], root), CONTENT=wrap_sections(md_to_html(md)),
                    META=meta(lang, f'{p["title"]} · {SITE_TITLE}', p["desc"] or t["description"], p["url"]),
                    BOOK_NAV=book, **common)
        dst = out_root / p["url"]
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(page, encoding="utf-8")

    # Contents page
    md = [f"# {t['contents']}", ""]
    for sid, labels in SECTIONS:
        items = [p for p in flat if p["section"] == sid]
        if not items:
            continue
        md += [f"## {labels[lang]} {{#{sid}}}", "", '<ul class="toc-list">']
        md += [f'<li><a href="{p["url"]}"><div class="title">{p["title"]}</div><div class="description">{p["desc"]}</div></a></li>' for p in items]
        md += ["</ul>", ""]
    root, assets = roots("contents.html")
    page = fill(default_tpl, ROOT=root, ASSETS=assets, TITLE=f'{t["contents"]} · {SITE_TITLE}', PAGE_TITLE=t["contents"],
                SUBTITLE="", BREADCRUMB="", SECTION_ANCHOR="", LANG_SWITCH=lang_switch(lang, "contents.html", root),
                CONTENT=wrap_sections(md_to_html("\n".join(md))), BOOK_NAV="",
                META=meta(lang, f'{t["contents"]} · {SITE_TITLE}', t["description"], "contents.html"), **common)
    (out_root / "contents.html").write_text(page, encoding="utf-8")

    # Landing page: the lead is the text before the first ---.
    src = CONTENT / lang / "index.md"
    raw = (src if src.exists() else CONTENT / "en" / "index.md").read_text(encoding="utf-8")
    lead, _, rest = raw.partition("\n---\n")
    lead = re.sub(r"^#\s+.+\n+", "", lead)
    lead_html = re.sub(r"<p>(.*?)</p>\s*", r"\1<br><br>", md_to_html(lead), flags=re.S)
    lead_html = re.sub(r"(<br><br>)+$", "", lead_html.strip())
    page = fill(hero_tpl, ROOT="", ASSETS="" if lang == "en" else "../", TITLE=SITE_TITLE, PAGE_TITLE=SITE_TITLE,
                HERO_SUBTITLE=t["hero_subtitle"], HERO_LEAD=lead_html, LANG_SWITCH=lang_switch(lang, "index.html", ""),
                CONTENT=wrap_sections(md_to_html(rest)),
                META=meta(lang, SITE_TITLE, t["description"], "index.html"), **common)
    (out_root / "index.html").write_text(page, encoding="utf-8")
    print(f"  {lang}: {len(flat)} pages, {sum(1 for p in flat if not p['translated'])} untranslated")


def main():
    default_tpl = (TEMPLATES / "default.html").read_text(encoding="utf-8")
    hero_tpl = (TEMPLATES / "hero.html").read_text(encoding="utf-8")
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for lang in LANGS:
        build_lang(lang, default_tpl, hero_tpl)
    shutil.copytree(SITE / "assets", OUT / "assets")
    (OUT / ".nojekyll").write_text("")
    print("Done:", OUT)


if __name__ == "__main__":
    main()
