# User documentation

The documentation site of ergonoi Agenda. Structure, templates and build follow
[outheis-docs](https://github.com/outheis-labs/outheis-docs); the content is its own.

```
site/
├── content/en/     # base language: index.md, then one directory per section
├── content/de/     # German, same paths; a missing page is built from the English one with a note
├── templates/      # default.html (pages), hero.html (landing page)
├── assets/         # fonts (self-hosted), icons, hero image
└── scripts/build-site.py
```

Sections are the directories `start`, `using`, `journals`, `reference` (order and labels in
the script); pages are their Markdown files, `index.md` first, then by file name. The first
italic line under the H1 is the subtitle and the description on the contents page; every H2
becomes a section of the page.

```
pip install markdown
python3 site/scripts/build-site.py     # → site/html (EN), site/html/de (DE)
```

No examples with real names, journals or facets of real people.
