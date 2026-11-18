# Command-line clients

`agenda-cli` prints a journal decrypted, appends lines to it, or opens it in an editor. It
takes the owner's eight words, an ally code (16 words) or a guest code (`g1.…`); eight words
are tried first for a journal of version 2, then for one of version 1, as the web client
does. `agenda-cli-v1` and `agenda-cli-v2` are the same program restricted to one version;
they are kept so that old journals and backups can always be read.

`agenda-cli-v1` prints a journal of version 1 decrypted, or appends lines to it. It takes
the journal from a server or from a stored file, needs only the phrase, stores nothing and
holds the keys only while it runs. It is a tool for scripts and for moving lines between
journals; it does not edit entries. The web client remains the place where entries are
checked and completed.

## Build

```
go build -o agenda-cli-v1 ./clients/cli/agenda-cli-v1
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags "-s -w" -o agenda-cli-v1 ./clients/cli/agenda-cli-v1
```

A single static binary; only the Go standard library.

## Use

The first argument is the source: a server (`https://…`) or a journal file
(`ACCOUNT.enc`, relative or absolute path). Flags may stand anywhere.

```
agenda-cli-v1 https://example.org                      # asks for the phrase, prints the journal
agenda-cli-v1 backup/4f3a….enc -o journal.txt          # a stored file, into a text file
cat phrase.txt | agenda-cli-v1 https://example.org     # phrase piped in
agenda-cli-v1 https://example.org add "Call Anna #facet-work"
agenda-cli-v1 A.enc -phrase-file a.txt -open | agenda-cli-v1 https://example.org -phrase-file b.txt add
```

Printing shows each entry once, in its latest revision, closed ones included; `-open`
leaves out entries with `#done`, `-all` prints every stored line with all its revisions,
in stored order. Lines the phrase cannot decrypt are counted on stderr.

`add` appends one line given in quotes, or the lines read from stdin, exactly as given.
Before writing it reads the journal:

- a line already there word for word is skipped;
- if a line carries an `#id` that is already in the journal with other content, it would
  change that entry: then nothing is written, the lines are listed and the exit code is 3;
- `-strip-ids` removes `#id` and `#rev` from every line before anything else, for lines
  taken from another journal whose ids do not matter; the web client gives them new ones
  at its next sync (architecture 6.4);
- lines that keep an `#id` are reported: if an open copy stays in another journal, a
  client that holds both journals will close one of them (architecture 8.11d);
- an empty journal, or a phrase that opens no line, is refused, so that a mistyped phrase
  does not create a new account on the server.

Empty lines are ignored. What was appended, skipped and changed is reported on stderr. A
file is appended to as the server does it: one write, then fsync. When lines are read
from stdin, the phrase comes from `-phrase-file` or the terminal.

## edit

`edit` opens the journal in a text editor, in the manner of `visudo`:

```
agenda-cli-v1 https://example.org edit
agenda-cli-v1 https://example.org edit -open      # only open entries
```

1. The current state (as printed) goes into a file in `/dev/shm`, that is in memory,
   readable only by the user. Where there is no `/dev/shm`, the program says where the
   file lies instead.
2. `$VISUAL`, `$EDITOR` or `vi` opens it; vi, vim and nvim run without swap file and
   viminfo, so that no copy of the text stays behind.
3. After saving, the text is checked: a line with tags only, an id that occurs twice, a
   line too long, a private line written by an ally (version 2). On a problem the
   program asks: edit again, or exit without writing.
4. New lines are appended as written (without id, the web client takes them up); a
   changed entry is appended with its id and a new `#rev`, that is as its next revision;
   removed lines are ignored and counted, since an entry is closed with `#done`, not
   deleted.
5. Before appending, the journal is read again. If an entry changed in the editor has a
   newer revision there, the program shows it and asks whether to replace it.
6. The file is removed when the program ends, also on Ctrl-C.

Exit codes: 0 done, 1 error, 2 usage, 3 id already in the journal.

## agenda-cli-v2

`agenda-cli-v2` does the same for a journal of version 2 (architecture 8.11e). It takes
the owner's eight words, an ally code (16 words) or a guest code (`g1.…`):

- the owner reads everything, including the private lines;
- an ally reads everything but the private lines;
- a guest can only print.

Appended lines are encrypted with the journal key, except private lines (`Journal key:`,
`Journal alias:`, `Tag overlay:`, `Journal overlay:`, `Addon function:`), which only the
owner can write and which are encrypted with the owner's private key.
