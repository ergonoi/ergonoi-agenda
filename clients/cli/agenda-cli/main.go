// agenda-cli prints or extends an οὐθείς Agenda journal: of version 2, or of version 1
// when eight words open none of version 2 (audit K4).
package main

import (
	"os"

	"github.com/outheis-labs/outheis-agenda/clients/cli/journal"
)

const usage = `agenda-cli: print or extend an οὐθείς Agenda journal

usage:
  agenda-cli SOURCE [flags]               print the journal, decrypted
  agenda-cli SOURCE add "line"            append one line
  agenda-cli SOURCE add < lines.txt       append the lines read from stdin
  agenda-cli SOURCE edit                  edit the journal in $EDITOR, append the changes

SOURCE is a server (https://…) or a stored journal file (a path).
The code is the owner's phrase (8 words), an ally code (16 words) or a guest code (g1.…).
Eight words are tried first for a journal of version 2, then for one of version 1.

flags:
  -phrase-file FILE  read the code from FILE instead of asking
  -o FILE            write the printed journal to FILE instead of stdout
  -all               print every stored line, all revisions, in stored order
  -open              print (or edit) only entries without #done
  -strip-ids         add: remove #id and #rev from every line; clients give new ones

Printing shows each entry once, in its latest revision. The code is asked for on the
terminal without echo, or read from stdin when printing and stdin is piped. The owner
reads the private lines too; allies and guests do not. A guest can only print.

add appends the lines exactly as given. A line already in the journal word for word is
skipped. If a line carries an #id that is in the journal with other content, it would
change that entry: then nothing is written (exit code 3); with -strip-ids such lines
become new entries. Lines that keep an #id are reported, since an open copy in another
journal may later be closed by a client that holds both. Empty lines are ignored; the
result is reported on stderr. An empty journal, or a code that opens no line, is refused.
Private lines (Journal key:, Journal alias:, Tag overlay:, Journal overlay:, Addon
function:) are encrypted with the owner's private key; only the owner can add them.

edit works like visudo: the journal goes into a file in memory (/dev/shm, readable only by
you), $VISUAL or $EDITOR (default vi; vi and vim without swap file and viminfo) opens it,
and after saving the text is checked; on a problem you edit again or leave without
writing. New lines are appended as written; a changed entry is appended as a new
revision of its id; removed lines are ignored, since an entry is closed with #done. If an
entry you changed was changed elsewhere meanwhile, you are asked before it is replaced.
The file is removed when the program ends. Allies do not see, and cannot change, the
private lines.

exit codes: 0 done, 1 error, 2 usage, 3 id already in the journal
`

func main() {
	t := journal.Tool{
		Name:   "agenda-cli",
		Usage:  usage,
		Prompt: "Phrase, ally code or guest code: ",
		Unread: "are private to the owner or could not be decrypted",
		Derive: func(code string) ([]journal.Access, error) {
			return journal.AccessAny(code)
		},
	}
	os.Exit(t.Run(os.Args[1:]))
}
