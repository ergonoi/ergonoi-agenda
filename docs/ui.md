# Agenda — User Interface Specification

Status: 2026-11-20 · Companion to `architecture.md` (data model, sync) · Reference implementation: `clients/web/index.src.html` with `clients/core/agenda-core.js`, built into `clients/web/index.html`

This document contains everything needed to build the agenda client, or a client in the same visual language: principles, design tokens, layout, components, interactions, ordering rules and states. All values are those of the reference implementation.

---

## 1. Principles

1. **Follow the outheis web interface.** White surfaces, thin structural lines, no decorative fills, no shadows except on floating layers.
2. **Colour only where it carries meaning.** Facet, urgency, attention and sync state. Never grey fills, never colour for decoration.
3. **The item leads.** Text and time are the primary reading line; tags are secondary and hidden until requested.
4. **Fixed places.** Tags always appear in canonical order (architecture 3.2); each tag has a predictable position.
5. **Phone first.** Every touch target ≥ 44 px; all actions reachable with one thumb; no hover-only functions.
6. **Few taps.** Changing a tag: two taps. Adding a tag: two taps. Closing an item: one swipe, one tap.
7. **Local first.** No action waits for the network (architecture 7.7). The interface always shows what state it displays and what is pending.
8. **Balance is fragile.** Changes to size, weight or colour of one element affect the hierarchy of all others; adjust one thing at a time.

### 1a. Increments

The interface changes in steps, each recorded here with its aim. The aim of the steps since November 2026 is ergonomics (short paths for frequent actions, fixed places, no surprises) and an uncluttered interface (one task per area, nothing on screen that is needed only now and then). The model is the clarity of well-made professional apps such as PatMed: one header with one task, a calm list, choices in menus and panels rather than in bars over the content.

1. **0.9.0 (20 November 2026): views, facet panel, title.** The facet bar over the list and the filter tab are replaced by named views, chosen from the title, and a facet panel grouped by journal (4.14). Frequent switches between facet combinations take two taps from anywhere; the list gains the rows the bar took; it is visible at once whom a facet belongs to; a read-only journal is marked with a lock instead of a label. Decisions 6.7.
2. **0.9.1, branch `ui-concept`: phone layout and settings.** On phones a bottom bar *List* / *Month* / *Text*, the menu in the facet panel, settings as pages with a back arrow, rows with switches, PIN levels as a list with a check mark, actions as rows and dangerous ones in Scarlet at the end; journals as rows that open their dialog. *Test connection* under the server address (decisions 6.4b).
3. **Branch `ui-concept`: three columns on wide screens.** From 1440 px the facet panel, the list and a detail column stand side by side. The list shows when, text and markers only; a click chooses an entry, and the detail column shows it with all its tags as rows (dimension left, value right), where text and tags are changed as before, together with *Done or reschedule* and the note. Without a choice the column stays in place with a short hint. Below 1440 px nothing changes. List and month view alike.

---

## 2. Design Tokens

### 2.1 Colours — light (default)

Source: outheis colour system (`outheis-beta/src/outheis/webui/assets/colors.md`).

| Token | Hex | outheis name | Use |
|---|---|---|---|
| `--bg` | `#FFFFFF` | White | all surfaces |
| `--hover` | `#F4F3F3` | Fog | hover background of list options only |
| `--fg` | `#1A1A1A` | Charcoal | primary text, active tab, time line |
| `--fg2` | `#4A4646` | Slate | secondary text, tag values, icons |
| `--muted` | `#7A7676` | Stone | labels, group headings, tag dimension names, status line |
| `--line` | `#B8B4B4` | Silver | separators between items, chip borders, input underlines |
| `--rule` | `#1A1A1A` | Charcoal | structural lines: header bottom, popover and sheet borders |
| `--teal` | `#218380` | Teal | in-sync state, apply (✓) |
| `--amber` | `#FFB400` | Amber Flame | pending sync, `review`, not synced, notices |
| `--scarlet` | `#FF2E00` | Scarlet Fire | urgency (`action:now`), overdue, destructive options, recording |
| `--wisteria` | `#C490D1` | Wisteria | facet colour |
| `--aqua` | `#97EAD2` | Pearl Aqua | facet colour |
| `--amethyst` | `#460A46` | Dark Amethyst | primary actions (Add, Done, Save) |
| `--blue` | `#2B3BD6` | Blue (outside the outheis colour system) | a filled clipboard only (4.16); not a facet colour |

### 2.2 Colours — dark (`prefers-color-scheme: dark`)

| Token | Value |
|---|---|
| `--bg` | `#1a1a1a` |
| `--hover` | `#242424` |
| `--fg` | `#f0f0f0` |
| `--fg2` | `#a0a0a0` |
| `--muted` | `#707070` |
| `--line` | `rgba(255,255,255,.14)` |
| `--rule` | `rgba(255,255,255,.35)` |
| `--amethyst` | `#C490D1` (Dark Amethyst is too dark on dark ground) |

Accent colours (teal, amber, scarlet, facet colours) are unchanged.

### 2.3 Facet colours

Facet values are the user's own (architecture 3.4); colours are therefore not bound to names. They are assigned in order of first use of the facet (smallest `#id` carrying it), from this palette, cycling after the sixth:

| Order | Colour | Hex |
|---|---|---|
| 1 | Dark Amethyst | `#460A46` |
| 2 | Teal | `#218380` |
| 3 | Scarlet Fire | `#FF2E00` |
| 4 | Amber Flame | `#FFB400` |
| 5 | Pearl Aqua | `#97EAD2` |
| 6 | Wisteria | `#C490D1` |

Known overlap: the third and fourth facet share their colour with urgency and `review`. Facet colour appears only as a bar and a dot, state colours only as text or borders, so the two uses do not collide in place.

### 2.3a Buttons and layers

| Role | Look | Used for |
|---|---|---|
| primary | filled Dark Amethyst, white text | the one main action of a view (Add, Save, Keep, Continue, Done) |
| secondary | filled Wisteria, Charcoal text | all other actions (Import entries, Export, Show account phrase, reschedule choices, facet choices) |
| ghost | Slate text, 0.5 px border `--line` (no text button is without a border; icons, tabs, filter values and menu rows are not buttons in this sense) | Cancel, Back, dismiss, rarely used links |
| danger | 1 px Scarlet Fire outline and text | Clear data, Delete account |

No white buttons on white ground. In dark mode, secondary buttons are outlined in Wisteria instead of filled.

**Two sizes only**, whatever the role:

| Size | Height | Text | Used for |
|---|---|---|---|
| small `--bs` | 32 px | 14 px | everything inside a line or an entry: chips, `+`, note button, *Done* / *Reschedule* in *Past*, *‹ › Today* of the month view, *Reset* in the search and filter lines, buttons in notices, the round `?` |
| normal `--bm` | 44 px | 15 px | everything else: *Add*, dialogs, settings, value buttons, facet panel, sheets (swipe sheet, facet choice, reschedule grid) |

On touch screens small buttons get an invisible margin, so that the touch target still reaches 44 px. Tabs and header icons keep `--tap` (44 px).

The `+` chip for adding a tag is a secondary button too (Wisteria filled), so it reads as a control, not as a tag.

Dialogs, popovers and sheets have a 0.5 px Silver border; behind them the page is covered by a white veil (`rgba(255,255,255,.8)`; dark mode: Charcoal veil), never grey.

### 2.3b Choosing

- **Tag values, one or several** — everywhere, without exception (facet choice on Add, value to rename, facet of a journal overlay, facet for imported calendar entries, facets for *Print agenda* and *Export calendar*, journals in *Rename tag*, *Pass facets*): in the style of the facet list, side by side and wrapping: a colour line (22 × 3 px, the facet's colour, `--line` for topics and journals) and the name, 15 px, no border, a touch target of 44 px. As in the facet panel, two values only: chosen `--fg`, not chosen `--fg` at `opacity: var(--off)`; both regular weight, nothing in between. Counts or the journal small in `--muted` after the name. Keyboard focus underlines the name instead of drawing a box.
- **Several of a set** start as the use suggests: *Print* and *Export* with all chosen, *Pass facets* with none. A value is only faint (opacity `--off`, 0.45) where it is explicitly switched off in a filter: the facet panel.
- **One of a few fixed options** (tag type `facet`/`topic`, date binding): text tabs as for the journals in the text view (4.10), the chosen one in `--fg`, weight 500, with a 2 px underline; others in `--fg2`. No framed segmented field.
- Native selects only inside rows of a list (import preview) and for periods.
- **Marking lines** of a list (manual edit): checkboxes.

### 2.4 Typography

Typefaces, as on outheis.com: **IBM Plex Sans** (variable, weights 100–700) for text; **Inter** (variable, latin, Greek and Greek Extended subsets) for the name and headings; **IBM Plex Mono** (400) for the text view, the account phrase and code. All self-hosted from `clients/web/fonts` (SIL Open Font License); in the single-file client `build.py` embeds the WOFF2 files as `data:` URIs, the guide and the docs site load them from `fonts/`. No external font service. Fallbacks: `system-ui, -apple-system, sans-serif` and `ui-monospace, "SF Mono", Consolas, monospace`.

| Role | Size | Weight | Other |
|---|---|---|---|
| Base | 17 px | 400 | line-height 1.45 |
| App title | 19 px | 600 | letter-spacing −0.01em |
| Item text | 19 px | 500 | line-height 1.3, letter-spacing −0.005em |
| Item time / date ("when") | 16 px | 600 | tabular figures, letter-spacing 0.01em |
| Group heading | 11 px | 600 | uppercase, letter-spacing 1.2 px |
| Tag chip | 13 px | 400 | value 400 in `--fg2`, dimension in `--muted` |
| State markers | 13 px | 400 | `now` 600 |
| Status line | 13 px | 400 | |
| Popover heading | 11 px | 400 | uppercase, letter-spacing 1.2 px |
| Facet choice buttons | 15 px | 400 | |
| Text view | 15 px | 400 | monospace, line-height 1.55 |

### 2.5 Lines, radius, size

| Token | Value |
|---|---|
| Structural line | 0.5 px `--rule` |
| Separator | 0.5 px `--line` |
| Facet bar | 3 px, left edge of item |
| Active tab underline | 2 px `--fg` |
| Radius (buttons, chips, popover) | 6 px |
| Radius (dialog) | 8 px |
| Minimum touch target `--tap` | 44 px |
| Button heights `--bs` / `--bm` | 32 px / 44 px (2.3a) |
| Content max width | 820 px, centred |
| Narrow breakpoint | ≤ 600 px |

### 2.6 Icons

Line icons, 20 × 20 px, `stroke: currentColor`, stroke width 1.5, no fill. No emoji (they render in colour on iOS).

| Icon | Use | Shape |
|---|---|---|
| Sync | header | two curved arrows (circular refresh) |
| Settings | header | gear |
| Microphone | add field | capsule with stand |
| Chevron down | fold button | `M6 9l6 6 6-6`, rotated 180° when open |

Fields: text in every input, text area and select is at least 16 px on phones; iOS Safari zooms the page into a field with a smaller font when it gets the focus, and the page then stays zoomed and shifted.

Text glyphs: `+` (add tag), `−` (remove a tag), `×` (close), `✓` (apply), `⏱` (duration in the time line).

---

### 2.7 App icon and name

- Name everywhere (manifest `name` and `short_name`, page title, home screen title): **οὐθείς Agenda**. iOS shortens the home screen label to about ten characters.
- Icon: a capital A in Inter 600 (OFL), Dark Amethyst, centred horizontally and vertically, cap height about 58 % of the icon; background split horizontally in the golden-section approximation 3:5, upper 37.5 % Pearl Aqua, lower 62.5 % Wisteria (the edge cuts the counter of the A visibly, so the Pearl tip inside reads as intended); square, full bleed (the system rounds the corners).
- Files: `icon-512.png`, `icon-192.png` (manifest, also maskable), `apple-touch-icon.png` (180 px), `favicon-32.png`, `favicon.ico` (16, 32, 48 px, also requested by browsers at `/favicon.ico` without a link); rendered from `clients/web/icon-src/icon.html`.
- `theme-color` Pearl Aqua, matching the header.

### 2.8 Side areas on wide screens

From 1100 px window width the content column is at most 1200 px wide; the areas left and right of it are `#F8F7F7` (between Fog and White, outside the outheis colour system, used only here). The header keeps its full-width Pearl Aqua.

### 2.9 Experimental: compact layout

*Settings → Experimental → Compact layout* (per device, `localStorage agenda.compact`; the class `compact` on `<html>` is set before the page is drawn). It changes measures and surfaces only, never markup or behaviour, so every other section of this document holds for it as well. It can be combined with 2.10.

- **Surfaces:** the function area (add field, search and filter lines) lies on `--panel` (`#F8F7F7`, dark `#222`).
- **Header:** 48 px, title 19 px.
- **Entries:** two columns, the date and time on the left (86 px, 13 px, `--fg2`, overdue in Scarlet Fire), the text on the right (16 px, 400); 9 px vertical padding; 3 px facet stripe. An entry without a time leaves the left column empty, so that the texts stay aligned. Group titles in sentence case, 13 px / 500, `--fg2`.
- **Sizes:** buttons 28 px (`--bs`) and 36 px (`--bm`), text 14 px; on touch screens small buttons keep a 44 px touch target through an invisible margin.
- **Sheets:** top corners 12 px, tighter gaps, section titles in sentence case.

### 2.10 Experimental: minimal colours

*Settings → Experimental → Minimal colours* (per device, `localStorage agenda.minimal`, class `minimal`). Colour is used only where it directs attention to something, not as decoration: facet colours (stripes, dots, bar), overdue dates, *now*, *review*, danger, the sync state. Everything else is black, grey and white.

- **Header:** white with a 0.5 px `--line` bottom border instead of Pearl Aqua (theme colour white); title in the body font. *List* / *Month* / *Text* as small grey buttons, the active one with a 1 px `--fg` border, instead of underlined tabs.
- **Buttons:** a light grey fill (`--btn`, `#EFEEEE`, dark `#2C2C2C`) sets them off from the ground; no Wisteria, no Dark Amethyst, no Teal. The primary action has a 1 px `--fg` border and 500 weight. Danger keeps its Scarlet outline. Icon buttons, the fold chevron and menu rows stay without fill.
- **Tags stay unfilled** (outlined chips, facet choice buttons), so that values are not mistaken for actions.
- The recurring icon sits in a small outlined box; the facet stripe is 2 px.

## 3. Layout

### 2.11 Dialogs

One scale in every dialog: text 15 px; captions above fields 13 px, muted, 16 px above and 6 px below; hints 13 px, muted, 6 px below what they explain; title 17 px semibold. One typeface throughout; a monospaced face only where words are to be copied by hand (phrase, codes). Button rows: 8 px apart, 14 px below the text above. Every dialog has a close button (×) at its top right; it does what the dialog's own *Cancel* does, so that nothing half done remains. The setup has none until an account is set up.

### 3.1 Page structure

```
┌──────────────────────────────────────────┐
│ Header (sticky, Pearl Aqua)               │  one row ≥ 60 px on wide screens
│  οὐθείς Agenda   List Month Text  ⟳  ⚙   │
│  ● in sync 21:47   nothing pending   …    │
├──────────────────────────────────────────┤  0.5 px --rule
│ Add field                                 │
├──────────────────────────────────────────┤  0.5 px --line
│ GROUP HEADING                             │
│ ▌ when                               ⌄    │
│ ▌ Item text                               │
│ ▌ markers                                 │
├──────────────────────────────────────────┤
│ …                                         │
└──────────────────────────────────────────┘
```

- Page background `--bg`; no cards, no grey surfaces. The only coloured surface is the header.
- `main` clips horizontal overflow (swipe offset).
- Bottom padding 80 px so the last item can be scrolled clear of system bars.

### 3.2 Header

- Sticky, background Pearl Aqua (`--aqua`, #97EAD2), bottom border 0.5 px Charcoal. Text in the header stays dark in both colour schemes (Charcoal; inactive tab and status in Slate).
- Header content is limited to the content column (max. 820 px, centred); background and bottom rule span the full window.
- Title: the active view (4.14), 24 px / 600, under "οὐθείς Agenda" in 11 px; without a view "οὐθείς Agenda" in 24 px / 600. Never wraps. A caret after it; a tap opens the views. Up to 0.8 the title led back to the list; the tabs do that.
- Wide screens (> 600 px): one row, at least 60 px high: title, status line (flexible), the views *List* / *Month* / *Text*, 16 px space, then the four icons Search, Filter, Sync, Settings.
- Narrow screens (≤ 600 px): title and the four icons in the first row; below, the status line on the left and *List* / *Month* / *Text* right-aligned. Four icons and two views in one row looked crowded on a phone.
- Tabs **List** / **Month** / **Text**: no border, 2 px underline when active; inactive in Slate. The open search and the filter tab carry the same underline on their icon.
- Search, Sync and Settings: icon buttons, no border, 44 px wide (38 px below 430 px).

### 3.3 Status line

13 px, Slate, wrapping; on wide screens between title and tabs, on narrow screens in the second row, left of the views:

1. Dot (10 px) + server state: Teal = in sync; Amber = changes pending; Stone = offline or unknown. Text: `in sync HH:MM:SS`, `offline`, `unreachable (reason)`.
2. `nothing pending` or `N pending` (outbox plus unsent working-copy changes).
3. `last change <date, time>` — derived from the highest `#rev` known locally (architecture 7.7); no separate sync timestamp.

### 3.4 Narrow screens (≤ 600 px)

Items switch from two columns (time column 110 px + body) to one column: time line above the text.

---

## 4. Components

### 4.1 Add field

- Row with padding 14 px 16 px, bottom separator 0.5 px `--line`.
- Input: no box, only a 0.5 px underline (`--line`, `--fg` on focus); placeholder "New item — talk or type".
- A clear button × at the right end of the field, as in the search field, while the line holds something.
- Microphone button (only if the browser provides speech recognition; language `de-DE`); while recording, icon in Scarlet Fire. A tap starts dictating, the next tap ends it; text already in the field is kept in front, what is recognised appears while speaking. The app listens in short sessions (`continuous` off) and starts a new one after each pause, each a new recognition object, because Safari on iOS answers a second continuous session with silence (0.8.4). Stopping that does not end within a second is aborted; after another second the button is reset regardless and late results are dropped. Going to the background stops. Errors other than silence appear as a notice and in the log. The keyboard's own dictation works regardless.
- No calendar button here: date and time are chosen in the facet choice (4.2). Without a choice the item gets today.
- **Add**: primary button, Dark Amethyst background, white text.

### 4.1a Wide screens (≥ 1100 px): one row per item

Each item is one row: a fixed column (190 px) with date and time, then the text, then all tags as chips on the right, always visible (no chevron, no folding). There is no fixed column for the tags: the text starts on the left and takes the width it needs, up to 55 % of the row, beyond which it wraps; the chips are right-aligned in the rest of the row (after a gap of 24 px) and wrap only where that is too short, so a short text keeps its tags on one line. `#cal` gets no chip in the list (a hash says nothing to the reader); it stays in the Text tab. The date is shown for every item here, also in *Today* and *Tomorrow* (in Slate when it only repeats the group); overdue dates in Scarlet Fire. Groups stay one below the other. Narrower screens keep the stacked layout: when above the text, tags folded.

### 4.2 Facet choice (on Add)

Opens when the new line has no `#facet`.

- Bottom sheet over a scrim `rgba(26,26,26,.3)`; panel `--bg`, top border 0.5 px `--rule`, max width 540 px, bottom padding includes `env(safe-area-inset-bottom)`.
- Title: the entered text, 17 px / 500; on the right of the title row, above its 0.5 px `--line` separator, a calendar button and the clock button *from*, after a start time also *to* (system pickers, 4.3a). A chosen date and time appear below the separator ("Fri 27.11. · 09:30–10:15 ×") and are added as `#date-…` and `#time-…` to the new item, unless its line has them already; × removes the choice.
- Facets in the style of the facet list (2.3b): one per facet, side by side and wrapping, a colour line and the name in `--fg`; a name that occurs in several journals appears once per journal, with the journal's name small after it (`Familie`); with more than one journal every facet carries that label (4.11d). A tap chooses it.
- Order: first the facets of the default journal, then those of the other journals the user owns, then those of shared journals the user may write; within each group the order of the facet values. A name in several journals therefore appears in several places; the hierarchy of one's own journals takes precedence (decided 19 November 2026, to be reverted if it proves wrong).
- Below the grid, a full-width field for a new facet with a primary *Add* button. The field shows the fixed prefix `#facet-` in `--muted`, so the complete stored tag is visible while only the value is typed; the value is lowercased; letters, digits and underscore only, otherwise a hint below the field.
- The same prefixed field heads the value menu of every dimension with free values in the tag popover, above the suggestions, so every value the grammar allows can be entered and a new value is reachable without scrolling: `#facet-`, `#topic-` (words may be joined by hyphens), `#date-` (`YYYY-MM-DD`, with a calendar button, 4.3a), `#time-` (`08:00`, `09:00-15:00`, `45m`, `1h30m`; buttons *from* and *to* with the system time picker fill a time or a span), `#recurring-` (all patterns of architecture 4.4). An invalid value turns the field Scarlet and shows the allowed forms below it. Dimensions with a fixed vocabulary (`rank`, `size`, `action`) keep their plain list.
- The popover is `min(340px, 92vw)` wide and opens below the tag, or above it when there is not enough room below; where neither side has room it is shifted into the window. It is placed again when its content changes (the second step of `+`, 4.8), so that it never reaches beyond the window: a field focused there would make the browser scroll, and Safari closes its date picker on that scroll. On screens up to 700 px it is a sheet at the bottom of the screen instead (full width, at most 70 % of the height, scrolling inside), so that it is never outside the visible area; its field is not focused automatically there. While the on-screen keyboard is open, the sheet (and the facet choice) is fitted into the part of the screen still visible, from its top, and the field being typed in is scrolled into view.

### 4.3a Date and time pickers

Adding asks nothing about the kind: whether an entry is fixed or flexible follows from it (architecture 5.5) and can be changed later with `anchor` in the tag menu. The only choice is the **bookmark** after the date and time pickers: tapped, it is filled, the pickers turn faint and the line shows *memo*; the entry is saved with `#type-memo` and without date, time or repetition (architecture 5.6). Tapped again, or a date chosen, it is undone.

The calendar and clock buttons are the system's own `date` and `time` fields, laid with opacity 0 over the icon. A tap therefore opens the system picker directly; opening a hidden field from script (`showPicker`) is unreliable on iOS. The picker starts at the field's current value, otherwise today (date), 09:00 (*from*) or the start time (*to*). A value counts when the picker is closed with it, also if it was left unchanged (iOS reports no change then). Each field is clipped to its icon: iOS gives a date field a minimum width of its own, and an unclipped field reached over the ✓ beside it. There is no end without a start: the button *to* appears only once a start time is chosen (in the field or with *from*).
- Below, two ghost buttons: *Without facet* (adds the line; it will get `#review-needed`), *Cancel* (back to the field, text kept).
- Tapping the scrim = Cancel.

### 4.3 Group heading

- Padding 22 px 16 px 8 px; 11 px, weight 600, uppercase, letter-spacing 1.2 px, `--muted`.
- Groups: **Today**, **Tomorrow**, **Next 7 days**, **Later**, and on request **Up to 3 months** (5.4). Empty groups are not shown.
- Below a group with more items than its limit: a full-width row *+N more* (15 px, `--fg2`, 44 px high, bottom separator); after expanding, *Show fewer*.

### 4.4 Item — collapsed (default)

```
▌ 08:00                                   ⌄
▌ Breakfast with the neighbours ↻ ▤
▌ waiting  high  review
```

- Padding 14 px 16 px 14 px 10 px; bottom separator 0.5 px `--line`; left border 6 px in the facet colour (transparent without facet).
- Group headings, *more* / *Show fewer* and the empty-list hint carry a 6 px left stripe in Mist `#E8E6E6` (outheis grey for tertiary surfaces; dark scheme `#2E2E2E`), so the facet stripes do not end against white.
- **When line** (16 px / 600 / `--fg`; overdue in Scarlet Fire):
  - groups *Today* and *Tomorrow*: time only (or nothing); overdue items in *Today* show their date;
  - other groups: weekday and date (locale short form, e.g. `Mo. 16.11.`) plus time;
  - time formats: `09:00–15:00` for a span, `08:00` for a start, `⏱ 1h` for a duration.
- **Text** (19 px / 500 / `--fg`), followed by small icons (16 px line icons, `--fg2`): first a circular arrow if the entry recurs (tooltip: the pattern), then the note icon if it has a note (4.9a). They stand in the text line so that they add no height; the verbal state markers stay below.
- **State markers** (13 px, `--muted`, gap 10 px), only if present:
  - value of `action` (`required`, `waiting`, `idle`); `now` in Scarlet Fire, weight 600;
  - `high` if `rank:high`;
  - `review` in Amber Flame;
  - `not synced` in Amber Flame if the line differs from the last fetched journal.
- **Fold button**: chevron, top right (8 px from top, 4 px from right), 44 px wide, `--muted`. Text, time line and markers keep 40 px right padding so they never run under it.

### 4.5 Item — expanded

Same as collapsed, without the marker line, plus the tag chips:

- Chip row starts at **one third of the item width** (`margin-left: 33.333%`), gap 4 px, wraps.
- Chips in canonical tag order (architecture 3.2: `facet date time recurring rank size action topic done review`); `#id` and `#rev` are never shown.
- The `+` chip comes last; it is omitted when all addable dimensions are present. After it a `−` chip of the same kind (Wisteria filled, `--bs`) opens *Remove tag*: one option per tag of the entry, in danger style, a tap removes it. Not offered: the only facet of the entry (every entry keeps one), `#cal`, and a facet the user gave a whole journal (removed in the journal's dialog); tags of the user's own overlay are marked *(only you)* and removed from the overlay. The `−` is omitted when nothing is left to remove. Tapping a chip and *Remove tag* there stays as before.
- In expanded state the `not synced` label appears after the chips.
- Expanded state is kept per item (by `#id`) while the page is open; not persisted.

### 4.6 Tag chip

- Height 34 px, padding 0 7 px, radius 6 px, border 0.5 px `--line`, transparent, no wrap.
- Label `dimension:value`: dimension in `--muted`, value in `--fg2`, both 13 px / 400.
- Facet chip: 8 px dot in the facet colour before the label.
- `action:now`: border and value in Scarlet Fire.
- `review:needed`: border in Amber Flame.
- `+` chip: square, 32 px (`--bs`), 16 px glyph.

### 4.7 Value popover

Opens below the tapped chip (clamped to the viewport).

- `--bg`, border 0.5 px `--rule`, radius 6 px, shadow `0 8px 28px rgba(0,0,0,.12)`, min width 240 px, max height 62 vh, scrolls.
- **Head**: dimension name (11 px uppercase `--muted`) and a `×` close button (44 px) on the right; separator below.
- **Options**: full-width rows, 44 px high, padding 0 16 px; hover `--hover`; current value weight 600 with a 2 px inset bar in `--fg` on the left.
- **Input row** (date picker, time field): input with underline only; `✓` apply (Teal) and `×` close (`--fg2`), each 44 px. Invalid input: underline and text in Scarlet Fire; nothing is applied.
- *Remove tag* last, separated, in Scarlet Fire.
- Tapping outside closes without change.

Values per dimension:

| Dimension | Options |
|---|---|
| `facet` | facets in use (architecture 3.4), or the defaults `work`, `family`, `self` if there are none; plus an input row for a new value |
| `date` | Today, Tomorrow, Next week (Monday), Next month (1st) — each with its date — plus date picker |
| `time` | free input (`08:00`, `09:00-10:30`, `45m`, `1h30m`), plus durations 15m, 30m, 45m, 1h, 2h |
| `recurring` | daily, weekly, biweekly, monthly, yearly, mon … sun, mon-tue-wed-thu-fri |
| `rank` | high, medium, low |
| `size` | s, m, l |
| `action` | required, now, waiting, idle |
| `topic` | topics in use, plus an input row for a new value |
| `review` | only *Remove tag* |

### 4.8 Add-tag popover (`+`)

Same container; head "Add tag". Lists only dimensions the item does not have yet (never a second tag of one kind). The one exception is `date`: an item with one date is offered *end date*, which adds the second date of a multi-day span (architecture 4.2); the earlier day is always stored first. Choosing a dimension replaces the list with its value options (head shows the dimension); one more tap applies.

### 4.9 Done / reschedule sheet (swipe)

- Same sheet style as the facet choice.
- Heading: item text, 11 px uppercase `--muted`.
- *Done / remove*: full width, 44 px, primary (Dark Amethyst). For a recurring item instead three buttons side by side: *Done* (primary) and *Skip* (secondary), both for the occurrence shown (today's until its time span has ended, then the next one with its date), and *Delete series* (outlined in Scarlet Fire: the rare and lasting step).
- "Reschedule" label, then six buttons in a 3 × 2 grid (44 px), one column per unit: *Next day* / *2 days*, *1 week* / *2 weeks*, *1 month* / *3 months*, and *Other date …* (full width; opens the date picker; the date counts on change or when the picker is closed with a value). While the sheet is open the page does not scroll, as Safari closes its date picker when the page scrolls the field into view. The steps are counted from today (months: same day, or the last day of a shorter month); all dates of the item are shifted by the same number of days. No fixed anchors such as Monday or the 1st, so rescheduled items do not pile up on one day. For a recurring item only its next occurrence moves (architecture 4.4b), and the steps count from that occurrence's date (Wednesday's session + 2 days = Friday); the bar confirms "Rescheduled <date> to <date>" or "Skipped <date>".
- *Cancel*, full width. Tapping the scrim = Cancel.

### 4.9b Recurring entries with two dates

The date column shows the reading of architecture 4.4a: for one occurrence over several days its range ("Fri 20.11.–Sun 22.11."), for a bounded series the next occurrence with its time and "until 31.3." (`--fg2`, regular). A doubtful case adds "check dates" in Amber, with the reason as tooltip. In the `+` menu of a recurring entry the second date is labelled "second date (end of series or of each occurrence)"; after it, or the repetition, has been added, a notice states how the entry is read.

### 4.9a Note of an entry

Next to the `+` of an entry's tags, a second button of the same size with a note icon, outlined in Teal (1 px border and icon in `--teal`, no fill; the `+` stays filled Wisteria), opens the *Note* dialog directly (`+` and the note button stay together when the chips wrap): the entry's text in `--muted`, a text field (at least nine lines, 0.5 px border `--line`, line breaks allowed, at most 500 characters with a counter "n / 500"), a clear button × at its top right as in the search field, below it a microphone that dictates into the note at the cursor (as in the add field, 4.1), and a hint. There is no *Save*: closing the dialog (its ×, Escape) keeps the text, a field without visible characters removes the note, and nothing is written if the text is unchanged; *Undo* takes a change back (decided 19 November 2026). An entry with a note also shows a small document icon (16 px, `--fg2`) right after its text, which opens the same dialog; the note itself never appears in the list. The `+` menu stays for tags only. It offers each kind the entry may still take: an end date after one date, *another facet* and *another topic* up to three each, and *reference to an entry* (a search over the open entries of all journals). Facets and topics added to an entry of another journal are kept as the user's overlay (architecture 8.11c) and shown with a dashed border; a facet the user gave to a whole journal (in the journal's dialog) appears the same way on each of its entries, and tapping it opens that dialog; a reference chip shows the start of the referred entry's text and offers *Go to the original* (scrolls to it and outlines it in Teal for a moment, or names it if it is not in the view), *Change reference* and *Remove tag*.

### 4.10 Text view

- Padding 16 px; hint line (14 px `--muted`) explaining the working copy.
- Plain `textarea`, read-only, no border, monospace 15 px, no wrapping (horizontal scroll), at least 70 vh. Above it *Import entries* and *Manual edit*.

### 4.10a Manual edit

*Manual edit* makes the text field editable; nothing is written to the journal until *Save*. In place of the journal tabs a title row "Manual edit · <journal>" keeps the layout from jumping; the field is shown from its first line, so that the boxes stay level with the lines.

- The text stays one text field, as in an editor: one entry per line, no wrapping, line height 28 px; everything can be selected and copied as usual. Left of it a gutter with one box per line, aligned with the line; a small mark next to the box shows a changed (Amber), new (Teal) or unreadable (Scarlet) line.
- Ticking boxes and pressing *Delete* (or *Backspace*, or the button *Delete selected*) empties those lines; they stay in place as empty lines, so nothing below moves. The user may remove the empty lines like in any text file; *Save* drops empty lines anyway. Ticks follow their lines while the text is edited: lines inserted or removed above a ticked line move its tick accordingly.
- A bar fixed at the bottom of the screen: the number of unsaved changes; *Delete selected*, *Review*, *Dismiss* (secondary), *Save* (primary). The header status shows "text edit not saved" meanwhile.
- Lines are matched to the original by their `#id` (lines without id by identical text). **Review** shows a summary in the manner of a commit message: "Deleted: line 1 (…), line 3 (…) · Changed: line 2, date 2026-11-14 → 2026-12-01 · Added: line 15 (…)".
- **Save** checks every line strictly: a line without text, an unknown tag, an invalid value (e.g. `#date-2026-13-01`), a tag given more often than allowed, or a missing facet (except definitions, names, aliases, rules and comments) blocks saving; the bar lists the lines with their reasons and the gutter marks them. There is no silent correction with `#review-needed` here.
- On saving, removed lines are gone from the view; in the journal their entries are closed (`#done-<today>`), because other devices must learn of the deletion and would otherwise restore the line; compaction removes them after the retention period. Changed lines become new revisions, new lines new entries; lines that arrived by synchronisation during the edit are kept. The summary stays as a notice, and the field returns to read-only.
- *Dismiss* discards all changes. Leaving the text view also ends the edit without saving.

### 4.11 Settings

A view like the filter tab, opened with the gear in the header (which then carries the 2 px underline); *List*, the title or the gear again lead back. Sub-dialogs (journal, rename, export, import, print, QR code, examples) open on top of it. At the top the mode line (`--muted`): *Server account* or *Local journal file*, with whether the file is written back; the row *Example tags and entries* while it applies (4.11i). Below it four tabs in the style of *List / Month / Text* (17 px, the open one dark with a 2 px underline; decided 20 November 2026, because one long page no longer showed where a topic ended); the last one open is kept in this browser (`agenda.stab`, plain). Within a tab, headings as in the filter tab (11 px, upper case, `--muted`) mark its parts:

- **Data:** *Journals* (server mode only: the journal list 4.11d, *+ Add journal*, *Rename tag*, a hint that facets belong to journals); *Import and export*: *Import entries* (4.11b), *Export journal file* (a small panel: the journal is downloaded encrypted as `agenda-journal.enc`, a checkbox *Export unencrypted as plain text* for `agenda-journal.txt`, *Cancel* / *Download*; built from the local copy, so it works without the server), *Export calendar* (4.11g); *Local journal and print*: *Open local journal*, *Print agenda* (4.13).
- **Account:** *Account ID* (monospace, 64 hex digits) with *Copy account ID*; *Server URL*, underline-only input, applied when the field is left (disabled in local mode); *Show account phrase* and *Show QR code* (4.11h); a sentence on what deleting removes, and *Delete account on server* (Scarlet Fire, two-tap: the first tap arms and states the consequence, the second removes the account file on the server and then clears the browser).
- **Device:** *PIN* with its three levels (4.12a) and *Change PIN*; *Clear data in this browser* (Scarlet Fire, two-tap; removes phrase, keys, local copy, settings and outbox and reloads; the journal on the server is not touched); *Display*: *Compact layout* and *Minimal colours*.
- **System:** *Log* (4.18). The section *Experimental* is empty since 0.9.0 and not shown. Version and links stand in the footer as on every view.

### 4.11a Setup dialog

Shown on first use and after clearing; cannot be dismissed until set up (architecture 8.6, 8.7).

1. **Start:** Server URL (prefilled with the page origin), the hint *If you are new here, creating your own journal is the best way to start* (someone who only wants to look into another person's journal would otherwise make it their own and write into it, or, if it is read-only, find that nothing can be added without knowing why), and the buttons *New account* (primary), *I have an account phrase*, *Open a local journal file*, and *Get account ID from a phrase* (computes the Account ID in the browser without setting anything up or contacting the server).
1b. **More:** *Open a local journal file* and *Get account ID from a phrase*, folded under *More*; both take the eight words or a code of version 2 as well.
1a. **Take over a journal:** a field for the handover code (architecture 8.11i); the journal becomes the default journal, and its new words are shown with *Done*.
2. **New account:** the eight words, numbered, in a monospace box; below, a field asking for two randomly chosen words of the phrase. *Continue* only succeeds if both match. A field *Name of the journal* (placeholder `Alice` in light grey; default "Journal" when left empty; at most 40 characters, `#` and line breaks removed) gives the name written as `Journal name:` entry.
3. **Account phrase:** a text field for the eight words; unknown words and wrong word counts are named. *Continue* first looks the journal up on the server, as one of version 2 and then as one of version 1 (the eight words of an upgraded journal open the new one). If it has content, the dialog says so and names it (*This code opens the journal “Anna”. If it isn't yours, please create your own first. You can integrate “Anna” easily into your journal afterwards.*): whoever got the phrase of another person's journal would otherwise make it their own and write into it. Two choices follow: *Create my own journal first* leads to *New account*; once the new journal is set up, the dialog asks *Add “Anna” to your journals?* — *Add* adds it as a joined journal without the phrase being entered again, *No, forget it* drops the phrase, and nothing of it remains in the browser or in the new journal. Looking the journal up uses the anonymous member ID (architecture 8.4a), so that it leaves no trace among the members of the other journal. *It is mine, continue* sets the journal up as before, for example on a second device. An empty journal, or a server that cannot be reached, is set up without the question.
4. **Local file:** the phrase, then the file picker. A file that cannot be decrypted with the phrase is rejected with a notice.

Deriving the keys takes about a second; the dialog says so while it runs.

### 4.11b Import dialog

*Import entries* (text view and settings) opens a dialog with two sources: a text field to paste into (the convenient way on phones) and *Choose text file*. *Read* or choosing a file leads to the preview; *Back* returns to the text field with the text kept, so it can be corrected. The text is read, one entry per line, the way a line typed by hand is read (architecture 7.2): empty lines and lines without text are skipped, missing dates are completed, invalid tags are moved into the text with `#review-needed`, and lines already present (or repeated in the file) are skipped.

Before anything is changed, a dialog shows what was understood: a summary (new items, already present, not taken over), the new items as they will be stored, and, folded, the lines that are not imported. It offers *Back*, *Discard* and *Keep* (primary); only *Keep* adds the items to the working copy. When there is nothing to take over, it offers only *Back* and *Close*, and the folded list of what was not imported is opened; the summary gives the reasons with their counts ("not imported: 14 already present"). No question without an answer to choose.


- Calendar files: *Facet for all calendar entries* as value buttons (2.3b), below them a prefixed field `#facet-` with *Add* for a new facet; it is defined at once (with the journal choice of 4.11f when there are several journals) and chosen for all rows not set individually. Each row keeps its own select.
### 4.11c Starter entries in a new account

After *New account*, if the journal is still empty, it receives:

- its name: `Journal name: <name> #type-meta`;
- Tag definitions for the facets `private` and `work` and for the topics `sports`, `official` and `travel` (topics without facet), each with a short description and `#type-meta`, so that these values stay in the vocabulary;
- four example items, each text beginning with `Example:`: one today with a clock time, one tomorrow, one recurring, one with a topic and `action:required`. They are ordinary entries and are removed with *Done*.

Setting up with an existing phrase or opening a file adds nothing. A journal without any facet offers none in the facet choice; the first one is typed.

### 4.11i Example tags and entries

While the default journal still holds starter lines of 4.11c unchanged and open (a starter Tag definition with its original description, or an entry beginning with `Example:`) and no line `Journal examples: …` exists, the settings show at the top a row *Example tags and entries* with a left bar in amber and two buttons: *Delete* (amber) and *Keep*. Either choice removes the row for good, on all devices.

- **Keep** writes `Journal examples: kept #type-meta`; nothing else changes.
- **Delete** closes (`#done`) the `Example:` entries and the starter Tag definitions; compaction removes them after the retention period. If none of the user's own open entries (default journal, own journals, own overlays) carries a starter value, this happens at once, with *Undo* in the bar.
- Otherwise a dialog *Your entries with example tags* lists these entries, grouped by value. Each row has a choice: *Keep <value>*, *Move to <value>* for every other facet or topic, and *Delete entry* (facet) or *Remove the topic* (topic). The row of a value (*Set all …*) sets all its entries at once. Fields *New facet* and *New topic* (the latter only if topics are concerned) add a value to the *Move to* choices; it gets a Tag definition when an entry is moved to it. A moved value takes the old one's place, so that a moved first facet still owns the entry. *Apply* carries out the choices; a starter definition stays open as long as an open line still carries its value, and then `Journal examples: deleted #type-meta` records the choice.

### 4.11f New values and their definitions

A value typed into a field for a new facet or topic (facet choice, tag popover) that does not exist yet is kept by a Tag definition entry written with it: `Tag definition: <value> #facet-<value> #type-meta` or `Tag definition: <value> #type-meta #topic-<value>`; the description can be completed in the text view. With one journal it is written without asking. With several journals a choice appears below the field:

- **Facet:** "Facet *x* belongs to:" with one button per journal. The definition is written to the chosen journal, and the entry goes there (architecture 8.11).
- **Topic:** "Keep topic *x* in:" with a checkbox per journal (the entry's journal preselected) and *OK*. Topics reserve nothing; the same definition in several journals is not a conflict. Without a checked journal no definition is written. The entry stays where it is.

Values that arrive in typed lines, the text view or an import get no definition.

**Help.**

A round `?` button (32 px, 0.5 px border) next to every field for a new facet or topic (facet choice, tag popover) opens a short dialog: a new value exists once an entry with it is saved; it disappears after the retention period once no open entry carries it; a *Tag definition* line keeps it; how to remove it (rename or close its entries, delete the definition line); facets of shared journals belong to that journal. It links to the guide.

### 4.12b Journal dialog: facets and default journal

Under *Content*, journals the user may write offer *Add a facet to this journal*: a field with the prefix `#facet-`, *Add*, and a hint. It writes a Tag definition into this journal; an existing name or an invalid one is answered in the hint. Below it, *Remove a facet from this journal*: the journal's facets (declared ones and those of open entries) in the style of the facet list. Choosing one that open entries still carry names their number and asks which facet they get instead, again as a facet choice of the journal's other facets; without another facet the hint says to add one first. *Remove* (two taps) gives those entries the chosen facet (an entry that already has it just loses the old one), then closes the facet's Tag definition lines. Closed entries keep their old facet; no entry is closed. *Undo* takes it back. Journals of version 2 that the user owns (not the default) offer *Make this my default journal* (two taps, architecture 8.11j). In the dialog of a version 2 journal that replaced one of version 1, the former journal can be removed from one's own journals (*Remove it from my journals*) or deleted on the server.

### 4.16 Clipboard

A tray symbol left of the magnifier, for accounts the user owns (not in local mode): `--fg2` when empty like the other icons, `--blue` when it holds something. Blue was added for this because the signal colours are taken (Scarlet: urgency) or too weak on Pearl Aqua as a thin line (Amber 1.3 : 1, Scarlet 2.7 : 1; Blue 5.6 : 1). The item stays 24 hours (architecture 8.15); the hint in the dialog says so. A click opens the dialog *Clipboard*; when it holds a text or a picture, the click also copies it into the system clipboard (a picture as PNG). Dropping a file or a text on the symbol or the open dialog puts it there; while the dialog is open, Ctrl/Cmd+V does the same. Dragging the filled symbol into a folder saves a copy (Chrome and Edge). The dialog shows a preview (picture, the start of a text, or name and size), a hint, and *Paste* (from the system clipboard, where the browser allows it), *Choose file or photo*, *Copy*, *Save / share* (the system's share sheet, where it takes files: on an iPhone *Save Image* puts a photo into Photos), *Download* and *Clear* (two taps). Too large an item is refused with its size before anything is sent.

### 4.12a PIN

The PIN dialog (`#dlgPin`, without the close button of other dialogs) has four uses: *Enter your PIN* at the start (*Unlock*, *Forgot PIN*), *Enter your PIN* before words or codes are shown (*OK*, *Cancel*), *Choose a PIN* once an account exists (*Set PIN*, *Use without PIN*, which warns first and asks for a second tap) and *Choose a new PIN* (*Set PIN*, *Cancel*). The field is a numeric password field, six to twelve digits. With a keyboard the first field has focus when the dialog opens, and Enter confirms (when a PIN is chosen, Enter in the first field moves to the repetition). On touch devices (`pointer: coarse`) the dialog brings its own keypad, 3 × 4 keys of at least 56 px: digits, ⌫ and ✓ (Amethyst); the fields are read-only so that the system keyboard stays closed, since iOS does not open it for a field the page focuses itself. ✓ replaces *Unlock*, *OK* and *Set PIN*, which are hidden there; when a PIN is chosen, ✓ in the first field moves to the repetition, the active field is underlined in Teal, and a tap on a field makes it the active one. *Settings → Account → PIN* offers three levels as a choice in the style of the toggles (`#pinLevel`): *No PIN*, *Once per session* (the default) and *Every time*, with a plain statement of the chosen one below and *Change PIN* while a PIN is set. A weaker level, and *No PIN*, asks for the PIN first (unless it was entered in the last five minutes); *No PIN* → a PIN level opens *Choose a PIN*. All buttons, the keypad's included, have `touch-action: manipulation`, so that quick taps do not zoom on iOS; pinch zoom stays.

### 4.13 Print

*Print* (settings) first asks what to print, *Events and tasks* or *Memos* (one of the two, in the style of the facet list; the choice is remembered), and for the facets to include (checkboxes, all selected the first time; the selection is remembered in browser storage). It then prints one A4 page, portrait, through the browser's print dialog (*Save as PDF* there gives the PDF). The page is a working sheet to tick by hand, photograph and hand back:

- Typeface Inter 400/600, embedded; 9.5 pt throughout, title 12 pt; margins 8–10 mm; full width.
- Head: "οὐθείς Agenda" (for memos "οὐθείς Agenda · Memos"), the selected facets.
- Memos: the open memos of the selected facets, grouped by facet (the facet in the date column on the first row of a group), then by text; the foot counts the memos that did not fit.
- One row per item, sorted by date (overdue as today), within a day in agenda order: a light grey box to tick (Silver outline), the date (only on the first row of a day), time, text, facet value (without `#facet-`, not abbreviated, bold, since colours are lost in black-and-white print), a reference number, and a notes column on the right.
- Reference number: the last four digits of the item's `#id`, more where two items on the page would share them; `new` for items not yet synced. It identifies ticked items unambiguously on a photo of the sheet.
- No other tags.
- Only what fits on one page; the footer says how many items of the next 7 days and of the next 30 days did not fit: "…another 14 items over the next week and 112 over the next 30 days.", and the time of printing.

### 4.12 Notices

Left border 3 px Amber Flame, padding 8 px 12 px, 15 px; *dismiss* button. Used for quarantined lines, superseded local edits, lines that cannot be decrypted, and lines added through `#add=`.

---

## 5. Interaction


- Computed notice: a value defined more than once in a journal with different descriptions ("#facet-music is defined 2 times in Anna. Keep:"), with one ghost button per description; the others are closed (or lose only this tag, if they define further values).
### 5.1 Tap targets

| Target | Action |
|---|---|
| Item text | edit in place: input with 1 px `--fg` underline; Enter or leaving saves, Escape cancels. Enter and Escape are consumed so they cannot trigger other buttons. Trailing `#tokens` typed into the text are dropped. |
| Chevron | expand / collapse |
| Tag chip | value popover |
| `+` chip | add-tag popover |
| Sync icon | sync now |
| Settings icon | settings view |

### 5.2 Swipe right

- Starts anywhere on an item except chips, inputs and the chevron.
- Direction is decided after 8 px of movement: mostly vertical → the gesture is left to scrolling; leftward → ignored; rightward → the item follows the finger (`translateX`, no transition while dragging).
- A hint "→ done / reschedule" in Scarlet Fire appears to the left of the item while dragging.
- Release beyond **30 % of the item width or 100 px** (whichever is smaller) opens the done/reschedule sheet; otherwise the item springs back (0.15 s).
- Every end of a gesture (release, system cancel) resets the item; no item may remain offset.
- Items set `touch-action: pan-y`, and disable text selection and the iOS callout.
- Rescheduling shifts all `#date` tags of the item by the same number of days (multi-day spans keep their length).

### 5.3 Editing and sync

- Every change (tag, text, done, reschedule, add) edits the working copy; lines are rewritten in canonical tag order immediately.
- Sync runs 1.5 s after the last change, every 60 s, on regaining connectivity, and on demand.
- While a popover, sheet or text edit is open (`busy`), the list is not re-rendered and background sync is postponed.

### 5.4 Groups, limits and ordering

**Groups.** Every open item appears exactly once, in the group of the date on which it is shown:

| Group | Shown date | Limit |
|---|---|---|
| Past | fixed items whose date has passed, until *Done* or *Reschedule* (architecture 5.5); text and date in Slate, two secondary buttons *Done* and *Reschedule* in the row | 3 (also items with a clock time) |
| Today | today, and flexible items carried from earlier days (date in Scarlet Fire, marker *now*) | 5 |
| Tomorrow | tomorrow | 5 |
| Next 7 days | day 2 to day 7 | 10 |
| Later | day 8 to day 30 | 10 |
| Up to 3 months | day 31 to day 90, only after *Show up to 3 months (N)* | none |

- The shown date is the first `#date`; for recurring items the next occurrence on or after today; for multi-day items in progress (first date past, second date today or later) today.
- Items after day 90 never appear in a view. This includes meta lines (`#type-meta`) and memos (architecture 3.4, 5.6). They remain in the journal and in the text view.
- **Limits.** Items with a clock time (`#time` with start or span) do not count against the limit and are always shown. Of the other items, only the first *limit* are shown; the rest are behind *+N more* and can be expanded per group. Items never move to another group because a group is full.

**Ordering within a group.** Groups over several days (*Next 7 days*, *Later*, *Up to 3 months*, *Past*) run by date, as the printout does; items carried into *Today* count as today. Within a day, without a weighting model, the static client uses a fallback:

1. recurring items without a clock time (fixed points);
2. items with a clock time, by date and start time;
3. all others by `action:now` first, then rank (`high`; missing or `medium`; `low`), then date, then `#id`.

A missing rank means *not assessed* and counts as `medium`; `rank:low` therefore lowers an item, it does not raise it above unranked items. The weighting of relevance across facets, times of day and persons is to be done by a language model following rules in the human directory (architecture 8.9, open issue 7); its result would replace the fallback.

### 5.5 Feedback states

| State | Indication |
|---|---|
| Changes not yet confirmed by the server | Amber dot in status line; `N pending`; `not synced` on the item |
| In sync | Teal dot; `in sync HH:MM:SS` |
| Offline / unreachable | Stone dot; `offline` or `unreachable (reason)` |
| Needs review | `review` marker / chip in Amber Flame |
| Urgent | `now` in Scarlet Fire |
| Overdue | date line in Scarlet Fire |

---

## 6. Accessibility

- Contrast: text colours on white meet WCAG AA for body text (`--fg`, `--fg2`); `--muted` is used only for secondary labels.
- Touch targets ≥ 44 px throughout.
- Buttons carry `title`; the fold button carries `aria-expanded`.
- Colour is never the only carrier of meaning: urgency, review and sync state also have text labels; facets also appear as named chips.
- Dark mode follows the system setting.

---

## 7. Known Gaps

- Done on a recurring item ends the series; there is no way yet to close a single occurrence (architecture, open issues).
- Multi-day items currently use two `#date` tags, which contradicts the one-tag-per-dimension rule of the interface.
- Views beyond the date groups (follow-up of `waiting`, weekly review, search) are not yet specified.
- The ordering is a fallback; weighting of relevance by a language model is not implemented.

### 4.14 Views and filter

A filter **hides values**. Within one kind of tag an item matches if its value is shown; across kinds it must match every kind. The empty value stands for "without this tag" and can be hidden like any other. The current filter is stored in the browser (`agenda.filter`). Since 0.9.0 the facet bar in the list and the filter tab are replaced by views and a facet panel (decisions 6.7).

- **Views.** A view is a named filter: the facets switched on and the other tags hidden. Views are lines of the default journal, so they apply on all devices of the account (architecture 3.4): `View: Workshop | on workshop@ admin@ | hide rank:low #type-meta`. A facet is written as `name@<journal id>` (empty for the default journal), `-` stands for *without facet*, `*` for all facets. A view with a list keeps facets that appear later switched off; `*` includes them. Which view is active is kept per device (`agenda.view`). Views do not store the tab (*List*, *Month*) or the search.
- **Title.** The header shows the active view under a small "οὐθείς Agenda" (11 px); without a view only the name of the app. A caret follows. A tap opens a menu below the title: the views with their facet colours (at most ten 5×13 px bars), the active one with ✓; *+ Save current as view …* (an inline field for the name); *Edit views …* (opens the panel in edit mode). Choosing a view applies it and shows the list, also from *Text* or *Settings*.
- **Changed view.** When the filter differs from the active view, the title gets a dot (`Workshop •`) and the line below the add field names the difference (`Workshop changed: + work, − admin`, *other filters* for the other tags) with *Save* (writes the view anew) and *Revert*.
- **Facet panel.** Opened with the funnel in the header. On screens narrower than 1240 px a drawer from the left (at most 320 px or 86 % of the width) over a dimmed list; the list behind it updates at once. From 1240 px a column of 280 px beside the list, always visible; the funnel is then hidden. Content from top to bottom:
  - *Views* with *Edit* (rename in place, *Delete* with Undo) and *+ Save current as view …*.
  - *Facets*: *All*, *None*; then the facets grouped under their journal, in the order of the journals (default journal first), within a journal by name, so that each facet keeps its place. A journal read as a guest carries a lock icon (13 px, Slate) instead of a written label. Each facet: a 22×3 px line in its colour, the name, the number of matching items (`--muted`, 12 px). Facets with the same name in several journals each stand under their journal. *Without facet* comes last.
  - *More: topic, action, rank, size, time, repeats*, folded (open when one of them filters): the other kinds, each value with its count among the items passing the facets.
- **Interaction.** Tap a facet: on or off. Long press: only this facet; a toast says so with *Undo*, since a long press may also happen by accident. Tap a journal's heading: all its facets on (when all are off) or off; long press: only this journal. The other tags: tap hides or shows a value, long press shows only this value. Switched off is 20 % opacity; there is nothing in between.
- **Filter line.** Without an active view, a line below the add field says what is hidden (`Filter: 3 of 14 facets · not low`) with *Show all*. With an unchanged view there is no line; the title says which filter applies.
- An item added while the filter would hide it is written as usual; a notice says that it is hidden.
- Counts and filters cover open items up to three months ahead; entries dated beyond (tag definitions) never appear.
- The facet selection preselects the facets of the printout (4.13).

### 4.14b Retired: facet bar ordered by use

The experiment of 0.7 ordered the facet bar by use. With the bar it was retired in 0.9.0: within a journal the panel orders facets by name, so that each keeps its place. An existing `Addon function: statistical facet order …` line stays in the journal and is ignored.

### 4.14a Search

- The magnifier in the header (or `/` outside text fields on a computer; Cmd-F stays the browser's search) opens a field below the add field ("Search text, notes, #tags", underline as the add field) and a toggle *include done*. While the field holds text, a round cross at its right end clears it in one tap and keeps the focus in the field, as search fields on most systems do. Tapping the magnifier again or Escape closes it and clears the query.
- The query is matched in the client only, against the text, the note and the tags (`#dim-value`) of the entries of all journals, ignoring case and accents (`brucke` finds *Brücke*); several words must all occur. Tag definitions and comments are not entries and are not found.
- While a query is set, the list shows every match: open entries beyond the 30-day and three-month horizons (group *After 30 days*), groups without their limits. The facet bar and the filter tab still apply.
- A line below the facet bar reads "Search: *query* · n entries", adding "m more hidden by the filter" where the filter hides matches, and *Reset*, which closes the search.
- With *include done*, closed entries still in the journal (until compaction) are found too, in a group *Done*, greyed but usable: their note opens, their tags can be changed, and removing `#done` reopens them (decided 19 November 2026; before, they could not be touched).



- Each kind starts with *All* and *None* (as in the facet bar): show or hide all its values at once.
### 4.11d Journals

In the settings, above the account of the default journal (hidden in local file mode):

- A list of the journals, 14 px above and below each row: name (16 px / 500), below it in `--muted` one line with the facets declared by its Tag definitions (colour line and name, 16 px apart, never broken inside a facet) and one line with the shortened account ID and the role (created by you, shared with you); the default journal is marked `DEFAULT`; *Edit* at the end of each row.
- A journal without name and alias is listed as *No name yet* (italic, `--fg2`) with the start of its account ID in brackets, the hint "Tap *Name* to give it one", and the row's button reads *Name* instead of *Edit*. With an alias, the row says the journal's own name ("name in the journal: …") or that it has none.
- *+ Add journal* and *Rename tag* (secondary), a hint that facets belong to journals and are chosen with the journal's name.
- **Add journal** dialog: field for the eight words, *Create a new journal* (fills a new phrase and shows a hint to note and pass it on), name, *Add*. For a new journal the name becomes its `Journal name:`; for an existing journal it becomes the user's alias, and the journal keeps its own name. A journal already in the browser is refused.
- **Sections of the journal dialog** (audit U1): *Sharing* (who uses it, phrase, ally and guest code, QR code, the field for a stronger code, account ID), *Content* (overlay, *Fixed dates by default*, *Pass facets*, export), *Version* (upgrade, the former journal of version 1, the mark *I created this journal* for version 1), *Ending* (*Hand over*, *Stop sharing*, *Delete on server*, *Remove from my journals*, one below the other, each with a sentence on what it does). States come first: a journal deleted on the server, lines that vanished. A section without anything to show is left out. The journal list shows its facets, each with its colour line and the name in `--fg`, 14 px (outside any choice, facets are dark, ui.md 2.3b), then the version (1 or 2), the level (owner, ally, guest) and states (deleted on the server, lines vanished, handover pending, taken over). Below the list a line says where the migration stands: how many journals here are still of version 1, or that all are of version 2 and how many former journals of version 1 are still on the server. In Settings → Account, words, codes and account ID of the default journal appear only for a local journal file; with a server they are in the journal dialog.
- **Edit** dialog: for a further journal an *Alias (shown to you only)* field first; then the name (for the own journal *Name*, for a further journal *Name in the journal (seen by everyone who shares it)*; writes or changes the `Journal name:` entry), account ID, *Show account phrase*, *Show QR code*, *Export journal file*, and with more than one journal *Pass facets* (architecture 8.11d): a dialog with the facets of every other journal as toggles (as in the facet bar, ui 2.3b, here starting unchosen), a preview of what moves, what stays and loses the facet, and who will see it, then *Cancel* / *Pass*. For a further journal also *For you only: every entry of this journal also has the facet*, the user's own facets as value buttons (architecture 8.11c). For the own journal and journals of role `own`: the box *Fixed dates* (writes `Journal type: fixed`, or `mixed` when unticked; architecture 5.5). For further journals: the box *I created this journal*; for `own` journals *Stop sharing for anybody* (two taps, architecture 8.11b) (role `own` or `joined`, architecture 8.11a), *Remove from my journals* (two taps; removes it on all devices of the account, the journal stays on the server) and, only for `own`, *Delete on server* (two taps). A journal deleted by its owner shows a note instead of the box and the delete button. Upgrade (architecture 8.11h): for a version 1 journal of the user, *Upgrade to version 2 …* (two taps) with a line on what it does; afterwards the new words are shown, the old journal disappears from the list and the new one takes its place. In the dialog of a journal read as guest, and of a default journal upgraded on another device, a field *Ally code or phrase of this journal* (respectively *New words of this journal*) with *Use this code*. For a further journal of version 2 held as owner, *Hand over to someone else* (architecture 8.11i): the dialog then shows only the handover code, as text and QR code, with what to do with it, and *Done*; once taken over, a line says so and that the journal can be deleted. Results of an upgrade, a takeover and a handover code replace the dialog's content in the same way: title, a short instruction, the words or the code, *Done*. Buttons carry no ellipsis. In the dialog of a journal that replaced a version 1 journal, *The former journal of version 1*: who still uses it, and *Delete the version 1 journal on server* (two taps).
- Below the account ID, *Used by*: "You and n other people, counted since …" (or "Only you"), then one line per member ID with "you" or "someone else" and the last use, and a short note that IDs differ per journal and reveal no name (architecture 8.4a).
- The journal list shows after the account ID "created by you", "shared with you" or, in `--scarlet`, "deleted by its owner".
- With more than one journal, the label of the default account reads "Default journal <name> · account ID".
- *Documentation* at the bottom left (4.15) opens the user documentation (`site/`, published at https://outheis-labs.github.io/outheis-agenda/) in a new tab; the help dialog of the facet field links to its page on facets.

In the list, entries from a further journal carry its name as a small tag (12 px, 0.5 px border `--line`) after the text. With more than one journal, every facet choice (facet choice 4.2, value popover 4.7, import) lists each facet once per journal that has it, with the journal's name as a small label in `--muted` (11 px) — in the popover right-aligned, in the facet choice below the name. A facet chip in the list shows its journal only as a tooltip (`title`). Choosing the entry's first facet from another journal moves the entry; the popover also offers the current facet in each journal that does not have it ("<journal>, new here"); the bar confirms with "Moved to <journal>" and *Undo*. A name typed in the add field that several journals have, or only a journal the user has joined, opens the facet choice limited to those journals and the default journal ("<name>, new here"), headed "#facet-x belongs to … Write the entry to:". The text view shows one tab per journal above the text field when there is more than one (15 px, the current one 500 with a 2 px underline).

A notice without *dismiss*, computed on every render, lists entries whose facet is declared only by another journal, with *Move to …* and *Keep in …*. In the list, bar and choices, a facet name used in several journals is followed by the journal's name.

### 4.11e Rename tag

Dialog with the journals as toggles (2.3b; all chosen when opened from the settings), the *Tag type* (`facet`, `topic`) as text tabs, the values of that type in the chosen journals as value buttons with their counts (2.3b), and the new value in a field with the fixed prefix (`#facet-`). A preview (Amber left border) states per journal how many entries get a new revision, how many of them are Tag definitions, whether the new value exists there (then both are merged) and whether the journal is shared. If the new value is already defined in a journal, the preview says that the definition is merged; the old value's definitions are closed there. A value that no open entry of any journal (and no own overlay) carries any more, only its Tag definitions, shows "definition only" instead of a count; chosen, it offers *Delete the definition* (danger, two taps), which closes its Tag definition lines in the chosen journals. *Rename* renames the value in all chosen journals at once, Tag definition lines included; a Tag definition whose description is just the old name gets the new name as description. It is enabled only for a valid, different value and at least one journal. Opened from the settings or, prefilled with one journal, from a notice.

### 4.15 Version and documentation

At the end of every view (on screens of 1500 px and wider fixed at the bottom left of the side area), as in the outheis web interface: the version (`v` + the content of `VERSION`, 11 px, `--muted`) and below it *About* and *Documentation ↗* (opens `https://outheis-labs.github.io/outheis-agenda/`), each 12 px, `--muted`, `--fg` on hover, in a new tab. The settings have no guide button. The version is written into `index.html` by `clients/web/build.py`, which also names the offline cache after version and content, so that every build replaces it.

The user documentation is a site of its own in `site/`, structured and styled after outheis-docs: Markdown in `site/content/en` (base) and `site/content/de`, built by `site/scripts/build-site.py` into `site/html/` (English at the root, German under `de/`; a page without German text is built from the English one with a note), and published by `.github/workflows/pages.yml`. The specifications (`architecture.md`, `ui.md`, `decisions.md`) stay in `docs/` and are linked from its *Troubleshooting* page.

### 4.16 Values without entries

The facet bar and the filter tab show only values with at least one open entry in the views' range. Choices for new entries (facet choice, tag popover) still offer values that only have a Tag definition.

### 4.17 Month view

*Month* shows the agenda as a calendar; it is a way of showing the list, not a view of its own: the add field, the facet bar and the filters stay and apply. The choice is kept per device (`localStorage agenda.month`). A search shows the list until it is closed.

- **Navigation:** *‹* and *›* (previous and next month) and *Today*, each with a border, the month name between them.
- **Grid:** six weeks from Monday, days of other months in `--muted`. Today has its number underlined, the chosen day a 1 px border in `--fg`. Below each number up to three dots in the colour of the entries' first facet (`--line` without a facet), a fourth and more as *+*.
- **Days of an entry:** every occurrence of a series except those passed over by `#skip`, and every day of a span (`occurrences()` in the core). Entries without a date, and flexible ones carried from earlier days (marked *now*), appear on today only: a calendar would otherwise show commitment where there is none. Passed calendar entries are left out as in the list; passed fixed entries stay on their day.
- **Day list:** under the grid the chosen day (weekday, day, month) with its entries as in the list, in agenda order. Swipe, chips and note work unchanged; for a series, *Done*, *Skip* and *Reschedule* concern the occurrence of the chosen day, not the next one.
- **New entries:** with another day than today chosen, the add field reads *New item on <date>* and the facet sheet starts with that date, unless the line carries a date of its own.
- No week view with a time axis and no dragging so far (decisions).

### 4.11g Calendar files

- **Import** goes through *Import entries*: the file button accepts several files at once, text and `.ics` (`text/calendar`); pasted text that contains `BEGIN:VCALENDAR` is read as a calendar. The preview of a calendar shows, per event, the text and the tags it gets (without `#cal`), a facet selector per new event, and above the list *Facet for all calendar entries*, which sets every row not chosen individually. Events that change an existing entry are marked `update` and keep that entry's facet. A note under an event says when its repetition could not be taken over. Events not imported are listed with the reason (cancelled, in the past, series ended, changed occurrence, already present).
- **Export** is *Settings → Export calendar*: facets as checkboxes (preselected from the facet bar), period (30 days, 3 months, all open items), *Download*; the dialog says that the file is not encrypted. File name `agenda-<date>.ics`.

The name in the header is a link back to the main view: it closes open dialogs and menus, switches to *List* and scrolls to the top (not during a manual edit, which must be saved or dismissed first).

### 3.2a Header on narrow phones

Up to 430 px the title is 22 px, the tabs *List*, *Month* and *Text* have 5 px side padding and the icons (filter, sync, settings) 34 px width, so that tabs and icons sit closer together and the row does not look crowded.

### 4.11h QR code of a phrase

*Show QR code* (settings for the default journal, edit dialog for a further journal) shows the phrase as a QR code (white, 260 px wide at most), content `agenda-phrase: <eight words>`. *Scan QR code* (setup step "I have an account phrase", *Add journal*) opens a dialog with the camera image; the app reads the image itself (jsQR, embedded) and fills the phrase field with the first code that holds a valid phrase, then closes the camera. The phrase is never put into a URL, so neither the browser history nor the service sees it. Without a camera (or permission) the dialog says so; typing the words works as before, and is the way on a computer without camera.

### 4.17 Undo

The last five changes made by the user (in the list, the tag menu, by done or reschedule, moves between journals, renaming, import, saving a manual edit) can be undone. Before each change the client keeps the working copies of all journals; changes within 400 ms count as one.

- **Ctrl-Z / ⌘-Z** undoes the last change, unless the cursor is in a text field (which has its own undo) or a dialog or the manual edit is open.
- After each change a small bar appears for 6 seconds at the bottom of the screen ("Changed: …" · *Undo*), centred, white with a 0.5 px border, for phones without a keyboard shortcut.
- Undoing restores the earlier content as new revisions (the restored lines take the current revision number, so that the earlier content counts as a change); entries created since are closed. Other devices see the result at their next synchronisation. The buffer lives in the open page only.

### 4.18 Diagnostic log

In the settings, *Diagnostic log*: a box *Write a log in this browser to trace faults*, and while it is on or the log is not empty, *Copy log* (puts the same text on the clipboard, to paste it anywhere), *Save log* (downloads `agenda-log-<date>.txt` with version, address, browser and the journal list at the top), *Flush log* (empties it) and the number of lines. The log keeps the last 2000 lines in the browser: start, HTTP requests with status and line counts, sync errors, journal list changes (added, removed, adopted, deleted by owner), manual-edit counts, undo, script errors. It never contains entry text, phrases or keys; journals appear by the first four characters of their ID. *Clear data in this browser* keeps a running log.

### 2.7a Link preview

Messengers (Signal, WhatsApp, Telegram) and other apps show a preview of a shared link from the Open Graph tags of the page: title *οὐθείς Agenda*, the description "An open and lightweight planning journal, cross-device and confidential by design.", and the image `og-image.png` (1200 × 630: the app icon on the left, the name and "An open and lightweight planning journal" on the right; the full description is shown by the messenger below the image, so it is not repeated in the image; source `clients/web/icon-src/og.html`). Image addresses must be absolute; the service inserts the scheme and host of the request into the page (from `Host` and, behind the local proxy, `X-Forwarded-Proto`), so no domain needs to be configured. Messengers cache previews; links sent earlier may keep the old view.
