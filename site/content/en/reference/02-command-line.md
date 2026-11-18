# Command line

*Reading, appending and editing a journal from a terminal.*

## What it is for

`agenda-cli` is a small program for scripts, backups and moving lines between journals. It reads a journal from a server or from a stored file, prints it decrypted, appends lines, or opens it in a text editor. It takes the eight words, an ally code or a guest code, keeps nothing on disk and holds the keys only while it runs.

## Use

The first argument is the source: a server address or a journal file.

```
agenda-cli https://agenda.example.org                 # asks for the words, prints the journal
agenda-cli backup/4f3a….enc -o journal.txt             # a stored file, into a text file
agenda-cli https://agenda.example.org -open            # only open entries
agenda-cli https://agenda.example.org add "Call Anna #facet-work"
```

`add` appends lines exactly as given. A line that is already there is skipped; a line that would change an existing entry is refused unless `-strip-ids` removes its identity.

## Editing

```
agenda-cli https://agenda.example.org edit
```

opens the journal in your editor, in the manner of `visudo`: the text lies in memory while you edit it, is checked when you save, and only what changed is appended. Removed lines are not deleted; an entry is closed with `#done`.

## Exit codes

`0` success, `1` error, `2` wrong use, `3` nothing written because lines would have changed existing entries.

The complete description is in the repository, in `clients/cli/README.md`.
