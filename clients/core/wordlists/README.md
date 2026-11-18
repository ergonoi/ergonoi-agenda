# Word lists

Lists of 2048 words for phrases and ally codes (docs/architecture.md, 8.2 and 8.11e). Each
word stands for 11 bits by its position, so the order must never change. All words are plain
ASCII: accents of the original lists are removed (each list stays free of duplicates).

| File | Language | Source | Licence |
|---|---|---|---|
| `en.txt` | English | BIP39, bitcoin/bips `bip-0039/english.txt` | MIT |
| `de.txt` | German | dys2p/wordlists-de `de-2048-v1.txt` | Unlicense, CC0 or BSD-3 |
| `fr.txt` | French | BIP39 `french.txt`, accents removed | MIT |
| `es.txt` | Spanish | BIP39 `spanish.txt`, accents removed | MIT |
| `it.txt` | Italian | BIP39 `italian.txt` | MIT |
| `pt.txt` | Portuguese | BIP39 `portuguese.txt` | MIT |
| `cs.txt` | Czech | BIP39 `czech.txt` | MIT |

`build.py` writes them into `clients/core/agenda-core.js` (between the `@@wordlists` markers)
and into `clients/cli/journal/wordlists.go`. Run it after changing a list.
