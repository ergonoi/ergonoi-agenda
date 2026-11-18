# Agenda Architecture — Item Grammar and Tag Specification

Status: draft, 2026-11-14
Reference implementation: outheis-beta v0.2.52 (`core/agenda_store.py`, `agents/agenda.py`, `agents/data.py`)
This document contains no user data. Everything user-specific is held by the user: the account phrase, the journal (and through it the facet and topic vocabulary), and settings, in the human directory or browser storage (8.9). The service stores only encrypted files it cannot read (8.1).

---

## 1. Scope

This document defines the language in which items are written: the entry format, the tag grammar, the meaning of each tag dimension, the time semantics, and how items change over time. It is the contract between any input channel (dictation, CLI, Signal, WebUI) and any consumer (agenda agent, calendar view, search).

Free text carries meaning; tags carry queryable structure. Tags are scaffolding: each tag dimension must justify itself by information the text alone cannot yet reliably provide.

---

## 2. Entry Format

### 2.1 Structure

An entry is exactly one line. One line is one record: appending, synchronising, diffing and line-based tools (`tail`, `grep`, `wc -l`) operate on whole entries without a parser.

```
<text> [{{<note>}}] <tag> {<tag>}
```

- **Text** — normalized free text in the user's language, first. No dates or times as figures unless they carry information not expressed in tags (see 5.4).
- **Note** (optional, 2.4) — additional text in `{{…}}` between the text and the tags.
- **Tags** — the contiguous run of `#`-tokens at the end of the line, separated by single spaces.

Parsing rule: first take out the note, if any (2.4); then split the rest at spaces and read tokens from the end as long as they start with `#`; these are the tags. Everything before is the text. A `#` inside the text is therefore harmless.

Constraints:

- The text must not be empty.
- The text must not end with a token starting with `#`; such a token would be read as a tag.
- No line breaks inside an entry. Empty lines are ignored.

### 2.2 Grammar (EBNF)

```ebnf
journal     = { entry , newline } ;
entry       = text , [ " " , note ] , " " , tag , { " " , tag } ;
note        = "{{" , { note-char | escape } , "}}" ;      (* 2.4 *)
escape      = "\" , ( "n" | "}" | "\" ) ;             (* line break, brace, backslash *)
text        = token , { " " , token } ;          (* last token must not start with "#" *)
token       = non-space-char , { non-space-char } ;

tag         = "#" , dimension , "-" , value ;
dimension   = lower-alpha , { lower-alpha } ;                (* English *)
value       = word-char , { word-char | "-" | ":" } ;       (* user language; see 3.1 *)

date        = digit*4 , "-" , digit*2 , "-" , digit*2 ;     (* YYYY-MM-DD *)
clock       = digit*2 , ":" , digit*2 ;                     (* HH:MM, 24h *)
duration    = ( hours , [ minutes ] ) | minutes ;        (* 2h, 1h30m, 45m *)
hours       = digit , { digit } , "h" ;
minutes     = digit , { digit } , "m" ;

time-value  = clock , "-" , clock                       (* start and end *)
            | clock                                     (* start only *)
            | duration ;
```

### 2.4 Note of an entry

An entry may carry additional text, its *note* (in iCalendar terms: `SUMMARY` is the text, `DESCRIPTION` the note). It is written as `{{…}}` after the text and before the tags:

```
Meet the client {{Address: Garden Square 3\nContact: Ms Huber}} #facet-work #date-2026-11-18
```

- At most 500 characters (after decoding). Inside, `\n` stands for a line break, `\}` for a brace and `\\` for a backslash; nothing else is special, and a `#` inside starts no tag.
- `{{…}}` counts as the note only if nothing but tags follows it; otherwise it is ordinary text. Of several, the last one that meets this rule is the note.
- The delimiters are plain ASCII, available on every keyboard, and very unlikely in a title (`[[…]]` was not chosen: wikis and Obsidian use it for links).
- The note is part of the line: it is encrypted, synchronised and versioned with it. Views show only an icon; the text view shows the line as it is. A note without visible characters is removed from the line.
- Calendar import turns `DESCRIPTION` into the note, export writes it back.
- A journal with notes declares the version that introduced them (3.7).

### 2.3 Example

```
Breakfast with the neighbours #facet-family #date-2026-11-15 #time-08:00-09:00 #id-0839215044851712001 #rev-0839215044851712001
Design the second version of the stool #facet-work #date-2026-12-01 #topic-design #id-0839215044851712002 #rev-0839215044851712002
```

---

## 3. Tag Conventions

### 3.1 Two-part tags

Every tag is `#dimension-value`.

- **dimension** — English, lowercase, fixed set (Section 4).
- **value** — in the user's language where it is a word (`family`), language-neutral where it is a code (`2026-11-15`, `s`, `high`).
- Values of `facet` must match `\w+` (no hyphen); they serve as IDs.

### 3.2 Order of tags

Recommended order, not enforced by the parser:

```
#facet  #date [#date]  #time  #recurring  #skip…  #rank  #size  #action  #type  #anchor  #topic  #done  #moved  #review-needed  #source  #ref  #decision  #cal  #id  #rev
```

`#facet` comes first, followed by the chronological tags. `#id` and `#rev` are system metadata and come last.

### 3.3 Cardinality

| Dimension | Required | Max per entry |
|---|---|---|
| `facet` | **yes** | 3 — the first owns the entry (journal, colour) |
| `date` | no (default: today) | 2 |
| `time` | no | 1 |
| `recurring` | no | 1 |
| `skip` | no | 60 (dates of a series' occurrences that do not take place, 4.4b) |
| `rank` | no | 1 |
| `size` | no | 1 |
| `action` | no | 1 |
| `type` | no | 1: the kind of line: `event`, `task`, `memo` (5.5, 5.6) or `meta` (a line about the journal: name, version, keys, definitions, overlays, add-ons, learned rules; 3.4); `fix` and `flex` are read as the older spelling of `anchor` |
| `anchor` | no | 1: `fix` or `flex`, the date binding where it differs from what kind and heuristic give (5.5) |
| `topic` | no | 3 |
| `done` | no | 1 |
| `moved` | no | 1 (id of the journal an entry moved to; only on tombstones, 8.11d) |
| `review` | no | 1 |
| `id` | yes (assigned by system) | 1 |
| `rev` | yes (assigned by system) | 1 |

**Several facets and topics.** An entry may carry up to three different topics, and up to three different facets, for work that belongs to more than one area (`#facet-garden #facet-school #topic-cooperation`). The first facet owns the entry: it decides the journal (8.11) and the colour. In filters and counts the entry belongs to each of its facets; it is shown while at least one of them is shown. Further facets are names only: an entry lives in exactly one journal, the one of its first facet, and choosing a further facet moves nothing. The same facet twice counts once. Journals with such entries declare version 0.3.0 (3.7).

### 3.4 Vocabulary

Facet and topic values are not configured anywhere. The vocabulary of a dimension is the set of values that occur in the journal, in open and in done entries; a client derives it from the journal it holds. Consequences:

- A new value comes into existence by being used. Clients check only the grammar of a value (`facet`: `\w+` without hyphen; `topic`: words joined by hyphens), not membership in a list.
- A value disappears when the last entry carrying it is purged by compaction, i.e. when it has not been used for longer than the retention period (6.4). The vocabulary therefore shrinks by itself as values fall out of use.
- **Values offered.** Clients offer for choosing (tag menus, facet bar, import) only the values carried by an open line of the current state: entries, Tag definitions, overlays, rules. Earlier versions of an entry and closed lines (`#done`) do not count, so that a value renamed or deleted is no longer offered at once, although finished entries still show it until compaction.
- **Retained values.** A value that must not disappear is kept by an entry dated `#type-meta`, by convention with the text prefix `Tag definition:` and a short description of what the value stands for:

  ```
  Tag definition: annual tax return #type-meta #topic-taxes #id-… #rev-…
  ```

  A definition line needs no `#facet` (a topic is not bound to a facet); it is the only kind of entry exempt from the mandatory facet (7.2). A definition of a facet carries that facet.

  Such an entry is an ordinary open entry: it is never purged, it is synchronised and encrypted like every other entry, and it never appears in a view, because views end at a horizon (`docs/ui.md`, 5.4). It is edited or closed (`#done`) like any entry, in the text view or by hand. The date is fixed rather than relative, so that every writer produces the same line.
- **One definition per value and journal.** Open Tag definitions that are identical (same text and tags) are closed by the client at the next sync except the oldest. Renaming a value into one that is already defined in the journal closes the definitions of the old value instead of renaming them. Definitions of one value with different descriptions are not resolved automatically: a notice lists them and the user keeps one.
- **Definitions from the interface.** A facet or topic created in a client's field for a new value gets its Tag definition written at once (`ui.md` 4.11f); values that only appear in text do not.
- **Journal alias.** Each user can give another journal an alias of their own, shown instead of the journal's name. It is kept in the user's default journal as `Journal alias: <journal id> <alias> #type-meta` (journal id: the first 12 hex characters of the account ID), so it applies on all the user's devices and is not seen by the other members. Closing that entry removes the alias.
- **Journal name.** A journal names itself with an entry `Journal name: <name> #type-meta`. The name is display text, kept as typed (a capital first letter is the convention), at most 40 characters, without `#` or line break. Like a Tag definition it needs no facet and never appears in a view. If several such entries are open, the one with the highest `#rev` applies; without one, clients show the first four characters of the account ID (8.11).
- **Journal version.** `Journal version: <x.y.z> #type-meta` names the oldest app version that can write the journal's format (3.7).
- **Starter definitions.** A new account receives Tag definitions for `private`, `work` and the topics `sports`, `official`, `travel`, and four example entries (`ui.md` 4.11c). The user deletes or keeps them once (`ui.md` 4.11i). A journal without any facet offers none; the first one is typed.
- **Addon function.** `Addon function: <name> on|off …` keeps the state of an optional function in the default journal, one line per function. The only one was the experimental facet order (`ui.md` 4.14b), retired in 0.9.0; an existing line is ignored.
- **View.** `View: <name> | on <facet@journal id> … | hide <kind:value> … #type-meta` is a named filter of the user (`ui.md` 4.14), in the default journal, so that it applies on all the user's devices and is not seen by other members. `*` stands for all facets, `-` for *without facet* or an empty value. Closing or removing the line removes the view.
- **Journal type.** `Journal type: fixed|mixed #type-meta`: a journal of fixed dates (5.5); set by its owner.
- **Journal examples.** `Journal examples: kept #type-meta` (or `deleted`, when starter definitions were kept for the user's own entries) records that choice in the default journal, so that it is not asked again on any device.
- **Facet colours** are assigned in order of first use (smallest `#id` carrying the value), cycling through the colour palette (`docs/ui.md`, 2.3).

### 3.7 Journal version

The version of the app and of the service binary is the content of `VERSION` (0.2.0 since the note of 2.4, 0.3.0 since several facets, 3.3, 0.4.0 since date binding and exceptions of series, 4.4b and 5.5; 0.5.0 since `#anchor` and the kinds `event`, `task`, `memo`, 5.5 and 5.6; 0.6.0 since journals of version 2, 8.11e). A journal records the format it needs with a line `Journal version: <x.y.z>`:

- The line is written by a client when a journal first uses a feature that older clients would misread; for the note (2.4) that is 0.2.0, for `#type`, `#skip` and `Journal type:` 0.4.0, for `#anchor` and `#type-event/-task/-memo` 0.5.0, for journals of version 2 and for journals whose key lines hold ally, guest or handover codes (which older clients would take for phrases) 0.6.0. It is not raised with every release, so that a client is not held back by updates that did not change the format.
- A client whose own version is lower than the journal's only reads the journal: it fetches and shows it, but sends nothing to it, and asks the user to reload the page to update. Local changes stay in its working copy.
- Of several open version lines the highest applies.

---

## 4. Tag Dimensions

### 4.1 `#facet-<value>` — required

Life area the item serves. Assignment by whom the item serves, not by surface similarity. Values are the user's own (3.4); typical are one facet per occupation or organisation, one for family, one for personal matters.

### 4.2 `#date-YYYY-MM-DD`

Appearance date: the day from which the item surfaces in the agenda. Not the creation date (that is encoded in the ID).

- Absent → today.
- Two `#date` tags → multi-day span from the first to the last day (all-day if there is no `#time`). With `#recurring`, see 4.4a.

### 4.3 `#time-…`

Three forms. A clock value (`HH:MM`) is always a time of day; a duration always carries a unit (`h`, `m`).

| Form | Example | Meaning |
|---|---|---|
| `#time-HH:MM-HH:MM` | `#time-09:00-15:00` | start and end |
| `#time-HH:MM` | `#time-08:00` | start only; end open or irrelevant |
| `#time-<n>h<n>m` | `#time-45m`, `#time-2h`, `#time-1h30m` | duration without fixed start |

- With two `#date` tags, the start applies to the first day and the end to the last day; for a bounded series (4.4a) the time applies to each occurrence.
- There is no end-only form. A deadline („bis 17 Uhr abgeben“) is stated in the text.
- Times are never invented: no default end, no default duration.

### 4.4 `#recurring-<pattern>`

| Tag | Meaning |
|---|---|
| `#recurring-daily` | every day |
| `#recurring-weekly` | same weekday as anchor |
| `#recurring-biweekly` | every second week, on the anchor's weekday, counted from the anchor |
| `#recurring-monthly` | same day of month as anchor |
| `#recurring-yearly` | same month and day as anchor |
| `#recurring-mon`, `#recurring-mon-wed-fri` | given weekdays (ISO English: mon tue wed thu fri sat sun) |
| `#recurring-monthly-1-15` | given days of month |

Combined with `#date` of the next occurrence. Only the anchor item is stored; instances are generated by the view.

### 4.4a Two dates with a repetition

How two `#date` tags of a recurring entry are read depends on how far apart they are, compared with the period of the repetition:

| Repetition | Dates less than one period apart | Dates at least one period apart |
|---|---|---|
| `weekly` (7 days), `biweekly` (14 days), `monthly` (1 month), `yearly` (1 year) | **one occurrence over several days** that repeats: `#date-2026-07-10 #date-2026-07-12 #recurring-yearly` = every year 10–12 July | **bounds of the series** |
| weekday lists, days of month, `daily` | bounds of the series | bounds of the series |

- **Bounds of the series:** occurrences fall from the first date up to and including the second; `#time` applies to each of them. `Training #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed` = Mondays and Wednesdays 12–13, until 31 March. After the second date the entry is no longer shown; it stays open in the journal until closed.
- **One occurrence over several days:** the time's start applies to its first day, the end to its last, as for a span without repetition (4.3).
- Reading the bounds of a weekly, monthly or yearly series closer than one period as an occurrence loses nothing: such a series would have a single occurrence.
- The grammar is unambiguous; to make the reading visible, views show it (the range of the occurrence, or "until …" for a series), and they mark two cases that are probably not meant: an occurrence longer than half its period, and a series with no occurrence between its dates. Adding the second date or the repetition shows the reading as a notice.
- A recurring occurrence over several days with an end of its series cannot be expressed; calendar import keeps the occurrence and marks the entry for review.
- Calendar files: a bounded series is exported as `RRULE` with `UNTIL`, an occurrence over several days as `DTSTART`/`DTEND` over these days with `RRULE`; import maps both back.

### 4.4b Single occurrences of a series

An occurrence of a recurring entry can be cancelled or moved without changing the series, as `EXDATE` and `RECURRENCE-ID` do in iCalendar:

- **Skip.** `#skip-<date>` on the series: that occurrence does not take place; the next one is shown. Several are allowed.
- **Reschedule one occurrence.** The series gets `#skip-<original date>`, and a single entry takes the occurrence's place on the new day: same text, facets, topics and time, `#type-fix`, and `#ref-<id of the series>` (4.10b). Its time and date can then be changed like any entry's.
- **Done for one occurrence** no longer exists as an action (0.9.36): it wrote the same `#skip-<date>` as *Skip* and suggested that the series itself was done. *Skip instance* covers both, an occurrence attended and one that did not take place.
- **Delete series** ends the whole series (`#done`).
- **Calendar files.** Import: `EXDATE` becomes `#skip`; an occurrence with `RECURRENCE-ID` becomes a single entry of its own, and its series skips the original day. Export: `#skip` becomes `EXDATE`.
- Skips in the past have no effect any more; they may be removed when the entry is next changed.

### 4.5 `#rank-<level>` — priority

`high` · `medium` · `low`

Priority of the matter the item describes, independent of its process state. `#action-now` refers to the next step, `#rank` to the matter as a whole; an item may carry `#rank-low #action-now`.

### 4.6 `#size-<scale>`

`s` (small) · `m` (medium) · `l` (large)

Approximate scale of a task or project, without conversion into time. Optional; set only when the scale is worth noting, typically for long-running matters. A stated duration is never expressed as `#size`; it goes to `#time` (4.3). Lowercase only.

### 4.7 `#action-<state>` — process state

| State | Meaning |
|---|---|
| *(no action tag)* | not started |
| `required` | action by the user needed |
| `now` | action needed immediately — escalation of `required` |
| `waiting` | waiting for someone else |
| `idle` | worked on, currently lying, waiting for no one |

Completion is not an action state; it is expressed by `#done-*` (4.9).

```
            ┌──────────────┐
            │ (not started)│
            └──────┬───────┘
                   ▼
   ┌──────────► required ◄──────────┐
   │               │                │
   │               ▼                │
   │             now                │
   │           ╱     ╲              │
   │          ▼       ▼             │
   └──── waiting     idle ──────────┘
            │         │
            ▼         ▼
          #done-YYYY-MM-DD
```

Any state may transition to done. Transitions are free; the diagram shows the typical course, not a constraint.

Activity types (`call`, `send`, `write`, `meeting`, …) are not tags; the activity is stated in the text.

### 4.8 `#topic-<value>` — subject

Optional. Values per 3.4. (Status: see open issue 3.)

### 4.9 `#done-YYYY-MM-DD` — tombstone

Item taken out of the queue on that date, regardless of reason (completed, dismissed, cancelled, entered by mistake). Done items are hidden from all views immediately, never resurface, and are physically removed by the nightly compaction after the retention period (Section 6). If the reason matters, it is stated in the text of the last version.

### 4.10 `#review-needed`

Set only when the input is genuinely ambiguous (recognition error that cannot be resolved from context, contradictory statements). Never for relative time expressions; those are resolved by rule (5.2).

### 4.10a `#source-<origin>` — who wrote the entry

`human`, `bot` or `mixed`, as in outheis-beta. `bot`: written by a program on its own (a proposal, a question, a learned rule); `mixed`: proposed by a program and accepted by a human. Absent means `human`. Set by clients and bots, never removed by hand except to take over an entry. Rules for bots: 8.12.

### 4.10b `#ref-<snowflake>` — reference to another entry

The `#id` of another entry this one refers to: a preparation or reserved time to the appointment it belongs to, a comment or a proposed change to its entry (8.12). The referred entry may be in any journal the user holds. Clients show the start of its text on the chip and offer to go to it; if it is closed, deleted or not shared with the user, the chip says "not found". At most one per entry.

### 4.10c `#decision-<verdict>` — outcome of a proposal

`accepted` or `rejected`, set by the client when the human decides on a proposal; the proposal is closed with `#done` at the same time. Kept until compaction removes the closed entry; it is what a bot learns from (8.12).

### 4.10d `#cal-<hash>` — origin in a calendar file

The first 10 hex characters of SHA-256 of the event's `UID` (8.13). Set on import; a later import of the same event updates the entry carrying it instead of adding another.

### 4.11 `#id-<snowflake>`

Unique, chronologically sortable item identity. 64-bit Snowflake: 41 bits milliseconds since 2024-01-01 UTC, 10 bits machine ID (from hostname), 12 bits sequence; zero-padded to 19 digits.

- Assigned by the system at ingestion, never by an LLM.
- Stable for the lifetime of the item; it never changes and therefore permanently encodes the item's creation time.
- Identical `#id` across entries means: same item, different versions (Section 6).

### 4.12 `#rev-<snowflake>`

Version of an item. Same Snowflake format as `#id`; it encodes when the version was written.

- Assigned by the system, never by an LLM.
- Present on every entry. On the first version, `#rev` equals `#id`; a line where both are equal is the original version.
- Every later version carries a new `#rev`.
- The current version of an item is the entry with the highest `#rev`, independent of its position in the file.

---

## 5. Time Semantics and Normalization Rules

### 5.1 Base rules

| Input | Result |
|---|---|
| no time reference | `#date` = today, no `#time` |
| time without date | today |
| explicit start and end | `#time-S-E` |
| explicit start, no end | `#time-S` |
| duration only („eine Stunde“) | `#time-1h` |

Times are never invented.

### 5.2 Relative expressions — earliest possible point

| Input | Resolves to |
|---|---|
| „morgen“ | next day |
| „nächste Woche“ | Monday of next week |
| month named („im Dezember“) | first day of that month |
| „nächstes Jahr“ | January 1 |
| day of month („am 15.“) | 15th of current month; next month if already past |

### 5.3 Reminder date vs. event date

`#date` is the trigger. If the event takes place on a different day than the reminder, the event date stays in the text:

```
Prepare the trade fair on 30 June #facet-work #date-2026-05-03 #id-… #rev-…
```

### 5.4 Text rule

Dates and times expressed in tags are not repeated in the text. Exceptions: the event date in 5.3, and a deadline (4.3).

### 5.5 Passed items: date binding

What happens to an item whose date has passed without `#done` depends on its **date binding**, not on whether it is called an appointment or a task: appointments can be movable, tasks can be bound to one day.

- **Fixed** (`#anchor-fix`): the item belongs to its date and is not there after it. Once its day (or its time span) is over it disappears from the list and the month view, as an imported appointment does. Nothing is written: the line stays open in the journal, the search finds it (group *Past*, in the search only), and the Text tab shows it. (Until 0.9.2 such items waited in a group *Past* with *Done* and *Reschedule*; withdrawn 18 November 2026.)
- **Flexible** (`#anchor-flex`): the item is carried forward: it stands in *Today* with its original date and counts as urgent (*now*), until it is done or rescheduled. The urgency is derived when the list is shown, not written: several devices would otherwise change the same entries every morning, and a *now* nobody set would remain after it is done.
- **Passing without asking.** Fixed items from a calendar import (`#cal`) pass silently: their source calendar decides. So do all items of a journal of fixed dates (birthdays, holidays): the line `Journal type: fixed #type-meta`, set by the journal's owner, applies to everyone who shares it; such a journal can still be added to.
- **What decides.** An explicit `#anchor-fix` or `#anchor-flex` first; then the kind: `#type-event` is fixed, `#type-task` flexible; then the journal's type; then a calendar origin, a repetition or a clock time make an item fixed, otherwise it is flexible. Most entries carry neither tag: the heuristic is right for them. `#anchor` is written only where the user chooses against it, for example a time window (`#time-08:00-10:00 #anchor-flex`) that must be done some day between eight and ten and is carried forward until it is.
- **Older spelling.** Until 0.5.0 the binding was written `#type-fix` and `#type-flex`. Clients still read it, and rewrite it as `#anchor-fix` and `#anchor-flex` at the next sync of a journal they may write to; `#type` then holds the kind of entry only.
- **Recurring items** are fixed: each occurrence passes, the next one is shown (4.4, 4.4b).

### 5.6 Memos and meta lines

Some entries are not due at all: a number to look up, a recipe, an address. They are memos: `#type-memo`, no date, no time, no repetition.

- A memo never passes and is never due. It appears in no group of the list, not under *Show all* and not in the month; the bookmark in the header shows the memos on their own (`ui.md` 4.2b), and the search finds them in a group *Memos*. Filters apply to them. Its date column stays empty.
- It is not exported to calendars.
- When adding an entry, the bookmark beside date and time makes it a memo (`ui.md` 4.2); later `type` in the tag menu.

Lines about the journal itself carry `#type-meta` and no date either: `Journal name:`, `Journal version:`, `Journal key:`, `Tag definition:`, overlays, `Addon function:` and the others of 3.4. Their kind is written like that of every other line, not read from how the text begins; the beginning says which meta line it is.

**Older spelling.** Before 0.5.0 meta lines and memos carried the date `3000-12-31` instead of their kind. Clients still read that, and at the next sync of a journal they may write to they remove the date and write `#type-meta` or `#type-memo`, together with `#anchor` for `#type-fix/-flex` (5.5).

- **Over within the day.** An item of today with a time span (start and end) has passed once its end is over. A single item is then treated as above: a fixed one disappears, a flexible one stays in *Today*. A series shows its next occurrence, with its date. A single time without an end does not pass by itself; it leaves the list only by *Done*. *Done*, *Skip* and *Reschedule* on a series always concern the occurrence shown, whose date is on the row. The list is redrawn at each sync, about once a minute.

Nothing is written when an item passes; the classification is made each time the list is shown.

---

## 6. Change Model: Append-only with Tombstones

### 6.1 Principle

The journal is append-only. Existing entries are never edited during the day. Every change is a new entry carrying the same `#id` and a new `#rev`. Synchronisation between instances therefore only needs to compare the end of the file.

### 6.2 Resolution

For each `#id`, the entry with the highest `#rev` is the current version of the item (4.12). File order is irrelevant, so journals from several devices can be merged in any order. Each entry is complete: it carries the full text and all tags, not a diff.

If two devices change the same version independently, the later `#rev` wins; the other change is kept in the journal until compaction but is not current.

```
Call the supplier about the delivery date #facet-work #date-2026-11-14 #id-0839215044851712003 #rev-0839215044851712003
Call the supplier about the delivery date, callback pending #facet-work #date-2026-11-14 #action-waiting #id-0839215044851712003 #rev-0839402917354635264
Call the supplier about the delivery date, callback pending #facet-work #date-2026-11-14 #done-2026-11-18 #id-0839215044851712003 #rev-0841028311692103680
```

### 6.3 Operations

| Operation | New entry |
|---|---|
| create | new `#id`, `#rev` = `#id` |
| update (state, date, text) | same `#id`, new `#rev`, full new version |
| close (completed, dismissed, deleted) | same `#id`, new `#rev`, adds `#done-YYYY-MM-DD` |

### 6.4 Compaction

Compaction, once a day, and the taking up of lines without id (below) are the only processes that rewrite the file. Both are performed by a client of the owner (in version 1 by any client; in version 2 the service accepts a replace only with the owner's proof, 8.11e), with a conditional replace:

1. Collapse each `#id` to its entry with the highest `#rev`.
2. Remove items whose `#done` date is older than the retention period (default: 90 days, a client setting, 8.5); tombstones of moved entries after 30 days (8.11d).
3. Order the file: functional lines first (journal name, key, type, version, tag definitions, overlays, add-on functions, learned rules, sorted by text), then open entries by date and time, closed ones last.

With logging on, the client writes what it did to the local log: lines before and after, older revisions dropped, closed entries removed (the start of their text), tombstones removed. The log never leaves the device.

**Lines without id.** A line in the file without `#id` is not yet an entry; programs other than the clients write such lines, for example `agenda-cli` with `-strip-ids` (open issue 8). A client that may write the journal takes them up at its next sync, as if they had been typed in it: it adds the date where a line has none (5.6), checks the tags, gives each line an id and a revision, and replaces the file with all stored lines, the lines without id replaced by their entries. A line whose content is already an entry is dropped. If the file changed meanwhile, the replace fails and the next sync looks again, so two devices cannot take up the same line twice. With logging on, the number of lines taken up is logged.

### 6.4a Deleted on the server

Since 0.9.18 a deletion by the owner is answered with `410 Gone` (8.4b): every browser then removes its copy and its backups. What follows applies when the file is gone without that answer, for instance because the administrator removed it. A journal that had content and comes back empty from the server was deleted there. Every browser keeps its last state, shows it, and writes nothing into the journal, not even meta lines, so that the deletion is not undone by accident. A notice says so; the journal dialog explains it. Whoever may write the journal (in version 1 every holder of the phrase, in version 2 owner and allies) is offered *Restore on the server*: the browser writes its last state back, every stored line with its id and revision, the lines it cannot read unchanged. The other browsers then see the journal again and add what they have that is missing, by the usual synchronisation; nothing is doubled. *Remove from my journals* takes it out of the browser instead. That any writer can restore a deleted journal is intended: in an asynchronous system every copy is a backup. A journal is gone for good only when nobody restores it, or after *Stop sharing* (8.11b), which makes the old codes void.

**Vanished lines.** An open entry may leave the file only through a newer revision, and a closed one by compaction. If an open entry vanishes otherwise, the file was shortened on the server, by the administrator or by a faulty client of the owner. The client keeps what vanished, says so, and offers whoever may write *Restore these lines* (appending them again, with their ids and revisions) or *Let them go*. Lines that come back from another browser are no longer counted as missing. Lines the client cannot read are not compared, since compaction encrypts them anew.

### 6.5 Scope

Append-only applies to the journal as source of truth. Projections (`Agenda.md`, `agenda.json`) are derived and may be rewritten in place.


### 6.6 Design rationale

1. **Stable `#id` plus `#rev` instead of a new ID per version.** An alternative would give every version its own `#id` and link it to its predecessor (`#replaces-<id>`). That loses the item's creation time after the first change and requires walking a chain of references to find the current version. With a stable `#id`, the creation time stays readable for the whole lifetime of the item, and the current version is found by grouping on `#id` and taking the highest `#rev`.
2. **Snowflake instead of a counter.** A counter (`#rev-2`, `#rev-3`) produces ties when two devices change the same version independently, and it says nothing about when a version was written. Snowflakes are unique across devices and encode the time of the change. Their ordering is as accurate as the device clocks, which is sufficient with network time synchronisation.
3. **`#rev` is kept after compaction.** If compaction removed `#rev`, the surviving entry would fall back to the age of its `#id`. An older change from another device that arrives later (for example after being offline) would then have a higher version and overwrite the newer one. Keeping `#rev` makes resolution independent of when entries arrive.
4. **`#rev` on every entry.** Almost every item is changed at least once, since even a state change is a new version. Writing `#rev` from the first version on gives all entries the same shape, so parser and compaction need no special case, and an original version is recognisable by `#rev` equal to `#id`.
---

## 7. Ingestion

### 7.1 Principles

1. **Every line is valid without the system.** Text and tags are sufficient. A line typed by hand, transcribed from a photo, dictated, or copied from another document is a valid entry. No step requires a server, a network connection, or a specific application.
2. **The creator generates `#id` and `#rev` whenever it can.** Any device or program able to compute a Snowflake does so at creation time. The ID then carries the actual creation time, and versions remain correctly ordered however late they arrive.
3. **Ingestion only fills in what is missing.** This is the fallback, not the rule: handwriting, photos, plain text editors, and tools that cannot compute 64-bit integers exactly (e.g. iOS Shortcuts).
4. **Ingestion works on batches of arbitrary text, not on single lines.** Its only operation is `merge(journal, text) → journal`. The source of the text is irrelevant: outbox file, pasted text, OCR output, mail attachment, HTTP request.
5. **Ingestion never loses input.** Every non-empty input line ends up either in the journal or in the quarantine file (7.4). Nothing is discarded silently.
6. **Ingestion is idempotent.** Merging the same text twice yields the same journal as merging it once.
7. **Ingestion is order-independent** for all lines whose `#rev` was set by the creator. Only for lines whose `#rev` is assigned at ingestion does the order of merging matter (7.5).

### 7.2 Merge procedure

For each input line, in input order:

1. **Normalize.** Convert to Unicode NFC, replace tabs and non-breaking spaces by spaces, collapse runs of spaces, trim. Remove a leading list marker (`-`, `*`, `•`, `[ ]`, `[x]`). Skip the line if it is empty.
2. **Split** into text and trailing tag run (2.1). Lowercase tag dimensions; values of `date`, `time`, `size`, `rank`, `action` are lowercased as well. Values of `facet` and `topic` keep their spelling but are matched case-insensitively against the vocabulary.
3. **Validate each tag** against Section 4. An invalid or unknown tag is not dropped: it is moved back into the text (so no information is lost), and `#review-needed` is added.
4. **Complete.**
   - no `#date` → date of ingestion
   - no `#facet` → `#review-needed`, except for `Tag definition:` lines (3.4); on these, a `#review-needed` without other cause is removed
   - no `#id` → new Snowflake, `#rev` = `#id`
   - `#id` but no `#rev` → new Snowflake as `#rev`
5. **Deduplicate** (7.3). Drop the line if it is already in the journal.
6. **Append** the line in canonical form (Section 3.2 order).

A line that cannot be split at all (no text, or only tags) goes to quarantine.

### 7.3 Idempotency keys

| Line carries | Duplicate if the journal already contains |
|---|---|
| `#id` and `#rev` | an entry with the same `#id` and `#rev` |
| `#id`, no `#rev` | an entry with the same `#id` whose text and tags (excluding `#rev`) are identical after normalization |
| no `#id` | a current item whose text and tags (excluding `#id`, `#rev`) are identical after normalization |

A line with an existing `#id`/`#rev` pair but different content is an in-place edit of that version (typically from a working copy, 7.7). It is not a conflict: it gets a new `#rev` and is appended as a new version.

### 7.4 Quarantine

Merging runs in the client (8.5). Lines that cannot be merged are appended to the client's quarantine (`quarantine.txt` in the human directory, or browser storage), each prefixed with the ingestion time and the reason (`unparseable`). Quarantine is append-only, is never compacted automatically, and is reviewed by the user. Resolved lines are merged again by hand.

### 7.5 Clocks and ordering

- A `#rev` assigned at ingestion reflects the time of merging, not of writing. If a hand-written change is merged after a newer change from another device, the hand-written one wins. This is the only order-dependent case.
- A Snowflake that lies more than 24 hours in the future (device clock wrong) is accepted but the entry gets `#review-needed`.

### 7.6 Durability

- The service appends each batch with a single write call, followed by `fsync`.
- Replacing the file (compaction, 8.5) writes to a temporary file, `fsync`s it, and renames it atomically. A crash leaves either the old or the new file, never a mixture. The service keeps the previous file as `<account>.enc.prev`.
- A truncated last line (crash during append) is caught by validation on the next merge: it becomes an entry with `#review-needed` or goes to quarantine, but never corrupts the journal.


### 7.7 Local operation and working copy

Every client must work fully without connection to the merged journal, for an unlimited time, and must be aware of this state.

**Working copy.** Each client keeps a plain text file with the current version of every open item (without `#done`), one line each, in the format of Section 2. It is freely editable in place: by the application, or by hand in any text editor. Changing a tag, correcting text, or adding a line directly in the file is a valid way of working. An application built on this specification must offer the working copy as raw editable text, equal in rank to any structured view.

**Snapshot.** Each client also keeps the last journal it fetched, together with its hash. The hash identifies the state; the service delivers it as HTTP `ETag`.

**Deriving changes.** At sync time, the client compares the working copy with the snapshot:

| Working copy line | Meaning | Sent as |
|---|---|---|
| no `#id` | new item | new `#id`, `#rev` = `#id` |
| known `#id`/`#rev`, same content | unchanged | nothing |
| known `#id`/`#rev`, different content | edited | same `#id`, new `#rev` |
| `#id` of the snapshot missing in the working copy | **nothing**; a missing line is not a deletion | nothing |

Items end only through `#done`. A deleted paragraph or an incompletely copied file therefore never destroys entries.

**Sync procedure.**

1. Derive the outgoing lines (table above) and keep them as outbox until confirmed.
2. Merge the outbox into the last fetched journal (7.2), encrypt the resulting new lines and send them as one batch (8.5).
3. Fetch the journal conditionally (`If-None-Match: <hash>`).
4. A line counts as confirmed when its `#id`/`#rev` appears in the fetched journal, not when the send request succeeded. Confirmed lines leave the outbox; unconfirmed lines are sent again next time (idempotent, 7.3).
5. Rebuild the working copy from the current versions of the fetched journal plus all still unconfirmed outbox lines. The rebuild happens only after step 1, so edits made by hand are never overwritten before they have been captured.

**Superseded edits.** If the fetched journal contains a higher `#rev` for an item than a local edit, the other version wins (6.2). The application marks such items so that a local change does not disappear unnoticed.

**State awareness.** The application can show at any time, derived from the data alone:

- the newest change known locally: highest `#rev` in snapshot and outbox;
- unsent or unconfirmed lines: size of the outbox;
- after a successful fetch, whether the local state is current: hash comparison.

No separate sync timestamp is stored. Whether the local state is current can only be known with a connection; offline, the application states which state it shows and what is still pending.

**No operation waits for the network.** Reading, capturing, editing, and closing items always work locally. Synchronisation runs in the background whenever a connection exists.


A synchronisation that finds the working copy changed after it derived its outgoing lines (a change made while it waited for the network) does not rebuild the working copy; it requests another synchronisation, which sends the change.

### 7.8 Relation to version control

The procedure implements the functional core of a version control system in minimal form: a local working copy, a shared state identified by a hash, changes that are transferred as batches and count as confirmed only once they appear in the shared state, and a deterministic rule for merging concurrent changes.

Deliberately omitted are branches, a permanent history, and manual conflict resolution. Conflicts are resolved per item by the highest `#rev`, never line by line; history is a flat sequence of versions that compaction discards. A general-purpose version control system (e.g. Git) is explicitly not used: it would require a client on every device, resolve conflicts line by line instead of per item, and keep every past state permanently, which contradicts the retention rule.

---

## 8. Storage and Transport

Implemented in `server/` (relay) and `clients/web/` (web application). Not yet implemented: the MCP module (8.6) and the command-line client using the human directory (8.9); see open issue 8.

### 8.1 Trust model

The service is a relay. It stores, per account, a file of encrypted lines and hands it back; it holds no key and cannot read, merge or compact anything. Every operation on content (merging, deduplication, quarantine, compaction, display) happens in a client. The service therefore holds no readable user data, and anyone can be given an account on it without being able to see anyone else's journal, including the operator.

What the service can see: the number of lines per account, their size class (8.4), and when they were written. It can withhold or drop lines; it cannot forge or alter them unnoticed.

### 8.2 Account phrase and derived keys

An account is defined by a phrase of **eight words**, drawn at random by the first client from a list of 2048 words (88 bits) in the language chosen on the device: English (BIP39, the default), German, French, Spanish, Italian, Portuguese or Czech (`clients/core/wordlists`; all plain ASCII, accents of the BIP39 lists removed). The phrase is derived from its text, so it keeps the language it was made in. The phrase is shown once, written down by the user, and typed into every further client. It is stored nowhere else; there is no registration and no recovery. Whoever loses the phrase loses the journal; whoever has it has the journal.

Eight words are chosen because they can be copied by hand onto any device, including computers without a camera; no QR code is required.

Derivation (every client computes the same values):

```
phrase  = the eight words, lowercase, accents removed (NFKD without combining marks), separated by single spaces
master  = PBKDF2-HMAC-SHA256(phrase, salt = "outheis-agenda/v1", iterations = 600000, length = 32)
K_enc   = HKDF-SHA256(master, salt = empty, info = "enc",  length = 32)   # never leaves the client
token   = HKDF-SHA256(master, salt = empty, info = "auth", length = 32)   # sent to the service as 64 lowercase hex digits
account = hex(SHA-256(token))                                             # computed by the service
```

- The three values are separated so that nothing the service receives allows decryption: the service sees `token`, stores only `account`, and never sees `K_enc` or `master`.
- PBKDF2 instead of a memory-hard function: the phrase is random with 88 bits, so the cost factor only adds a margin; PBKDF2 is available natively in browsers (WebCrypto) and in Go without additional libraries.
- A fixed salt is acceptable for the same reason: precomputation over a space of 2^88 phrases is infeasible.

### 8.3 Stored file

One file per account, one encrypted entry per line:

```
<base64(nonce || AES-256-GCM ciphertext of the padded line)>
```

Before encryption, each line is padded to the next multiple of 256 bytes (ISO/IEC 7816-4: `0x80` followed by zero bytes). The nonce (12 bytes) is random per line. The same entry encrypted twice therefore yields different lines; duplicates are recognised after decryption (7.3) and removed by compaction.

The file is complete in itself: given the file and the phrase, any client can read and continue it without the service (8.7).

### 8.4 Service interface

The account is identified by what a request proves; the service stores nothing for this beyond the file. Two derivations are accepted side by side, so that journals can be converted from the first to the second (8.11e):

| Version | Header | Account ID | Allows |
|---|---|---|---|
| 1 | `Authorization: Bearer <token>` | `SHA-256(token)` | everything |
| 2, owner | `Authorization: Delete <D>` and `X-Agenda-Read-Hash: <SHA-256(R)>` | `SHA-256( F ‖ SHA-256(R) )`, `F` = the first 11 bytes of `SHA-256(D)` | deleting |
| 2, ally | `Authorization: Write <W>` and `X-Agenda-Fingerprint: <F>` | as above, with `R = HMAC-SHA256(W, "outheis-agenda/read")` | reading, appending, replacing |
| 2, guest | `Authorization: Read <R>` and `X-Agenda-Fingerprint: <F>` | as above | reading, including `GET /members` |

Tokens and hashes are 32 bytes, sent as 64 lowercase hex digits; `F` is 11 bytes, 22 hex digits. A request for an action its level does not allow is answered `403`; a request without valid values, `401`. A version 1 token cannot address a version 2 account, since it would have to be the 64 bytes hashed there. Test vectors: `W = 00 01 … 1f` gives `R = 1abf8e05…13b50698`; with `D = 20 21 … 3f`, `F = 72dbb733…23f83d` and the account `672c022e…c890cefb` (`server/auth_test.go`, `clients/core/test/keys.test.mjs`).

| Endpoint | Function |
|---|---|
| `POST /append` | body: one or more encrypted lines; appended in one write; creates the account on first use; returns the new `ETag` |
| `GET /journal` | the file as stored; `ETag` = hash of the file; supports `If-None-Match` |
| `PUT /journal` | replaces the file; requires `If-Match: <ETag>`; answers `412` if the file changed since (compaction, 8.5) |
| `DELETE /journal` | deletes the account (version 2: the owner's delete token only); for 7 days it can be undone (8.4b) |
| `POST /undelete` | undoes a deletion within those 7 days (the owner's delete token) |
| `GET /backups` | `{"backups":[{"slot","time","size"}]}`: the daily copies of the journal, newest first (8.4c) |
| `GET /backups/<n>` | the copy in place `n`, as stored |
| `GET /members` | the member IDs (first 16 hex characters) that used the journal, each with its last use, and since when the service counts (8.4a) |
| `GET /health` | `{"service":"outheis-agenda","version":"…"}`, no account, no member ID, nothing stored; for the connection test of the clients (decisions 6.4b) |
| `GET /` | web application |

A deleted account answers every request with `410 Gone` and `{"deleted":"<day>","restorable":…,"until":"<time>"}`, except a repeated `DELETE`, the owner's `POST /undelete`, and, once the deletion is final, the owner's first write, which starts the account anew.

Every request except `GET /health` also carries the member ID `X-Agenda-Member: <64 hex digits>` (8.4a); a request without member ID is refused (`400`). Query parameters are not accepted, so tokens do not end up in logs or browser histories.

**Admission rules.** The service cannot inspect content, but it enforces the form, so that it cannot be used to store or distribute anything but journals:

- every line must be valid base64 whose decoded length is `12 + 16 + n × 256` bytes, at most 4096 bytes; anything else is rejected as a whole request;
- at most 5 MB per account (a journal of many years stays far below); the limit is a constant in the service binary, not a setting, and changing it requires rebuilding the binary;
- pacing per journal and member: a burst of six requests (one synchronisation), then one per second; a request beyond waits for its turn (up to 10 seconds) instead of being refused, so that a client that asks too often is slowed down without errors. Whether the journal has changed is asked with its ETag (`If-None-Match`); an unchanged journal is answered with 304 and no data;
- rate limits: 60 writes and 240 reads per account per minute, 1200 requests per IP address per minute (against abuse only: the devices of a household share one address), 10 new accounts per IP address per day (`X-Forwarded-For` is trusted only from the local reverse proxy). A refusal (429) says in `Retry-After` when to ask again; the client waits that long;
- no unauthenticated read access to any file;
- accounts without any access for 5 years are deleted, with their backups.

Short encrypted texts exchanged between two parties who share a phrase remain possible; no service that cannot read its content can prevent that. Files, images and video are excluded by the admission rules.

`GET /` serves the web client; in the page the placeholder for its own address is replaced by the scheme and host of the request, for the absolute image address of link previews (`ui.md` 2.7a). The host is accepted only if it consists of letters, digits, dots, hyphens and a port.

### 8.4b Deleting a journal

Deleting is a decision of the owner, and it ends every access at once: from then on the service answers every other request for the journal with `410 Gone`. A client that receives it removes the journal from its list, its copy and its backups (8.4c), and says so. For the default journal of the account the browser is cleared, and the start page says why.

So that a deletion by mistake can be undone, the encrypted file and its backups stay on the server for 7 days, readable by nobody. Within that time the owner undoes it: the browser that deleted it keeps the words and the delete token as long, and offers *Undo deletion* in Settings → Journals; for the account itself, entering its words on the start page does it. Then the file and its backups are removed for good.

What remains is a marker with the day of the deletion and nothing else, kept for 5 years. Without it a client could not tell a deletion from a server that lost or reset its files; in that case it must keep everything (6.4a). Once the deletion is final, its owner may use the same words again; the journal then starts empty.

No system can take back what someone downloaded, exported or copied before, nor reach a device that never comes online again. The deletion reaches every copy that is still connected.

### 8.4c Backups

The service keeps up to 9 copies of every journal, made once a day and rotated as in the towers of Hanoi: on day `d` (days since 1970) the copy goes into the place given by the number of trailing zero bits of `d`, at most 8. Place 0 is written every second day, place 1 every fourth, place `k` every `2^(k+1)`th; the copies are thus about 1, 2, 4, 8 … days old and reach back about a year, at most 9 × 5 MB per account. They are the encrypted files as stored; the service reads none of them. The number of places is set with `-backup-slots` (0: none).

Every browser keeps the same rotation of its own, once a day for each journal, as encrypted files in its database (IndexedDB), so that someone who works offline for weeks still has staggered states. The journal dialog lists both, newest first: *Download* gives the encrypted file, which *Work locally* opens; *Restore* (the owner, two taps) replaces the journal with that state. The other devices then notice entries that are missing now and may add them again (6.4a).

When a journal is deleted, its backups go with it: on the server after the 7 days, in every browser as soon as it learns of the deletion.

### 8.4d Further servers

The owner can name further servers for a journal, one meta line each: `Server: <https address> #type-meta` (decisions 6.4, stage 1). Adding one in the journal dialog tests it (`GET /health`), copies the whole journal there with `PUT /journal`, and then writes the line, so that every member's device learns of it at its next synchronisation. Every device that may write appends each new line to every further server after the main server took it; lines a server did not take wait in a queue per server, kept in the browser, and are sent at the next synchronisation. After a compaction or a restored backup the owner's device copies the whole file again. Deleting a journal and undoing that reach every server. The servers know nothing of each other; the client alone decides where the data goes. Reading stays with the main server; reading from another one when the main server fails is stage 2. Removing a server closes its line; the copy there stays until its owner deletes it there.

### 8.4a Members of a journal

Everyone who shares a journal uses its token, so the service cannot tell people apart. To give whoever holds a journal an idea of who else uses it, every request carries a member ID:

- **Member ID** = HMAC-SHA256 over the journal's account ID (hex), keyed with SHA-256 of `"outheis-agenda/member"` followed by the enc key of the person's own default journal. The service never sees that key. The ID is the same on all devices of a person, different for every journal, and it cannot be traced to the person's account or to anything about the journal (whose name the service does not know anyway).
- **Service.** Per journal it keeps the member IDs with the minute of their last use (reads of a non-empty journal and writes), at most 200, dropped after 30 days without use. By default only in memory: after a restart the count starts anew, and `GET /members` says since when. With `-members-dir <dir>` the tables are also written there (one file per journal, every minute when changed) and read back at start. The full ID is never returned, only its first 16 hex characters.
- **Anonymous member ID.** 64 zeros: a client that only looks whether a journal exists, before the person has decided to use it (setup, `ui.md` 4.11a), sends it; the service serves the request but does not count it.
- **Client.** The journal dialog shows "You and n other people, counted since …" with the last use of each; the own ID is recognised, the others are not named.
- **Limits.** It counts people, not devices, and it is an indication, not proof: a modified client can send invented IDs and so inflate the number, but only with the journal's words. Checking that an ID belongs to a real account would require the service to see the account and so to link the person's journals; that is ruled out. The account ID of the default journal is not used for the same reason: the service could otherwise see who shares with whom.

### 8.5 Merging and compaction in the client

**Merging.** A client fetches the file, decrypts it, merges its outbox per Section 7 locally, encrypts the resulting new lines and appends them with `POST /append`. Confirmation follows 7.7: a line counts as confirmed when it appears in the fetched file. Lines that cannot be decrypted (wrong key, truncated) are kept in the file, never dropped, and reported to the user.

**Compaction.** Any client may compact; no client is designated, and the service does not need to know that compaction took place. A client compacts when all of the following hold:

1. it is past the compaction time of the day (default 04:30 local time) and the client has not compacted on this day;
2. the decrypted journal contains superseded versions or `#done` entries older than the retention period;
3. its outbox is empty.

It then computes the compacted journal (6.4), encrypts it, and replaces the file with `PUT /journal` and `If-Match` set to the `ETag` it compacted. If another client appended in the meantime, the service answers `412`; the client discards its result and tries again at its next sync. Several clients compacting on the same day are harmless, since compaction is idempotent. Lines that cannot be decrypted are carried over unchanged.

**Retention** (default 90 days) is a client setting. Clients with different settings are consistent in effect: the shortest retention of any compacting client applies.

### 8.6 Clients

**Web application** (Mac, iPhone, any browser; installable as PWA). On first use: enter the server URL, then either *new account* (the client draws and shows the phrase, and asks for two of the words back before continuing) or *existing account* (type the phrase). The phrase and the derived keys are kept in browser storage; the phrase can be shown again in the settings, to set up another device.

**Capture from an iOS Shortcut.** A shortcut cannot encrypt. It opens the web application with the dictated text in the URL fragment, `https://<server>/#add=<text>`; the web application puts the text into the input field, where it is seen and added with *Add* like a typed entry. Only an ordinary entry is accepted: a line that is a definition, a key, a pointer or another meta or private line, or that carries `#id`, `#rev`, `#moved` or `#done`, is refused with a notice, so that no link can change a journal's keys, definitions or entries (audit S1). The fragment is not transmitted to the service.

**Language models via MCP.** A local MCP module holds the phrase in the human directory of the computer it runs on (8.9), fetches and decrypts the file, and offers tools to a model client: list items for a period, add, update, close. Plaintext leaves the computer only as far as the model client sends tool results to its model provider, and only for the items queried. This replaces read access by URL and token.

**Any text source.** Pasted, photographed or hand-written lines are added through the web application's import (paste or file, with a preview before anything is kept) or through the MCP module.

**Account ID.** The account file on the service is named `hex(SHA-256(token))` (8.4). Every client can compute this ID from the phrase, also without a connection, and shows it in its settings. If the service is shut down or a user asks for their file, the user sends the ID, never the phrase; the operator finds `<ID>.enc` and sends it. The ID gives no access and does not identify the person.

**Persistence.** Clients ask the browser to keep their storage (`navigator.storage.persist()`), and *Export* builds the encrypted file from the local copy, so a journal can be saved even when the service is gone.

### 8.7 Local use without a service

A client must be able to work on the encrypted file directly, without any service:

- **Open a local file.** The web application opens a file of the format 8.3 from disk and, given the phrase, works on it like on a server account: merging, compaction and display are the same. Where the browser allows writing back (File System Access API, desktop Chromium browsers), changes are saved to the same file; elsewhere the client imports the file and offers the current state as a download.
- **Export.** Every client can save the current encrypted file at any time, as a backup or to hand it on.
- **Handing on a journal.** A journal is passed to another person as file and phrase. The recipient can use it with a single client on one computer, without ever contacting a service, or later attach it to a service by appending its lines to an account.

The iPhone is not a target for local file use; browsers there offer no writable file access.

### 8.8 Deployment

| Item | Value |
|---|---|
| Host | any Linux server |
| Domain | a domain or subdomain of the operator, here `agenda.example.org` |
| TLS | nginx as reverse proxy, certificate by certbot (Let's Encrypt); the service listens on `127.0.0.1:41380` only; step-by-step setup in `deploy/DEPLOY.md` |
| Process | systemd unit `agenda-service`, dedicated system user `agenda` |
| Data | `/var/lib/agenda/accounts/<account>.enc`, one file per account, and `<account>.seen` with the date of last access; nothing else |
| Key backup | none on the server; each user keeps their phrase |

Client endpoints:

| Client | Address |
|---|---|
| Web application | `https://agenda.example.org/` |
| iOS Shortcut | `https://agenda.example.org/#add=<text>` (opens the web application) |
| Model clients | local MCP module, configured with server URL and phrase |

Prerequisites: DNS record pointing to the server; ports 80 and 443 open.

### 8.9 Human directory

As in outheis (`~/.outheis/human/`), every user-specific file on a computer lives in one directory, the human directory. With the relay design, the service holds no human directory; it holds only encrypted files it cannot read (8.8). The human directory exists on the user's computers, for clients that run outside a browser (MCP module, command-line tools):

Location: flag `-human`, else environment variable `AGENDA_HUMAN_DIR`, else `./human` relative to the working directory. A visible directory, not below a dot directory.

| File | Content |
|---|---|
| `phrase` | the account phrase (8.2) |
| `config.json` | server URL, retention, compaction time |
| `agenda.enc` | local copy of the encrypted journal (8.3), also used for local use without a service (8.7) |
| `outbox.enc` | unconfirmed lines, encrypted |
| `rules/` | rules for weighting relevance and priority by a language model (open issue 7) |
| `prompts/` | the user's filled-in prompts (`docs/prompts/` holds the generic templates) |

`config.json`:

```json
{
  "server": "https://agenda.example.org",
  "retention_days": 90,
  "compact_at": "04:30"
}
```

Missing fields take the defaults. The vocabulary is not part of the configuration; it is carried by the journal (3.4). Deleting the human directory removes everything about the user from that computer.

The **web application** keeps the equivalent in browser storage: phrase, derived keys, local copy, snapshot and outbox. *Clear data in this browser* in the settings removes all of it; unsent changes are lost with it, the journal on the service is not touched.

### 8.10 Web application interaction

The complete interface specification (design tokens, components, interaction, ordering) is in `docs/ui.md`. Summary:

- **Groups and limits.** *Today* (including overdue items, at most 5), *Tomorrow* (5), *Next 7 days* (10), *Later* (days 8–30, 10). Items with a clock time do not count against the limit. Further items of a group are reached by expanding it; items after 30 days on request (*Show all*), without a further horizon. Every item appears exactly once, recurring items at their next occurrence. Details in `docs/ui.md`, 5.4.
- **Order within a group** (fallback without a weighting model): recurring items without a clock time, then items with a clock time by date and time, then the rest by `action:now`, rank (high, missing or medium, low), date. A missing rank means *not assessed* and counts as medium. The actual weighting of relevance across facets and times of day requires a language model and rules in the human directory; it is outside the static client (open issue 7).
- **Collapsed by default.** An item shows only its time or date, its text, the facet colour as a bar at the left edge, and short state markers in muted text (`action` value, `now` in Scarlet Fire, `high`, ↻ for recurring, `review` and *not synced* in Amber Flame). A chevron on the right expands the item to show all tags; the state is kept per item while the page is open.
- **Tags as chips.** In the expanded state, every tag of an item is shown as `dimension:value`, including those already reflected elsewhere (date, time), so each can be changed directly. `#id` and `#rev` are not shown.
- **Changing a tag.** Tapping a chip opens a list of the allowed values of that dimension (Section 4), plus *Remove tag*. Every value list and every input field has a close button (×) that leaves the tag unchanged. Dates offer today, tomorrow, next week, next month and a date picker; time accepts the three forms of 4.3.
- **Adding a tag.** A `+` chip lists only the dimensions the item does not have yet; choosing one opens its value list directly (two taps). The interface never creates a second tag of a dimension the item already carries; the `+` chip disappears when all dimensions are set.
- **Editing text.** Tapping the text makes it editable in place; Enter or leaving the field saves.
- **Swipe right.** Opens a choice: *Done* (sets `#done-<today>`) or *Reschedule* by relative steps or to another date; all `#date` tags of the item shift by the same number of days. For a recurring item the choice concerns its next occurrence: *Skip* it or *Reschedule* it (4.4b); *Delete series* closes the series.
- **Add field.** Accepts plain text without tags; tags can be added afterwards. If the new line has no `#facet`, tapping *Add* opens a choice of all facets as large buttons (with their colour); one tap adds the line with that facet; a field below, prefixed `#facet-`, takes a new facet, which exists once the line is written. With several journals the line is written to the journal of its facet (8.11). *Without facet* adds it unchanged (it then gets `#review-needed`), *Cancel* returns to the field. A dictation button uses the browser's speech recognition where available; the system keyboard's dictation works in any case.
- Every change is an edit of the working copy (7.7) and is synchronised in the background shortly afterwards.
- **Hierarchy.** Date and time ("when") are shown above the text in semi-bold, overdue in Scarlet Fire; inside the groups *Today* and *Tomorrow* only the time is shown. The item text leads (larger, medium weight); tags are secondary (smaller, muted) and start at one third of the item width. Tags are always displayed in the canonical order (3.2), the same order as in the stored line, so each tag has a fixed place; the `+` chip comes last.
- **Ergonomics.** All touch targets are at least 44 px high; text and chips are sized for phone use. On narrow screens, date and time move above the item text.
- **Visual identity.** Follows the outheis web interface: white surfaces, thin structural lines (0.5 px), no grey fills, colour only where it carries meaning; colours from the outheis colour system (`outheis-beta/webui/assets/colors.md`), typeface IBM Plex Sans, self-hosted (embedded in the page). Primary actions in Dark Amethyst; urgency (`action:now`, overdue) in Scarlet Fire; `review` and pending sync in Amber Flame; in-sync state in Teal.
- **Facet colours** are assigned in order of first use (3.4). Shown as a bar at the left edge of each item and as a dot in the facet chip.

### 8.11 Several journals and shared journals

A client can hold several journals at once: the user's own (the *default journal*) and any number of further journals, each an account of its own with its own phrase. A journal is shared by giving its phrase to the people who share it. The service is unchanged: it sees independent accounts.

- **Facets belong to journals.** A journal has the facets declared by its open `Tag definition:` entries (3.4) and those its open entries use. A name alone never decides the journal: the same name occurs in several journals as a matter of course (three children's journals with `sports`, `school`, `music`).
- **Same name, different facets.** Different people cannot be kept from choosing the same facet names (`family`, `sports`). A facet is therefore identified by journal and name. Where a name occurs in more than one journal, clients keep the facets apart internally (key `name@journal`) and show the journal's name next to the facet (`familie · Familie`), with separate colours and filters. The lines in the journals keep the plain tag `#facet-<name>`; nothing is added that would have to be removed when writing back.
- **Choosing.** Wherever a facet is chosen (tag menu, facet choice, import), each choice is a facet of one journal, shown with the journal's name as a small label (`ui.md` 4.7). Choosing the first facet of an entry from another journal moves the entry there; the current facet is also offered in every journal that does not have it yet ("<journal>, new here").
- **Typed names.** A facet name typed without a choice (add field, `#add=` capture, imported lines) goes to the current journal if no journal has it, and to the one journal that has it if that journal is the user's own (`own`, or the default journal). Otherwise — several journals have it, or only one the user has joined — the client asks, offering those journals and the default journal, where the name becomes a facet of its own. Where nobody can be asked (import, capture), the default journal is used. Nothing is ever moved automatically: an entry stays where it is until the user chooses otherwise.
- **Moving** an entry closes it in its journal (`#done-<today>`) and adds it to the other journal with the same `#id` and a new `#rev`, so that references (`#ref`) stay valid.
- **No conflict.** Two journals declaring the same facet are not in conflict; the facets are kept apart as above. Renaming a tag value (`ui.md` 4.11e) remains available: it rewrites every entry of the chosen journals that carries the value, Tag definitions included, each as a new revision; if the new value exists, both are merged.
- *Superseded:* an earlier version of this section required facets to be unique across journals and blocked new entries on a conflict (see `decisions.md`, 5).
- **Views** show the entries of all journals together; facets, filters and print span all journals. Entries from a journal other than the default carry its name. The text view shows one journal at a time.
- **Local file mode** (8.7) holds only the default journal.
- **Rights.** Everyone with the phrase can read and write; compacting is no further right, since whoever can write can also replace the file. Read-only access and deleting by the owner alone are not enforced; the design is 8.11e.
- **Storage in the browser.** The default journal uses the keys `agenda.*`; a further journal uses `agenda.j.<id>.*`, where `<id>` is the first 12 hex characters of its account ID.

### 8.11a The journal list of an account

Which further journals belong to an account is part of the account, not of a browser: every client of the account shows the same journals.

- **Key lines.** Each further journal is recorded in the default journal as `Journal key: <journal id> <own|joined> <eight words> #type-meta` (`<journal id>`: the first 12 hex characters of its account ID). The line is encrypted like every other line; the service sees nothing new and stores nothing besides the journal file.
- **Adopting.** After each sync of the default journal, a client adds every journal with an open key line that it does not hold (it derives the keys from the words and checks that they give the journal id), and removes every journal it holds whose key lines are all closed. A journal held in the browser without any key line (added by an earlier version) is entered with role `joined`.
- **Removing** a journal (*Remove from my journals*) closes its key line and its alias line; every client of the account then removes it. The journal stays on the server.
- **Owner.** `own` marks a journal the user created (*Create a new journal*); `joined`, one added with someone else's words. Only for `own` is *Delete on server* offered. Whoever shares a journal holds the same keys and could delete it as well; the rule is kept by the client and cannot be enforced by the service, which does not know who created a journal (`decisions.md`, 5). Journals added before roles existed are `joined`; the user can mark them as their own.
- **Deleted by the owner.** The service answers a deleted journal with an empty file. A client holding a `joined` journal that had content and now comes back empty marks it as deleted by its owner, stops syncing it and keeps the last state for export; it does not send to it again, so it does not create the journal anew. Before sending to a `joined` journal, the client fetches it first for this check. A journal that never had content cannot be told apart from a deleted one.
- **Not shown.** Key lines are hidden in the text view and the manual edit (where they are kept unchanged on save) and are left out of the plain-text export; the encrypted export contains them. They carry `#type-meta` and need no facet, like the other meta lines.
- **Consequence.** Whoever knows the phrase of the default journal can read the phrases of all journals of the account, including those others have entrusted to the user; hiding the key lines in the client does not protect them. 8.11e removes this by keeping them in private lines that only the user's devices can read.

### 8.11e Private lines, ally codes, read-only access and deletion by the owner

The phrase of a journal today gives everything: reading, writing, deleting, and every private line in it, among them the phrases other people have entrusted to its owner. Sharing the default journal hands those out, and every ally can delete a shared journal. The aim: one file per journal as before, nothing more on the server, and four levels of access (owner; ally, who may read and write; guest, who may only read; and no access), each enforced by the keys or by the service, not by a rule of the client.

**Derivation.**

```
phrase ─┬─► P   private key           (the owner's devices only)
        ├─► M   ally secret, 11 bytes ─┬─► K   journal key (decrypts the ordinary lines)
        │                               └─► W   write token ─► R   read token
        └─► D   delete token          (the owner only)

F       = the first 11 bytes of SHA-256(D)     (fingerprint, not secret)
account = SHA-256( F ‖ SHA-256(R) )
```

- `master = PBKDF2-HMAC-SHA256(phrase, salt = "outheis-agenda/v2", 600000)`, as 8.2 with a new salt; `P`, `D` (32 bytes) and `M` (11 bytes) = HKDF-SHA256(master, info `outheis-agenda/v2/private`, `…/delete`, `…/ally`); `K`, `W` = HKDF-SHA256(M, info `outheis-agenda/v2/enc`, `…/write`); `R = HMAC-SHA256(W, "outheis-agenda/read")`. Each step is one-way: `M` gives neither `P` nor `D`, `R` does not give `W`, `F` does not give `D`.
- **Reading** sends `R` and `F`; the service computes the account ID from both. **Appending** sends `W` (from which the service computes `R`) and `F`. **Replacing** the whole file sends in addition `X-Agenda-Owner: <D>`; the service accepts it only if the fingerprint of `D` is `F`. So an ally can only append: it cannot shorten the journal or drop the owner's private lines (audit S2). **Deleting** sends `D` itself and `SHA-256(R)`. The headers are in 8.4. `F` has 88 bits: finding another `D` with the same fingerprint takes about 2^88 hash computations.
- **Ally code:** `M ‖ F`, 176 bits, written as 16 words (11 bits each, no checksum) of the list chosen on the device; the same code can be written in every list, and a client reads it in the first list (English first) that holds all its words. **Guest code:** `g1.` followed by base64url of `K ‖ R ‖ F` (75 bytes), for a link or a QR code. Eight words are the phrase of a version 1 or 2 journal: with a known journal id the id decides; when a journal is added, a version 2 journal is recognised by its file on the service (it is never empty). While version 2 is tested, new journals are version 1 unless *Version 2* is ticked when creating one (a switch in the *Add journal* dialog); *Stop sharing* keeps the version of the journal it replaces.

| Level | Holds | Can | Code |
|---|---|---|---|
| Owner | the phrase | everything, including private lines and deleting | 8 words, the user's own devices |
| Ally | `M` and `F` | read and write the ordinary lines | 16 words (88 + 88 bits) or a QR code |
| Guest | `K`, `R` and `F` | read the ordinary lines | QR code or link |

- **Private lines.** Lines that concern the owner alone are encrypted with `P` instead of `K`, in the same file: key lines (8.11a), aliases, overlays (8.11c), add-on functions such as the experiment (`ui.md` 4.14b). An ally's or guest's client leaves lines it cannot decrypt untouched and writes them back unchanged when compacting, as it does today with any line it cannot read (7.4). What an ally can learn about them is their number, size class and time of writing, not their content.
- **Key lines hold ally codes.** A journal someone else gave the user is entered with what was given (an ally code or a guest code), never with its phrase: the user never holds more than was given. Journals the user created are entered with their phrase, so that every device of the user is their owner.
- **Deleting** is offered only where the phrase is held, and the service refuses it to everyone else; the role `own` (8.11a) then follows from the keys instead of being a mark.

**Operations by level.** What each level can do with a journal of version 2; "client" means the web client offers it, "server" that the service enforces it. Whoever holds a code can pass it on: an ally can give the ally code and the guest code, a guest the guest code; this cannot be prevented.

| Operation | Owner | Ally | Guest | Enforced by |
|---|---|---|---|---|
| Read the ordinary lines (entries, definitions, name) | yes | yes | yes | key `K` |
| Read the private lines (key lines, aliases, overlays, add-on functions, handover secrets) | yes | no | no | key `P` |
| Add, change, close entries; Tag definitions, name, *Fixed dates* | yes | yes | no | server (`W`) |
| Write private lines | yes | no | no | key `P` |
| Compaction, taking up lines without id (6.4) | yes | yes | no | server (`W`) |
| *Pass facets*: into the journal / out of it (8.11d) | yes / yes | yes / yes | no / no | client |
| See who uses the journal (8.4a) | yes | yes | yes | server (`R`) |
| Export the journal file (encrypted) | yes | yes | yes | server (`R`) |
| Show the phrase | yes | no | no | holds it or not |
| Show the ally code | yes | yes | no | holds it or not |
| Show the guest code | yes | yes | yes | holds it or not |
| *Stop sharing* (new words, all codes void, 8.11b) | yes | no | no | client; old journal deleted with `D` |
| *Hand over* to another owner (8.11i) | yes | no | no | client |
| Take over (with a handover code) | — | — | — | whoever holds the code |
| Delete the journal on the server | yes | no | no | server (`D`) |
| Remove the journal from one's own list | yes | yes | yes | client, local |

For version 1 every holder of the phrase is owner. Upgrading (8.11h) is offered to the user who created the journal.

**When the owner is gone.** Allies keep everything except the private lines, deleting, *Stop sharing* and handing over; the journal stays fully usable. Deleting is then left to the administrator of the server, who can remove the file `<account>.enc`. Every browser then keeps the last state and writes nothing; owner and allies can restore the journal from it (6.4a).

**State of the implementation (since 0.6.0, merged from the branch `accounts-v2`).** Done: the service (8.4) and, in the web client, the derivation, ally and guest codes (*Ally code* and *Guest code* in the journal dialog, as text and QR code; added through *Add journal* or by scanning), the requests of each level, a guest's journal only read (no sending, no compaction, entries not editable, not offered as a place for new entries; touching one of its entries, or the Text tab, says *You read this journal as a guest; it cannot be changed here*), deleting and *Stop sharing* only for the owner, new accounts and new journals of version 2, version 1 still on request (*Add journal → Create*, a box for people with clients before 0.6.0). Private lines: done (encrypted with `P` in version 2 journals; read with the journal key first, then with `P`; an ally's or guest's client keeps them unread and unchanged, also when compacting, and logs them instead of showing a notice). They take effect once the default journal, which holds them, is version 2. `Journal id` (8.11f): written in version 2 journals by the first client that may write; of several, the one with the smallest entry id holds; not yet in version 1 journals, whose released clients would show the line. References still use the account-derived id. Upgrade of version 1 journals: done (8.11h). Journal version: 0.6.0 for version 2 journals (3.7).

**Conversion.** The derivation of `K`, `W` and the account ID changes, so existing journals move once into a new account, as *Stop sharing* (8.11b) already does: the content with ids and revisions (and its `Journal id`, 8.11f) is written into a new journal under the new derivation, the old account is deleted on the server, the clients add the new journal again. In the default journal, key lines and the other private lines become private lines on the way; whoever had its phrase loses access to them with the old account. Phrases the user already handed out with it cannot be taken back; the conversion offers to convert those journals too. The journal version (3.7) marks the new derivation.

### 8.11f Journal identity (version 2 journals)

The account ID identifies the file, not the journal: it changes with every conversion and *Stop sharing*, and nobody can compute it without the keys. A journal therefore gets an identity of its own, as a line in it:

```
Journal id: <uuid> #type-meta
```

- Written by the first client that may write and finds none (in practice right after a journal is created); for now only in version 2 journals. If two clients write one at the same time, the one with the smaller entry id holds, as for duplicate definitions (3.4).
- Carried along by every conversion and *Stop sharing*: the journal keeps its identity when it moves to a new account.
- Not secret: knowing it gives no access.
- References to a journal (overlays 8.11c, tombstones 8.11d, `name@journal`, aggregators 8.11g) use it instead of the account ID once it exists.

### 8.11g Aggregators (concept, not implemented)

An aggregator collects entries of several journals into one journal that others subscribe to, so that one code gives the combined view (for example the sports of three children). The relay service stays as it is: it cannot read journals and cannot combine them.

- **A bot does it** (8.12): a client that is always running, on the user's own machine, with read access to the source journals (guest codes, 8.11e) and the phrase of the aggregator journal. Which journals, or which facets of them, it collects is its configuration; it contains access codes and is kept in private lines of the aggregator journal.
- **The aggregator journal** names each source in a line `Aggregated journal: <journal id> #type-meta` (8.11f). A journal with at least one such open line is an aggregator; no further mark is needed (`Journal type:` stays for fixed or mixed dates, 5.5).
- **It mirrors revisions:** a new revision in a source is written into the aggregator with the same `#id` and `#rev` and `#from-<journal id>` of its source; an entry closed or moved in its source is closed there.
- **Read-only projection.** Subscribers get a guest code; changes are made in the sources. Writing back from the aggregator into the sources is not intended.
- **One level only.** An aggregator does not take another aggregator (a journal with `Aggregated journal:` lines) as a source; `#from` and the list of sources therefore always name the journal an entry was written in, and no cycle can arise.
- **Duplicates.** A client that holds a source both directly and through an aggregator recognises it by the journal id and shows each entry once, from the source. Entries of an aggregator are exempt from the repair of moved entries (8.11d), which would otherwise take the shared id for a move cut short.
- **Trust.** The machine running the aggregator holds read access to every source; it is the one place where access codes are kept permanently.

### 8.11b Stop sharing

Everyone who shares a journal holds the same keys, so a journal cannot be withdrawn from others; it can only be replaced. *Stop sharing for anybody* (offered for `own` journals) does this in one step:

1. The journal is synchronised, so that nothing of it is pending.
2. A new journal with new words is created, and the current state of the old one is written into it as it is, with all ids and revisions (closed entries included, until compaction).
3. Its key line is written into the default journal and the alias, if any, moves to it; every device of the account adopts the new journal (8.11a).
4. The old journal is deleted on the server and its key line closed; every device of the account drops it.

Whoever shared the old journal sees it as deleted by its owner (8.11a) and keeps the last state in their browser; what they have seen cannot be taken back. Individual members cannot be excluded: whoever should go on sharing gets the new words (or the QR code) again. Lines of the old journal that could not be decrypted are not carried over.

### 8.11c Tag overlays

A user may want to classify entries of another journal in their own terms, for example give the music, school and sports entries of each child's journal the facet `family` as well, without the others seeing it. Such tags are kept as an overlay in the user's own default journal:

```
Tag overlay: <journal id> <entry id> #facet-family #topic-music #type-meta
```

- One line per entry; facets and topics only (up to three each). They classify and add to the entry; they cannot contradict it. Date and time are not overlaid: a preparation or reserved time is an entry of its own with `#ref-<id>` to the appointment (4.10b).
- Adding a facet or topic with `+` to an entry of a journal other than the default writes the overlay instead of changing the entry. Entries of the default journal get further tags directly.
- Clients add the overlay tags to the entry for the user's views: chips (dashed border, "only you"), facet bar, filter and counts. Changing or removing such a chip changes the overlay. Nothing is written to the other journal.
- The overlay refers to the entry's `#id`, which stays the same across all its revisions; renaming the text or changing its tags does not affect it. The overlay loses its entry when the entry is closed or deleted, when it is moved to another journal (it gets a new id there) or when the journal is removed; a client then closes the overlay after the next sync, once that journal has been read.
- Overlay lines are meta lines (`#type-meta`), no facet needed, never shown as entries; renaming a tag renames them too. They do not reserve a facet.
- A facet given by an overlay is the user's own facet (one of the default journal), not one of the journal the entry is in: the facet bar, the filter and the counts treat it so.

**A whole journal.** To classify every entry of another journal at once, for example give all entries of each child's journal the facet `family`, a single line suffices:

```
Journal overlay: <journal id> #facet-family #type-meta
```

- Facets only (up to three); it applies to every open entry of that journal, also to those added later, and to none of its definition lines. An entry overlay of the same entry adds to it.
- Set and removed in the journal's dialog (*For you only: every entry of this journal also has the facet*): the user's own facets as value buttons (ui.md 2.3b); tapping the chosen one again removes it. Its chips have the dashed border like other overlay chips; tapping one opens that dialog, since it cannot be changed for one entry alone.
- Removing the journal closes the line after the next sync.

### 8.11d Moving entries and facets between journals

An entry lives in one journal only. Moving it keeps its `#id` (references and overlays stay valid) and gives it a new `#rev` in the new journal. What remains in the old journal is a **tombstone**: the text `moved`, `#done-<date>`, `#moved-<journal id>`, the same id and a newer revision, nothing else. It keeps devices that still hold the old revision from bringing the entry back; search, counts and history pass over it, and compaction removes it after 30 days (instead of the retention period of closed entries).

**Order and repair.** A client that finds the same id open in two journals keeps the newer revision, once its journal has it from the server, and turns the older one into a tombstone. A move cut short between the two journals, or an old copy sent again by a device that was offline, is so repaired at the next sync. The same id with the **same revision** in two journals is not a move but a copy (an upgrade 8.11h, a handover 8.11i): it is left alone, since a move always writes a new revision.

**Wrong tombstones (0.6.4).** Clients before 0.6.4 took the copies of an upgrade for a cut-short move, on devices that saw the old and the new journal side by side, and closed one copy of every entry, the name line included. A client now restores a tombstone whose entry exists in no shown journal: one pointing at a journal not shown (an upgraded one), at its own journal, or at a shown journal that holds no line of that id. The last revision before the tombstone comes back under a new revision, and the user is told. As long as such tombstones exist, the journal is not compacted, so that the revisions needed stay on the server. Surplus `Journal version` lines left by that loop (each closed line was written anew at the next sync) are closed at the next sync: one per journal stays, the highest version, on a tie the older id.

**Passing facets.** In the dialog of a journal, *Pass facets* moves one or several facets of other journals into it. Facets pass between journals one may write: one's own and those shared as ally (in version 2, 8.11e), so that a family journal shared by everyone with the same rights can give and take facets too; a journal read as guest is neither offered as target nor as source. When the target belongs to someone else, the dialog says that the entries passed belong to it and its owner can change or delete them. The move:

- Of each chosen facet move its tag definition and every entry, open or done, whose **first** facet it is; further facets of such an entry go with it as tags (without their definitions; a facet left without definition is handled as any other, 8.11).
- The receiving journal gets a definition of each chosen facet, also of one that was only used, not declared, where it came from; otherwise a definition of the same name in a third journal would claim the facet.
- An entry that carries a chosen facet only as a further facet stays where it is and loses that facet. Afterwards the old journal holds neither the definition nor any entry of the facet, only tombstones.
- The new journal gets everything first and sends it; only when the server has it are the tombstones written and the facets stripped. If it cannot be sent, nothing is changed anywhere.
- Saved filters, the order of the facet bar and the experiment's scores (ui.md 4.14b) follow the facet to its new journal. A facet that an overlay of the user uses (8.11c) cannot be moved until that overlay is changed.
- A preview names what moves, what stays and loses the facet, and that whoever shares only the old journal will no longer see the entries. One step to undo, as long as nothing has been synchronised since.

### 8.11h Upgrade from version 1 to version 2

A journal of version 1 is upgraded by copying it into a new journal of version 2. The new journal gets new words: whoever knows the old ones, because the journal was shared with them, is not its owner, and gets access only through a code the owner passes on (8.11e).

- **Who.** The journal dialog offers *Upgrade to version 2* to the owner of a version 1 journal: the default journal, and journals the user created (`own`). For journals shared with the user it is not offered. A modified client could still copy a shared journal; it would only get what it can read anyway, and no access to the owner's new journal.
- **Copy.** Every stored line goes to the new journal with its id and revision, closed entries included; the client checks that the server holds them all before anything else changes. Private lines (8.11e) are encrypted with `P` there, among them the key lines of the default journal, which in version 1 every holder of its words can read.
- **Pointer.** The old journal gets one line, `Journal upgraded: <guest code> #type-meta`, and is otherwise unchanged. It is encrypted with the old journal key, so exactly those who know the old words can read it, and it gives them only reading. Clients of version 0.5.0 do not show it and go on using the old journal.
- **Opening with the old words.** A client that reads a version 1 journal with a pointer puts the new journal in its place: if the journal list of the account holds a key for it (the owner's other devices), with that key; otherwise as guest, with a notice. In the journal dialog of a journal read as guest, *Ally code or phrase of this journal* takes a stronger code; it must open the same journal. Other devices of the account take the new code over from the key line. Where the journal list holds several keys for one journal, the strongest counts (phrase, then ally code, then guest code), and a device takes a key over only if it opens more than the one it has: nobody is ever set back. A device whose default journal is still the old one of an upgraded account does not take journals as guest; it waits until the new words of the default journal are entered, since the keys of the new journals lie there.
- **The default journal.** Upgrading it makes the new journal the default journal of the device; the old one is kept as an upgraded journal of the account. Another device of the account sees the pointer in its default journal and asks for the new words, in the dialog of the default journal; until they are entered there, what it writes in the old journal is carried over by the device that upgraded. As the member ID (8.4a) is derived from the key of the default journal, it changes with the upgrade: in the counts of members, the same person appears once more for up to 30 days.
- **Carrying over.** The old journal stays on the server, hidden, and is read at every synchronisation. What the new journal lacks is appended there: of every entry the current line, when its id is missing in the new journal or has an older revision there. Entries that compaction would drop are left out, so that they do not come back every day; lines without id are given one in the old journal first (6.4). So an upgrade can be repeated at any time without doubling anything, and what clients of version 1 still write arrives in the new journal.
- **Forgotten words.** As long as the old journal is on the server, its old words still give the content: `agenda-cli` (or `agenda-cli-v1`) prints the old journal with them, and its line `Journal upgraded: <guest code>` gives the guest code, with which `agenda-cli` prints the new journal as well; the lines can then be appended to a fresh journal (`agenda-cli <server> add -strip-ids`). Deleting the old journal ends this way back; whoever relies on it keeps the old journal, or deposits the new words.
- **End.** The dialog of the new journal shows who still uses the old one (8.4a), and offers its owner to delete it on the server. With it the pointer goes.

### 8.11i Handing a journal over to another owner

Owner is whoever knows the words of a journal of version 2; whoever only passes them on stays owner. A journal is therefore handed over by copying it under words that only the new owner knows.

- **Handover code.** In the dialog of a further journal of version 2, its owner is offered *Hand over to someone else*. The client makes a secret `T`, keeps it as a private line of the default journal, `Journal handover: <journal id> <T> #type-meta`, and shows the handover code: `"h1." + base64url(M ‖ F ‖ T)`, that is the ally secret of the journal (8.11e) and `T`, as text and QR code.
- **Taking over.** The new owner enters the code under *Add journal*, or, without a journal of their own yet, in the setup under *Take over a journal*; then the journal becomes their default journal. Their client makes new words, copies every line it can read with the ally keys into a new journal under them, ids, revisions and closed entries included, and checks that the server holds them all. Private lines of the former owner cannot be read with the ally keys and are not handed over. The new words are shown once.
- **Confirmation.** The new owner's client appends to the old journal `Journal handed over: <ally code of the new journal> #type-meta`, encrypted with `T`: only the former owner can read it. Their client finds it at the next synchronisation, adds the new journal as ally, closes the handover line, and says that the old journal can now be deleted on the server.
- **Until the deletion.** The new owner's client keeps the old journal hidden and carries over what is still written in it, as after an upgrade (8.11h). While both exist, the former owner's client does not treat the entries they share as moved (8.11d). When the former owner deletes the old journal, the new owner's client says that the takeover is complete.
- **Withdrawing.** Until it is taken, a handover can be withdrawn: the handover line is closed, and a confirmation written with its secret is no longer looked for. The code given out remains an ally code of the journal until *Stop sharing*.
- **Others.** Allies and guests of the old journal lose access with its deletion; the new owner gives them new codes. A journal of version 1 is upgraded first (8.11h). The default journal is not offered for handing over.

### 8.11j Another default journal

The default journal is the account: its words set up a device, and it holds the private lines (`Journal key`, `Journal alias`, `Journal overlay`, `Tag overlay`, `Addon function`, `View`, `Journal handover`). Any journal of version 2 that the user owns can take its place (*Make this my default journal*):

- The client sends both journals, copies the open private lines of the default into the chosen journal under new identities (except its own key line), adds a key line for the former default (`own`) and closes any earlier pointer there.
- In the former default it closes these lines and appends the private line `Default journal moved: <journal id> #type-meta`; the key line of the new default stays open beside it.
- This browser then swaps the two: the former default becomes an own journal of the list; former version 1 journals that pointed to the default point to it by id; facet keys `name@journal` in the facet filter are dropped.
- Another device, which still signs in with the old words, finds the pointer at its next synchronisation and swaps the same way, with a notice. A device set up later with the old words follows likewise, as long as the former default exists.
- Only the owner of a journal of version 2 can make it the default: its private lines would otherwise be readable by everyone who shares it.

### 8.12 Bots: proposals, comments, learned rules

A *bot* is a program that reads a journal and writes to it on its own, typically once a night: a language model behind the command-line or MCP client (8.6), started by cron or by the scheduler of the host that runs it. Rule-based tidying (duplicates, order, compaction) is not a bot; every client does it (8.5).

**Principles.** Bots follow three rules adapted from Isaac Asimov's Three Laws of Robotics (first stated in the short story "Runaround", 1942; collected in *I, Robot*, 1950):

1. A bot does not harm the journal or its users, nor, by doing nothing, allow harm: it never removes, changes, moves or hides what a human wrote, and it reports what it cannot handle instead of dropping it.
2. A bot acts only with the consent of the human: everything it writes is a proposal, a question or a comment, and takes effect only when a human accepts it — except where this would conflict with the first rule.
3. A bot keeps its own working state (its learned rules, its configuration) intact, as long as this does not conflict with the first or second rule.

**What a bot writes.** Only new entries carrying `#source-bot`:

- *Proposal of a new entry:* an ordinary line with `#source-bot`. It appears in the views marked as a proposal, with *Accept* and *Reject*.
- *Proposal of a change:* a line with the complete proposed content and `#ref-<id>` of the entry to change, e.g. a facet or a rank. Shown under that entry.
- *Question or comment:* a line whose text begins with `> ` and carries `#ref-<id>` (or no reference for a general question). A human answers with a line of the same form without `#source-bot`. Comments never appear as items of their own; they are shown under the entry they refer to and are closed with `#done` when settled. The `>` follows the annotation convention of outheis-beta, where lines starting with `>` address the model.
- *Learned rule:* `Learned Rule: <rule> #source-bot #type-meta`. A rule takes effect only once accepted (`#source-mixed`); the human can edit or close it like any entry. Bots read the accepted rules of a journal before they run.

**Decisions.** *Accept* on a new-entry proposal changes its source to `mixed`. *Accept* on a change proposal writes the proposed content as a new version of the referenced entry with `#source-mixed` and closes the proposal with `#done` and `#decision-accepted`. *Reject* closes the proposal with `#done` and `#decision-rejected`. Accepted and rejected proposals are the material from which a bot learns; they disappear with the retention period like every closed entry.

**Enforcement.** A bot holds the phrase of the journal and could technically write any line; the service cannot tell bot from human. Clients therefore check on every merge: a line with `#source-bot` whose `#id` belongs to an entry whose current version is `human` or `mixed` (a change of a human entry by a bot), or a `#source-bot` line with `#done` on such an entry, is not applied but moved to the quarantine with a notice. The check makes a violation visible and ineffective; it cannot prevent a deliberately rogue program, which is why the phrase is given only to bots one trusts.

**Reliability.** What a bot proposes is a guess; its value shows only in use. The decisions recorded in the journal make its hit rate measurable: accepted versus rejected proposals per kind.

### 8.13 Calendar files and other calendars

Many people keep appointments in several calendars (work, private, a provider such as Proton) that do not share data with each other. The agenda can be the common place for all of them: calendar files can be read in and written out by every client, and the service plays no part, so no administrator's block on calendar subscriptions affects it.

- **Import** (implemented, web client): one or several `.ics` files, or pasted calendar text. Each `VEVENT` becomes an entry: `SUMMARY` (with `LOCATION` in brackets) as text, `DTSTART`/`DTEND` as date or two dates and time or span in local time (`TZID` zones are converted, unknown zone names such as Windows names are read as local time), `RRULE` as `#recurring` where the grammar can express it exactly (daily; weekly with weekdays; every second week on one weekday as `biweekly`; monthly with days of month; yearly), otherwise imported once with `#review-needed`. Not imported: cancelled events, changed single occurrences of a series (`RECURRENCE-ID`), events in the past, series that have ended. Each entry gets `#cal-<hash>` (4.10d); a repeated import updates text, dates, time and repetition of the entry with the same hash and leaves its facet and other tags alone. The facet is chosen in the preview, for all entries or per entry.
- **Export** (implemented, web client): open entries of the selected facets within a period, as one `.ics` file (`UID` from `#id`, timed events in UTC, entries without a clock time as whole-day events, `#recurring` as `RRULE`, facet and topic as `CATEGORIES`). Bot proposals, definitions and comments are not exported. The file is plain text.
- **Subscribing to other calendars** (planned for v2, decisions 6.9): a journal can follow a subscription address (an `.ics` URL), for example a school calendar. The service never fetches or passes on a feed; only a client that holds the key does, and any device that runs now and then is enough, since importing is idempotent through `#cal` (4.10d).
  - *Where it is kept.* An encrypted meta line `Subscription: <https address> #type-meta` in the journal, so that the address (often with an access token) stays hidden from the service; with it the time of the last run, so that not every device fetches daily.
  - *What a run does.* New events are added, changed ones updated, events gone from the feed or cancelled are closed (never deleted). The rules of the import above apply otherwise.
  - *In the browser* the web client can fetch a feed only if the provider allows it: an `https` address (`webcal://` is rewritten), the header `Access-Control-Allow-Origin` (`*` or the agenda's origin) on the answer and on every redirect, and access by the address alone (a token in it is fine; no login, cookie or password prompt). The web client fetches at most once a day when opened. *Test feed* checks address, answer, calendar and number of events line by line and names the cause of a failure, in particular a provider that refuses web pages.
  - *Outside the browser* nothing of the provider is required: the CLI (`agenda sync-feeds`, for cron or launchd on a notebook or a server, with an ally code for this purpose only) or a native shell around the web client on a phone, which is not bound by CORS.
  - *To be built:* the reconciliation of a feed with a journal in `agenda-core.js` (add, update, close); the meta line and the time of the last run; in the web client the subscription with *Test feed* and the daily run; in the CLI ICS reading and reconciliation in Go and `sync-feeds`; optionally the native shell (signing, build, distribution: a project of its own). Built together, so that the format is tried on both paths before journals hold subscriptions.
- **Other calendars subscribing to the agenda** (open, affects the trust model): a calendar program fetches a subscription address in plain text, and the service holds only encrypted lines (8.1). Either a client publishes a plain-text feed of selected facets under a secret address on the service, on the user's explicit request, so that for this content the end-to-end encryption no longer applies; or the feed is served from a computer of the user's own, reachable only while that computer is. To be decided.

---

### 8.14 Storage in the browser and the PIN (0.7.0)

The web client reads and writes everything it keeps through one storage layer (`LS`, defined in the boot script before the app). With a PIN, every entry is compressed (`deflate-raw` where the browser has `CompressionStream`), encrypted with AES-GCM under a key derived from the PIN (PBKDF2-SHA-256, 600 000 rounds, random 16-byte salt) and stored under `agv:<name>`; the app itself is a script of type `text/plain` that the boot script starts only once the PIN has opened the store, so nothing of it runs on plain data. Plain stay only `agenda.pin` (salt and an encrypted check value), `agenda.pinWait` (failed attempts), `agenda.vkeep` (the key, with the silent PIN only) and display settings (`agenda.compact`, `agenda.minimal`, `agenda.month`, `agenda.fbar.open`).

- The PIN has six to twelve digits and is required on every device (0.9.21). It is chosen once an account exists: at the end of the setup, or at the first start of an installation from before 0.7.0, or of one whose PIN was switched off before 0.9.21, whose plain data is then encrypted and removed. Any PIN is accepted.
- Words and codes (phrase, ally and guest code, QR code, handover code) are shown only after the PIN, unless it was entered in the last five minutes.
- When the PIN is asked for depends on the level in `agenda.pin` (0.8.4): *Once per session* (`level: "session"`, the default and what installations from before become) keeps the derived key in `sessionStorage` (`agenda.vk`) after the PIN was entered, so that reloading and coming back from the background open without it; the browser drops `sessionStorage` when it ends the session, at the latest when the device restarts. Whether closing a tab or swiping the browser away ends it differs between browsers; Safari on iOS may restore a closed tab together with its session. *Every time* (`level: "strict"`) keeps no key: the PIN is asked for at each opening, and after five minutes in the background the page reloads and asks. *Silent PIN* (`level: "silent"`, 0.9.21) keeps the key in `localStorage` (`agenda.vkeep`): the app opens without the PIN, the store stays encrypted, but whoever uses the device can read it, since the key lies beside it. Words and codes still need the PIN. The key is derived as extractable for this; it never leaves the browser.
- After five wrong attempts the app waits one minute, then twice as long each time. This holds in the app only: whoever reads out the storage can try PINs elsewhere, which PBKDF2 slows but does not prevent; a longer PIN helps.
- *Forgot PIN* clears the browser; the journals on the server are untouched, changes not yet sent are lost.
- For a device several people use, the silent PIN takes the place of switching the PIN off, which existed until 0.9.20; the app says plainly what it leaves unprotected. Whether that is sensible depends on what the device holds, which the app cannot judge: the documentation recommends guest or ally codes only on such devices. Only the click dummy runs without a PIN.
- The storage layer is the one place a native client replaces, there with a key in the hardware keystore, which limits attempts itself.


### 8.14a Several persons in one browser (0.9.20)

Several people may use one browser, as is usual in a family (ui.md 4.11e). Each person keeps everything apart under a prefix of its own in `localStorage` (`p<six letters or digits>/`, the first person of a browser keeps its keys without a prefix) and has a PIN of its own; the key of *Once per session* lies in `sessionStorage` under `agenda.vk:<prefix>`. Shared are only the list of persons (`agenda.persons`: id, name, colour, readable before anyone is unlocked) and the display settings. The header colour is the person's own and stays plain (`agenda.hdr` under the prefix), so that the boot script can apply it before the store is opened. The tab remembers its person in `sessionStorage` (`agenda.person`). *Switch person* writes the store, drops the session key of the person leaving and reloads; the boot script then asks who is using the browser, before any store is opened. A PIN is required for every person (since 0.9.21 also for a single one, 8.14); whoever has journals here and none yet is asked for one at the next start. Any PIN of six to twelve digits is accepted: the PIN separates the persons of a household, it is no protection against someone who copies the browser's storage. *Clear data in this browser* and *Forgot PIN* remove only the current person, with its backups in the browser (8.4c); the others stay.

### 8.15 The clipboard

One encrypted item per account, to move a picture, a file or a text between one's own devices. The server keeps it as `<account>.clip` beside the journal file: `PUT /clip` replaces it (at most 4 MB of content plus 64 KB for encryption and header), `GET /clip` returns it with an ETag, `HEAD /clip` tells only whether there is one and which, `DELETE /clip` removes it. Only the owner may use it (the same proof as for replacing the journal), and only for an account that exists. The client encrypts with the owner's private key of the default journal (version 1: its key); before encryption the item is a 4-byte length, a JSON header `{name, type, size, t}` and the content, so the server learns neither name nor type. At each synchronisation the client asks with `HEAD` and `If-None-Match`; the content is fetched only when the clipboard is opened, copied or dragged, and not again while its ETag stays. The client checks the size before encrypting and sends nothing that is too large. An item lasts 24 hours (`clipTTL`), counted from the modification time of the file: a `GET` or `HEAD` on an older item deletes it and answers 404, and the daily housekeeping deletes old items nobody asked for. No extra record is kept for this. Otherwise a new item replaces the old, *Clear* removes it, and deleting the account removes it with the journal. This is the one thing besides the journal file that the server keeps, and like the journal it cannot read it (decisions 6.6).

## 9. Deviations from outheis-beta v0.2.52

| Topic | Code | This specification |
|---|---|---|
| Entry format | two lines (tag line, text line), blank-line separated | one line, text first, tags trailing |
| Entry identity | `#id-…` read as ID; no supersede semantics; no `#rev` | stable `#id`, `#rev` on every entry, current version = highest `#rev` |
| Facet | optional; missing → `none` | required |
| `#action-*` | only `required` evaluated | five-state model |
| `#size-*` | parser: lowercase; agenda prompt: `S\|M\|L` | lowercase |
| Deletion | soft delete in `agenda.json` (`deleted`, `deleted_at`) | `#done-*` as tombstone in journal, purge at night |
| `#done-*` retention | configurable, default none | default 90 days |
| Facet and topic vocabulary | configured in `agenda.json` | derived from the journal (3.4) |
| `#time-HH:MM` | duration | start only |
| Duration | `#time-HH:MM` | `#time-45m`, `#time-1h30m` |
| Multi-day without time | not supported (requires `#time-S-E`) | all-day span |

---

## 10. Open Issues

The reasons behind the decisions in this document, and further open items of the implementation, are kept in `decisions.md`.

1. **Retention period** for `#done` (default 90 days). Longer periods keep values in the vocabulary for longer (3.4).
2. **`#action-now` as trigger.** State only, or additionally an immediate notification.
3. **`#topic-*`.** Keep, or drop in favour of full-text search. The vocabulary is derived from the journal (3.4).
4. **Mandatory facet when unclear.** Fallback value or `#review-needed`.
5. **Limits of the service.** Concrete rate limits (8.4) to be set from experience.
6. **Word list.** Decided (18 November 2026): seven lists of 2048 words, chosen per device (8.2); decisions 6.8.
7. **Weighting of relevance.** How relevance and priority shift across facets, times of day and persons is to be judged by a language model following rules in `human/rules/`. Open: where the model runs, and how its ordering reaches static clients (through the journal or through a separate endpoint).
8. **Clients outside the browser.** `agenda-cli-v1` (`clients/cli/`, Go, no dependencies) prints a journal of version 1 decrypted, from the relay or from a stored `.enc` file, and appends single lines; it implements 8.2–8.4 a second time and is checked against the web client's encryption. The MCP module (8.6) and a command-line client with the human directory (8.9) are specified but not implemented. The logic shared by all clients is in `clients/core/agenda-core.js` (grammar, validation, recurrence, keys and encryption, journal names and declared facets, the bot rules of 8.12); the web client inlines it when `index.html` is built (`clients/web/build.py`). The Node client on top of it is not written yet.
9. **Calendar subscriptions** (8.13, decisions 6.9): designed, planned for v2; whether, and how, other calendar programs may subscribe to the agenda, which would need plain text outside the client, is still open.
