// agenda-cli-v1 prints or extends an οὐθείς Agenda journal of version 1.
package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/outheis-labs/outheis-agenda/clients/cli/journal"
)

const usage = `agenda-cli-v1: print or extend an οὐθείς Agenda journal (version 1)

usage:
  agenda-cli-v1 SOURCE [flags]               print the journal, decrypted
  agenda-cli-v1 SOURCE add "line"            append one line
  agenda-cli-v1 SOURCE add < lines.txt       append the lines read from stdin
  agenda-cli-v1 SOURCE edit                  edit the journal in $EDITOR, append the changes

SOURCE is a server (https://…) or a stored journal file (a path).

flags:
  -phrase-file FILE  read the eight words from FILE instead of asking
  -o FILE            write the printed journal to FILE instead of stdout
  -all               print every stored line, all revisions, in stored order
  -open              print (or edit) only entries without #done
  -strip-ids         add: remove #id and #rev from every line; clients give new ones

Printing shows each entry once, in its latest revision. The phrase is asked for on the
terminal without echo, or read from stdin when printing and stdin is piped.

add appends the lines exactly as given. A line already in the journal word for word is
skipped. If a line carries an #id that is in the journal with other content, it would
change that entry: then nothing is written (exit code 3); with -strip-ids such lines
become new entries. Lines that keep an #id are reported, since an open copy in another
journal may later be closed by a client that holds both. Empty lines are ignored; the
result is reported on stderr. An empty journal, or a code that opens no line, is refused.

edit works like visudo: the journal goes into a file in memory (/dev/shm, readable only by
you), $VISUAL or $EDITOR (default vi; vi and vim without swap file and viminfo) opens it,
and after saving the text is checked; on a problem you edit again or leave without
writing. New lines are appended as written; a changed entry is appended as a new
revision of its id; removed lines are ignored, since an entry is closed with #done. If an
entry you changed was changed elsewhere meanwhile, you are asked before it is replaced.
The file is removed when the program ends.

exit codes: 0 done, 1 error, 2 usage, 3 id already in the journal
`

func main() {
	t := journal.Tool{
		Name:   "agenda-cli-v1",
		Usage:  usage,
		Prompt: "Phrase (8 words): ",
		Unread: "could not be decrypted",
		Derive: func(code string) ([]journal.Access, error) {
			if n := len(strings.Fields(journal.NormPhrase(code))); n != 8 {
				return nil, fmt.Errorf("the phrase has %d words, not 8", n)
			}
			return []journal.Access{journal.AccessV1(code)}, nil
		},
	}
	os.Exit(t.Run(os.Args[1:]))
}
