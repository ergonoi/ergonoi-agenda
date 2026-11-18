package journal

// edit opens the journal in a text editor, as visudo does with sudoers: a copy in memory,
// the editor, a check after saving, then the changes are appended.

import (
	"bufio"
	"crypto/rand"
	"encoding/binary"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// Snow makes a snowflake id as the clients do (architecture 3.1): milliseconds since
// 2024-01-01, a machine number and a sequence.
var lastMs, seq uint64

func Snow() string {
	const epoch = 1704067200000
	ms := uint64(time.Now().UnixMilli() - epoch)
	if ms <= lastMs {
		ms = lastMs
		seq = (seq + 1) & 0xFFF
		if seq == 0 {
			ms++
		}
	} else {
		seq = 0
	}
	lastMs = ms
	var r [2]byte
	rand.Read(r[:])
	machine := uint64(binary.BigEndian.Uint16(r[:])) & 0x3FF
	return fmt.Sprintf("%019d", ms<<22|machine<<12|seq)
}

// withRev gives a line a new #rev, keeping everything else.
func withRev(line, rev string) string {
	var out []string
	for _, w := range strings.Fields(line) {
		if !strings.HasPrefix(w, "#rev-") {
			out = append(out, w)
		}
	}
	return strings.Join(append(out, "#rev-"+rev), " ")
}

// plan is what an edited text means for the journal.
type plan struct {
	added   []string // new lines, as written
	changed []string // changed entries, with a new #rev
	base    map[string]string
	removed int
}

// diff compares the edited text with the lines shown; cur holds the current line of every
// id in the journal.
func diff(shown, edited []string, cur map[string]string, keyFor func(string) ([]byte, error)) (plan, []string) {
	p := plan{base: map[string]string{}}
	var problems []string
	was := map[string]bool{}
	for _, l := range shown {
		was[strings.Join(strings.Fields(l), " ")] = true
	}
	inJournal := map[string]bool{}
	for _, l := range cur {
		inJournal[l] = true
	}
	kept := map[string]bool{}
	seen := map[string]bool{}
	for n, l := range edited {
		l = strings.Join(strings.Fields(l), " ")
		if l == "" {
			continue
		}
		at := fmt.Sprintf("line %d: ", n+1)
		if strings.HasPrefix(l, "#") {
			problems = append(problems, at+"a line needs text before its tags")
			continue
		}
		id := tagVal(l, "id")
		if id != "" {
			if seen[id] {
				problems = append(problems, at+"#id-"+id+" occurs twice")
				continue
			}
			seen[id] = true
			kept[id] = true
		}
		if was[l] || inJournal[l] {
			kept[l] = true
			continue
		}
		key, err := keyFor(l)
		if err == nil {
			_, err = Encrypt(key, withRev(l, "0000000000000000000"))
		}
		if err != nil {
			problems = append(problems, at+err.Error())
			continue
		}
		if old, ok := cur[id]; id != "" && ok {
			p.changed = append(p.changed, withRev(l, Snow()))
			p.base[id] = old
		} else {
			p.added = append(p.added, l)
		}
	}
	for _, l := range shown {
		if id := tagVal(l, "id"); (id != "" && !kept[id]) || (id == "" && !kept[l]) {
			p.removed++
		}
	}
	return p, problems
}

// edit runs the editor until the text passes the check or the user gives up.
func (t Tool) edit(store source, acc Access, plain []string, src string, o options) int {
	say := func(f string, a ...any) { fmt.Fprintf(os.Stderr, t.Name+": "+f+"\n", a...) }
	if acc.KeyFor == nil {
		say("this code can only read")
		return ExitError
	}
	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
	if err != nil {
		say("edit needs a terminal")
		return ExitUsage
	}
	defer tty.Close()

	current := func(lines []string) map[string]string {
		m := map[string]string{}
		for _, l := range Current(lines) {
			if id := tagVal(l, "id"); id != "" {
				m[id] = l
			}
		}
		return m
	}
	cur := current(plain)
	var shown []string
	for _, l := range Current(plain) {
		if !(o.open && Closed(l)) {
			shown = append(shown, l)
		}
	}

	// The copy lives in memory (/dev/shm) where there is one, readable only by the user,
	// and is removed however the program ends.
	dir := "/dev/shm"
	if st, err := os.Stat(dir); err != nil || !st.IsDir() {
		dir = os.TempDir()
		say("no /dev/shm: the decrypted copy is written to %s while you edit", dir)
	}
	f, err := os.CreateTemp(dir, "agenda-*.txt")
	if err != nil {
		say("%v", err)
		return ExitError
	}
	tmp := f.Name()
	cleanup := func() { os.Remove(tmp) }
	defer cleanup()
	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM, syscall.SIGHUP)
	go func() { <-sig; cleanup(); os.Exit(130) }()
	os.Chmod(tmp, 0o600)
	f.WriteString(strings.Join(shown, "\n") + "\n")
	f.Close()

	ask := func(q string, keys string) byte {
		r := bufio.NewReader(tty)
		for {
			fmt.Fprint(tty, q)
			s, err := r.ReadString('\n')
			if err != nil {
				return 'x'
			}
			if s = strings.ToLower(strings.TrimSpace(s)); len(s) == 1 && strings.Contains(keys, s) {
				return s[0]
			}
		}
	}

	var p plan
	for {
		if err := runEditor(tmp, tty); err != nil {
			say("%v", err)
			return ExitError
		}
		b, err := os.ReadFile(tmp)
		if err != nil {
			say("%v", err)
			return ExitError
		}
		var problems []string
		p, problems = diff(shown, strings.Split(string(b), "\n"), cur, acc.KeyFor)
		if len(problems) == 0 {
			break
		}
		for _, m := range problems {
			fmt.Fprintln(tty, "  "+m)
		}
		if ask("What now? (e)dit again, e(x)it without writing: ", "ex") == 'x' {
			say("nothing written")
			return ExitError
		}
	}
	if len(p.added)+len(p.changed) == 0 {
		msg := "no change; nothing written"
		if p.removed > 0 {
			msg = fmt.Sprintf("%d line(s) removed in the editor are ignored (an entry is closed with #done); nothing written", p.removed)
		}
		say("%s", msg)
		return ExitOK
	}

	// Has the journal changed while the editor was open? Entries edited here that have a
	// newer revision there would be overwritten by this one.
	file, err := store.read(acc.Keys)
	if err != nil {
		say("%v", err)
		return ExitError
	}
	now, _ := acc.Open(file)
	nowCur := current(now)
	var stale []string
	for id, old := range p.base {
		if nowCur[id] != old {
			stale = append(stale, nowCur[id])
		}
	}
	if len(stale) > 0 {
		say("%d entr(y/ies) you changed were changed elsewhere while you edited; writing replaces those changes:", len(stale))
		for _, l := range stale {
			fmt.Fprintln(os.Stderr, "  "+l)
		}
		if ask("(w)rite anyway, e(x)it without writing: ", "wx") == 'x' {
			say("nothing written")
			return ExitError
		}
	}

	var enc []string
	for _, l := range append(append([]string(nil), p.added...), p.changed...) {
		key, _ := acc.KeyFor(l)
		e, err := Encrypt(key, l)
		if err != nil {
			say("%v; nothing written", err)
			return ExitError
		}
		enc = append(enc, e)
	}
	if err := store.append(acc.Keys, enc); err != nil {
		say("%v", err)
		return ExitError
	}
	msg := fmt.Sprintf("%s: %d new line(s), %d changed entr(y/ies) written as new revisions", src, len(p.added), len(p.changed))
	if p.removed > 0 {
		msg += fmt.Sprintf("; %d line(s) removed in the editor are ignored (an entry is closed with #done)", p.removed)
	}
	say("%s", msg)
	return ExitOK
}

// runEditor starts $VISUAL, $EDITOR or vi on the file; vi and vim without swap file and
// without viminfo, so that no copy of the text stays behind.
func runEditor(path string, tty *os.File) error {
	ed := os.Getenv("VISUAL")
	if ed == "" {
		ed = os.Getenv("EDITOR")
	}
	if ed == "" {
		ed = "vi"
	}
	args := strings.Fields(ed)
	switch filepath.Base(args[0]) {
	case "vi", "vim", "nvim", "view":
		args = append(args, "-n", "-i", "NONE")
	}
	cmd := exec.Command(args[0], append(args[1:], path)...)
	cmd.Stdin, cmd.Stdout, cmd.Stderr = tty, tty, tty
	if err := cmd.Run(); err != nil {
		return errors.New("editor: " + err.Error())
	}
	return nil
}
