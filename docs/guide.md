# οὐθείς Agenda — Guide

## What it is

οὐθείς Agenda is an open and lightweight planning journal: appointments, tasks and notes in one list, on all your devices, kept confidential by its design rather than by a promise.

- **Confidential by design.** The server keeps exactly one file per journal, and that file is encrypted end to end. The key is derived from the eight words of the journal and never leaves your devices, so the server knows nothing about the content and needs to know nothing (zero knowledge). Everything that gives access lies with you, in your app.
- **Cross-device.** Every device with the eight words of your account shows the same journal; changes are synchronised through the server.
- **Sharing is your own agreement.** Whether you share a journal, and with whom, is settled between the people involved: whoever gets the words of a journal can use it. No platform has to support it, and nobody has to be invited through an account of some provider.
- **Across platforms.** Sharing calendars between people on different systems usually takes a lot of effort and does not scale. A shared journal works the same in every browser, on every operating system.
- **Compatible.** Calendar files (`.ics`, iCal) can be imported and exported, so appointments can be taken over from other calendars and handed back to them.

This guide explains how to use the agenda. The technical background is in the [architecture](architecture.md); this page covers what you need to know to work with it.

## Entries

An entry is one line: text first, tags after it.

```
Call the plumber #facet-home #date-2026-11-20 #time-08:00
```

You do not have to type tags. Write or dictate the text in the field at the top and tap *Add*. If the line has no facet, the app asks for one. Everything else can be added later with the `+` next to an entry's tags.

**Notes.** An entry can carry a note of up to 500 characters, such as an address, a phone number or an agenda: the note button next to the `+` opens a text field; *Save* attaches the note, an empty field removes it. The list then shows a small document icon after the entry's text; tapping it opens the note. In the line, the note stands in double braces before the tags: `Meet the client {{Address: Garden Square 3}} #facet-work`. Calendar descriptions become notes when you import a calendar file.

| Tag | Meaning | Examples |
|---|---|---|
| `#facet-…` | area of life or work; every entry has one, at most three (the first decides the journal and the colour; add more with `+` → *another facet*) | `#facet-work`, `#facet-garden #facet-school` |
| `#date-…` | the day from which the entry appears; two dates make a span | `#date-2026-11-20` |
| `#time-…` | a time, a span or a duration | `#time-08:00`, `#time-09:00-15:00`, `#time-45m`, `#time-1h30m` |
| `#recurring-…` | repetition | `#recurring-daily`, `#recurring-tue-thu`, `#recurring-monthly-1-15` |
| `#rank-…` | importance | `high`, `medium`, `low` |
| `#size-…` | effort | `s`, `m`, `l` |
| `#action-…` | state | `required`, `now`, `waiting`, `idle` |
| `#topic-…` | subject; words may be joined by hyphens | `#topic-taxes`, `#topic-open-day` |
| `#done-…` | closed on this day | `#done-2026-11-20` |

A new account starts with the facets `private` and `work` and the topics `sports`, `official` and `travel`, each kept by a Tag definition (see below), and with a few example entries. *Settings → Example tags and entries* removes them with *Delete* or keeps them with *Keep*; if your own entries already use these tags, you choose for each whether it keeps the tag, moves to another facet or topic (a new one can be created there), or is deleted. Facets and topics are not configured anywhere else. A value exists as soon as an entry uses it, and it disappears when no entry has used it for longer than the retention period (90 days after an entry is closed).

## Working with the list

- **Swipe right** on an entry: mark it done or reschedule it (next day, 2 days, 1 or 2 weeks, 1 or 3 months, or another date). On a recurring entry this concerns its next occurrence only: *Skip* it (the gym on Monday is cancelled) or *Reschedule* it (Wednesday's session moves to Friday, same time); the series stays as it is. *Delete series* ends it altogether.
- **Fixed or flexible.** You choose nothing when adding: entries with a time or a repetition belong to their date, others move along. Where that is wrong, set `anchor` in the entry's tag menu. A fixed entry belongs to its day — a visit, an appointment, something that must happen exactly then. If its day passes without *Done*, it waits in *Past* at the top of the list with *Done* and *Reschedule*, so a visit that fell through is not lost. A flexible entry — writing an offer, calling someone back — moves along to *Today* each day, marked *now*, until you mark it done. A time window that may slip to the next day gets `anchor` *flex*. Entries imported from a calendar pass without asking; their calendar decides. A *memo* is something to keep and look up later, such as a customs number: tap the bookmark when adding. It is never due, appears in no list, and the search finds it under *Memos*.
- **Birthdays, holidays.** For a journal that only holds fixed dates, tick *Fixed dates* in the journal's *Edit* dialog (settings, *Journals*): its entries pass without asking, for everyone who shares it.
- **Search:** the magnifier at the top (or `/` on a computer) searches text, notes and tags of all journals, also beyond the next 30 days; *include done* finds closed entries as well.
- **Date of a new entry:** set it in the facet choice that opens after *Add* (calendar and clock buttons); without it, the entry is for today. In the tag menu, `date` and `time` have calendar and clock buttons (*from*, *to*).
- **Tap the text** to change it; **tap a tag** to change or remove it; **`+`** adds a tag. For values without a fixed list (facet, topic, date, time, recurrence) the field at the top of the menu shows the complete tag, e.g. `#topic-`, and you type only the value.
- **Groups:** Today (with overdue entries), Tomorrow, Next 7 days, Later (up to 30 days). Each group shows a limited number of entries; *more* shows the rest. Entries with a clock time are always shown.
- **Text** shows the working copy as plain text, one entry per line. **Manual edit** makes it editable like a text file: change lines in place, add lines, select everything and copy it. To delete lines, tick their boxes on the left and press *Delete*. Nothing is written until you tap *Save*; *Review* lists what you changed, and lines that cannot be read (an impossible date, a missing facet) are listed and must be corrected first. *Dismiss* discards your changes.

## Month view

*Month* next to *List* shows the same entries as a calendar: dots in the facet colours under each day, and below the grid the entries of the day you tap, handled as in the list. A series appears on each of its days; *Skip*, *Done* and *Reschedule* in the swipe menu then concern that day. Entries without a date, and flexible ones carried from earlier days, appear on today only. With another day chosen, a new entry gets that date. Filters apply as in the list.

## Filter

- The **facet bar** below the input field shows every facet with its number of entries. Tap a facet to hide or show it; press and hold to show only this facet; *All* shows all facets again, *None* hides all of them, so that you can switch on single ones.
- **Same name in several journals.** The bar has one button per name, e.g. *sport* for all journals that have it; its colour line shows one segment per journal. To choose the facet of one journal only, use *Facets by journal* in the filter tab; the bar then shows *sport* dimmed and the filter line says which journals are shown.
- **Order and folding.** The facets you assign most often come first; the order changes at most once a day. With many facets the bar shows two rows and a button `+n` for the rest, which you can unfold and fold again. Facets you have switched off are folded last, and the button tells how many of the folded ones are off. After *None*, the facets you switch on come first, in the order you chose them; *All* ends this.
- The **filter tab** (funnel) covers the other tags: topic, action, rank, size, time, recurrence. Tap to hide or show a value, press and hold to show only this value. The result appears in the list, with a line naming the filter and a *Reset* button. *Reset* clears these filters; the facet selection stays.

## Experimental: facet bar ordered by use

*Settings → Experimental → Order the facet bar by how you use the facets* orders the bar not by how many entries carry a facet but by what you do with it: giving it to an entry counts most, setting it as filter less, seeing its entries in *Today* or *Tomorrow* least. Recent use counts more than old use (a use from two weeks ago counts half). The order changes at most once a day, so that the buttons stay where they are while you work.

- The setting and the scores are kept in one line of your journal, `Addon function: statistical facet order …`, so the order is the same on all your devices. Switched off, the bar is ordered by counts again; the scores are kept.
- Switching it on also switches on the diagnostic log (*Settings → Log*), which then records how the order was chosen and whether the facets you used were visible without unfolding. While the experiment is on, the log cannot be switched off. Nothing is written while the log is off. To help evaluate the experiment, send the file from *Save log* to whoever runs your server or develops the app; it contains facet names, never entries or phrases.
- The experiment is a heuristic and may change or disappear.

## Experimental: compact layout and minimal colours

Two switches under *Settings → Experimental*, each for this device only and combinable. *Compact layout* gives a denser view: smaller type and buttons, entries with the time on the left. *Minimal colours* keeps colour for what needs attention (facets, overdue, now, danger) and draws everything else in black, grey and white. Nothing else changes; switch them off again at any time.

## A shared journal in your own terms

In a shared journal's dialog (*Settings → Journals*, tap the journal) you can choose one of your own facets under *For you only: every entry of this journal also has the facet*. From then on every entry of that journal carries it in your views, also new ones, and nobody else sees it. Give the journals of your three children your facet *family*, and one tap on *family* shows everything of all three together with your own family entries.

## Moving facets to another journal

To give some of your facets a journal of their own, create the journal (*Settings → Journals → Add journal → Create a new journal*), open it and tap *Pass facets*. Choose the facets, one or several; the preview says what will move. Every entry whose first facet is one of them moves, open or done, with the facet's definition; an entry that has it only as a further facet stays and loses it. Nothing is copied: afterwards the facet exists only in the new journal. If the server cannot be reached, nothing is moved.

## Keeping values: Tag definitions

A facet or topic disappears when it is no longer used. To keep it, add an entry that starts with `Tag definition:` and is dated 31 December 3000:

```
Tag definition: annual tax return #type-meta #topic-taxes
Tag definition: family appointments #facet-family #type-meta
```

When you create a facet or topic in the field for a new value (with the prefix `#facet-` or `#topic-`), the app writes this line for you. With several journals it asks which journal a new facet belongs to, and in which journals a new topic is kept. The `?` next to the field summarises this. Such entries never appear in the list, because the list ends three months ahead; they stay in the journal and can be edited in the *Text* view. The text after the colon describes what the value stands for; a language model that sorts new entries can use it. Tag definitions need no facet.

A Tag definition with a facet also decides which journal that facet belongs to (see *Sharing a journal*).

## Your account

The account is a phrase of eight words, shown once when the account is created. Write it down. It is the only key to your journal: the server stores only encrypted lines and cannot read them, and nobody can restore a lost phrase.

- Whoever has the phrase can read and change the journal. Do not pass it on except for a journal you share on purpose.
- *Settings → Account ID* is a code you can give to the operator of the server to find your file. It does not give access to anything.
- *Export journal file* downloads the encrypted file; with the phrase it can be opened in any browser with *Open local journal*, without a server. The plain-text export is readable by anyone who gets the file.

## Sharing a journal

Several people can share a journal, for example for family appointments. A shared journal is an account of its own with its own phrase; everyone who shares it adds it in their app. Your own journal stays private.

1. One person opens *Settings → + Add journal*, taps *Create a new journal*, gives it a name and writes down the eight words.
2. The others open *Settings → + Add journal*, enter the same eight words and tap *Add*.
3. Someone declares the facet that belongs to the shared journal, with a Tag definition in that journal (in the *Text* view, choose the journal first):

   ```
   Tag definition: family appointments #facet-family #type-meta
   ```

From then on, in every app that has the shared journal:

- Wherever you choose a facet, each one carries the name of its journal in small letters (*family · Familie*). Choosing *family · Familie* writes the entry to the shared journal. Several journals may have a facet of the same name (three children with `sports` each); they are different facets.
- If you type `#facet-family` yourself, the entry goes to the shared journal only after you confirm it; a facet of one of your own journals needs no confirmation. In the list, hovering over a facet shows its journal.
- The list shows the entries of all your journals together. Entries from a shared journal carry its name.
- To move an entry to another journal, tap its facet and choose the facet with the other journal's name; the current facet is also offered in every journal that does not have it yet (*new here*). *Undo* takes it back. Nothing is ever moved without your choice.

### Your journals on all your devices

The journals you add belong to your account: add one on your phone, and your other devices show it after their next sync. *Remove from my journals* removes it from all your devices; the journal itself stays on the server for the others.

Only the person who created a journal is offered *Delete on server*. If the owner deletes a shared journal, your app says so and keeps its last state, so you can still export it; then remove it.

### Who uses a journal

*Edit* shows under *Used by* how many people have used the journal recently: you, and how many others. The server recognises people by an ID that is different for every journal and does not tell who they are; all your devices count as one. It is a guide, not proof.

### Your own tags on shared entries

On an entry of another journal, `+` → *another facet* or *another topic* adds a tag only you see, for example `family` on your children's school and music entries. It is kept in your own journal; the others' journal is not changed. Such tags have a dashed border. If the entry is closed or removed, your tag goes with it.

### Preparations and references

`+` → *reference to an entry* links an entry to another one, for example "Find the sheet music" to the music lesson it belongs to. The chip shows the other entry's text; tapping it offers to go there.

### Stop sharing

*Settings → Journals → Edit → Stop sharing for anybody* (only for a journal you created) ends sharing for everyone at once. Behind the scenes, the app moves the journal's content into a newly created journal with new words, puts the new journal on all your devices and deletes the old one on the server. The others see the old journal as deleted by its owner; what they have already seen stays in their browser. To go on sharing with some of them, give them the new words or the QR code again.

### Passing the words by QR code

Instead of reading out the eight words: open *Settings → Journals → Edit → Show QR code* on one phone, and on the other *+ Add journal → Scan QR code*. The app reads the code itself; the words do not go through a link, the browser history or the server. On a computer without camera, type the words.

### The journal's name

A journal names itself with an entry like this:

```
Journal name: Familie #type-meta
```

Everyone who shares the journal sees the same name. *Settings → Journals → Edit* changes it. For a journal someone else created you can also set an **alias** there: it is shown only to you, on all your devices, and does not change the name the others see. When you add an existing journal, the name you type becomes your alias. A journal without such an entry is shown with the first four characters of its account ID.

### Two journals, one facet name

Two people may well choose the same facet name, for example `familie` in their own journal and in the shared one. The app keeps them apart: wherever the name occurs in more than one journal, the journal's name follows it (`familie · Familie`), each has its own colour and can be filtered on its own, and when you add an entry with that facet, the app asks which one you mean. The journals themselves keep the plain name.

If you want to change a name anyway, *Settings → Rename tag* renames a facet or topic across the journals you choose (all of them unless you leave some out): choose the value and the new name; the preview tells you per journal how many entries change. Tag definitions are renamed with the entries. If the new name already exists in a journal, both values are merged there.

If entries with a facet that another journal declares are still in your own journal, a notice offers to move them there, or to keep them where they are.

## Repeating entries with two dates

A repeating entry with two dates is read in one of two ways, depending on how far apart the dates are:

- **Closer than one repetition:** one occurrence over several days that repeats. `Summer festival #date-2026-07-10 #date-2026-07-12 #recurring-yearly` is every year from 10 to 12 July.
- **Otherwise:** the start and end of the series. `Training #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed` is Mondays and Wednesdays from 12 to 13 o'clock, until 31 March.

Weekday lists such as `mon-wed` and `daily` always mean start and end of the series. The list shows how an entry is read, and marks cases that look unintended with *check dates*.

## Date and time of a new entry

Type the entry and tap *Add*. When you then choose its facet, the calendar and clock buttons at the top right of that dialog set its date and time (*from*, *to*). Without a date, the entry is for today. You can also type the tags yourself, for example `#date-2026-11-27 #time-09:30-10:15`.

## Calendar files

The agenda can be the one place for appointments from all your calendars.

- **Import:** *Import entries* → *Choose files* accepts one or several `.ics` files (for example invitations you received, or an export of your work or private calendar); you can also paste the content of a calendar file. In the preview you choose the facet, for all events or one by one. Importing the same file again later updates the entries instead of duplicating them; their facet stays as you set it. Repetitions that the agenda cannot express (every second week, for example) are imported once and marked for review.
- **Export:** *Settings → Export calendar* writes the open items of the facets you choose, for 30 days, 3 months or all, into one `.ics` file that Outlook, Apple Calendar, Google Calendar or Proton can import. This file is not encrypted.

## Printing

*Settings → Print agenda* prints the next 30 days on one A4 page as a checklist with room for notes, for the facets you select (preselected from the facet bar). Each line carries a short reference to the entry.

## Without network

The app keeps a copy of your journals in the browser and works offline. Changes are sent when the server is reachable again. *in sync* in the header shows that everything has been sent.
