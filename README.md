# ergonoi Agenda

![](docs/key-visual.png)

*An open planning journal. Documentation: https://ergonoi.github.io/ergonoi-agenda/*

Author: Markus Schatzl

### Journal and agenda in plain text

One line per entry. A handful of tags. A file that can be read and written by hand, by voice, by any program and by any language model — and that still works when there is no network, no server and no app.

**outheis-agenda is the agenda layer of outheis, reduced to its format: a grammar for items, an append-only change model, and the smallest service and client that make it usable every day.**

---

## The Problem

A list of a hundred items is of no use. What is needed is a structure that shows the right items at the right time — and a format that does not depend on one application, one device or one vendor to remain readable.

Text and document apps synchronise text but know nothing about time, state or priority. Calendar and task apps know about time but lock the data into their own models and interfaces. Neither can be fed reliably from dictation, a photographed handwritten list, or a language model.

## Approach

- **Plain text** — one item per line, text first, tags trailing; valid without any system
- **Few tags** — facet, date, time, recurrence, rank, size, action state, topic; tags are scaffolding, not taxonomy
- **Append-only** — every change is a new version of the item (`#id` stays, `#rev` grows); a nightly run compacts
- **Offline first** — every client keeps a working copy and syncs when it can; no operation waits for the network
- **Encrypted in the client** — the service is a relay for encrypted lines; an eight-word phrase is the account, and the journal file can also be used locally without any service
- **Robust ingestion** — any text, from any source, in any order, any number of times: nothing is lost, nothing is duplicated
- **Model-friendly** — the grammar is simple enough for a small on-device model to produce and for a large one to query
- **One place for user data** — phrase, journal and settings stay with the user (human directory or browser storage); the vocabulary of facets and topics is carried by the journal itself; the service holds nothing it can read

## Documentation

- **[User documentation](https://outheis-labs.github.io/outheis-agenda/)** — English and German; sources in `site/`, built by `site/scripts/build-site.py`
- **[Decisions](docs/decisions.md)** — what was decided, why, and which alternatives were rejected; open items
- **[Architecture](docs/architecture.md)** — entry format, tag grammar, time semantics, change model, ingestion, storage, sync, deployment
- **[User interface](docs/ui.md)** — design tokens, colours, typography, components, interaction
- **[Prompts](docs/prompts/)** — templates for dictation on device, assistant, Lumo variant

## Structure

```
outheis-agenda/
├── site/            # user documentation (content/en, content/de, templates, scripts)
├── docs/
│   ├── decisions.md
│   ├── architecture.md
│   ├── ui.md
│   └── prompts/
├── server/          # Go relay service: stores encrypted lines per account, admission rules
├── clients/
│   ├── core/        # agenda-core.js: grammar, encryption, merging, journals, bot rules; shared by all clients
│   ├── web/         # web client (PWA), embedded into the server binary; index.html is built from index.src.html
│   └── demo/        # click dummy: web client with a simulated server
└── deploy/          # systemd unit, nginx configuration, deployment guide

human/               # user data, created at runtime, never committed
```

## Building the web client

`clients/web/index.html` is generated: edit `clients/web/index.src.html` and `clients/core/agenda-core.js`, then run

```
python3 clients/web/build.py         # inlines the core module and VERSION into index.html; names the offline cache
python3 site/scripts/build-site.py   # user documentation in site/html (EN, DE; GitHub Pages)
TZ=Europe/Berlin node --test clients/core/test/*.test.mjs
```

Browser tests of the web client (Chrome, a local service, the click dummy): `clients/web/e2e`, see its README.

## Running

Requires Go ≥ 1.22.

```
go test ./...
go build -o agenda-service ./server
./agenda-service
```

Open http://127.0.0.1:41380/, choose *New account* and write down the eight-word phrase. The service stores only encrypted lines in `accounts/` (`-data DIR`); it holds no key. Endpoints and admission rules: [Architecture, section 8](docs/architecture.md#8-storage-and-transport).

Click dummy without a server:

```
python3 clients/demo/build.py   # → clients/demo/dist/agenda-click-dummy.html
```

Deployment on a server with HTTPS: [deploy/DEPLOY.md](deploy/DEPLOY.md).

## License & Status

Private repository; license not yet chosen. Third-party parts and their licences: fonts in `clients/web/fonts` (SIL Open Font License), QR encoder and decoder in `clients/web/vendor` (MIT, Apache-2.0). In use since November 2026: relay service and web application with client-side encryption working; MCP module, recurring occurrences and views beyond the date groups still open.

## About

Built by [Markus Schatzl](mailto:technology.culture@proton.me) as part of [outheis](https://github.com/outheis-labs/outheis-beta).
