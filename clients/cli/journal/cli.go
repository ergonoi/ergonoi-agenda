package journal

// The command line shared by agenda-cli-v1 and agenda-cli-v2.

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
)

// Exit codes.
const (
	ExitOK       = 0
	ExitError    = 1
	ExitUsage    = 2
	ExitConflict = 3
)

// Access is what a code opens: the keys, how to read the stored file and which key a
// new line is encrypted with.
type Access struct {
	Keys
	Open   func(file string) (plain []string, unread int)
	KeyFor func(line string) ([]byte, error) // nil: this code can only read
}

// Tool describes one of the programs.
type Tool struct {
	Name   string
	Usage  string
	Prompt string
	// Derive gives the ways a code may open a journal, in the order they are tried: eight
	// words open a journal of version 2 or one of version 1.
	Derive func(code string) ([]Access, error)
	Unread string // how to describe lines left out when printing
}

type options struct {
	phraseFile, out string
	all, open       bool
	stripIDs        bool
	args            []string
}

// parse accepts the flags anywhere among the arguments.
func parse(argv []string) (options, error) {
	var o options
	for i := 0; i < len(argv); i++ {
		a := argv[i]
		value := func() (string, error) {
			if i+1 >= len(argv) {
				return "", fmt.Errorf("%s needs a value", a)
			}
			i++
			return argv[i], nil
		}
		var err error
		switch a {
		case "-phrase-file", "--phrase-file":
			o.phraseFile, err = value()
		case "-o", "--out":
			o.out, err = value()
		case "-all", "--all":
			o.all = true
		case "-open", "--open":
			o.open = true
		case "-strip-ids", "--strip-ids":
			o.stripIDs = true
		case "-h", "-help", "--help":
			return o, errHelp
		case "--":
			o.args = append(o.args, argv[i+1:]...)
			return o, nil
		default:
			if strings.HasPrefix(a, "-") && a != "-" {
				return o, fmt.Errorf("unknown flag %s", a)
			}
			o.args = append(o.args, a)
		}
		if err != nil {
			return o, err
		}
	}
	return o, nil
}

var errHelp = errors.New("help")

// Run is the whole program; it returns the exit code.
func (t Tool) Run(argv []string) int {
	fail := func(code int, err error) int {
		fmt.Fprintf(os.Stderr, "%s: %v\n", t.Name, err)
		return code
	}
	o, err := parse(argv)
	if err == errHelp {
		fmt.Print(t.Usage)
		return ExitOK
	}
	if err != nil {
		return fail(ExitUsage, err)
	}
	if len(o.args) == 0 {
		fmt.Fprint(os.Stderr, t.Usage)
		return ExitUsage
	}
	src, rest := o.args[0], o.args[1:]
	adding := len(rest) > 0 && rest[0] == "add"
	editing := len(rest) > 0 && rest[0] == "edit"
	switch {
	case editing && len(rest) > 1:
		return fail(ExitUsage, errors.New("edit takes no further argument"))
	case editing && (o.all || o.out != "" || o.stripIDs):
		return fail(ExitUsage, errors.New("-all, -o and -strip-ids do not apply to edit"))
	case len(rest) > 0 && !adding && !editing:
		return fail(ExitUsage, fmt.Errorf("unknown command %q", rest[0]))
	case adding && len(rest) > 2:
		return fail(ExitUsage, errors.New(`add takes one line in quotes, or reads lines from stdin`))
	case adding && (o.all || o.open || o.out != ""):
		return fail(ExitUsage, errors.New("-all, -open and -o apply to printing, not to add"))
	case !adding && o.stripIDs:
		return fail(ExitUsage, errors.New("-strip-ids applies to add"))
	}

	store, err := openSource(src)
	if err != nil {
		return fail(ExitUsage, err)
	}

	// Lines to add come first: from the argument or from stdin.
	var lines []string
	if adding {
		if len(rest) == 2 && rest[1] != "-" {
			lines = []string{rest[1]}
		} else {
			if isTerminal(os.Stdin) {
				return fail(ExitUsage, errors.New(`no lines: give one in quotes or pipe them into stdin`))
			}
			if lines, err = readLines(os.Stdin); err != nil {
				return fail(ExitError, err)
			}
		}
		lines = nonEmpty(lines)
		if len(lines) == 0 {
			return fail(ExitUsage, errors.New("nothing to add"))
		}
	}

	code, err := readCode(o.phraseFile, !adding && !editing, t.Prompt)
	if err != nil {
		return fail(ExitError, err)
	}
	cands, err := t.Derive(code)
	if err != nil {
		return fail(ExitError, err)
	}
	var (
		acc    Access
		plain  []string
		unread int
	)
	for _, c := range cands {
		f, err := store.read(c.Keys)
		if err != nil {
			return fail(ExitError, err)
		}
		if strings.TrimSpace(f) == "" {
			continue
		}
		if p, u := c.Open(f); len(p) > 0 {
			acc, plain, unread = c, p, u
			break
		}
	}
	if plain == nil {
		return fail(ExitError, fmt.Errorf("%s is empty, or the code opens no journal there; nothing done", src))
	}

	if editing {
		return t.edit(store, acc, plain, src, o)
	}
	if adding {
		return t.add(store, acc, plain, lines, src, o)
	}

	if !o.all {
		plain = Current(plain)
	}
	w := io.Writer(os.Stdout)
	if o.out != "" {
		f, err := os.OpenFile(o.out, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, 0o600)
		if err != nil {
			return fail(ExitError, err)
		}
		defer f.Close()
		w = f
	}
	bw := bufio.NewWriter(w)
	for _, l := range plain {
		if o.open && Closed(l) {
			continue
		}
		fmt.Fprintln(bw, l)
	}
	if err := bw.Flush(); err != nil {
		return fail(ExitError, err)
	}
	if unread > 0 {
		fmt.Fprintf(os.Stderr, "%s: %d stored line(s) %s and were left out\n", t.Name, unread, t.Unread)
	}
	return ExitOK
}

// add appends the lines exactly as given. A line already in the journal word for word is
// skipped. A line whose #id is in the journal with other content would change that entry:
// then nothing is written. -strip-ids removes #id and #rev from every line first.
func (t Tool) add(store source, acc Access, plain, lines []string, src string, o options) int {
	say := func(f string, a ...any) { fmt.Fprintf(os.Stderr, t.Name+": "+f+"\n", a...) }
	if acc.KeyFor == nil {
		say("this code can only read")
		return ExitError
	}
	have := map[string]bool{}
	ids := map[string]bool{}
	for _, l := range plain {
		have[l] = true
		if id := tagVal(l, "id"); id != "" {
			ids[id] = true
		}
	}
	stripped := 0
	if o.stripIDs {
		for i, l := range lines {
			if s := StripIDs(l); s != l {
				lines[i], stripped = s, stripped+1
			}
		}
	}
	var conflicts []string
	for _, l := range lines {
		if id := tagVal(l, "id"); id != "" && ids[id] && !have[l] {
			conflicts = append(conflicts, l)
		}
	}
	if len(conflicts) > 0 {
		say("%d line(s) carry an #id that is already in the journal with other content; nothing written:", len(conflicts))
		for _, l := range conflicts {
			fmt.Fprintln(os.Stderr, "  "+l)
		}
		say("-strip-ids appends them as new entries")
		return ExitConflict
	}
	var enc []string
	skipped, withID := 0, 0
	for _, l := range lines {
		if have[l] {
			skipped++
			continue
		}
		key, err := acc.KeyFor(l)
		if err != nil {
			say("%v: %s\nnothing written", err, l)
			return ExitError
		}
		e, err := Encrypt(key, l)
		if err != nil {
			say("%v: %.60s…\nnothing written", err, l)
			return ExitError
		}
		if tagVal(l, "id") != "" {
			withID++
		}
		have[l] = true
		enc = append(enc, e)
	}
	if len(enc) > 0 {
		if err := store.append(acc.Keys, enc); err != nil {
			say("%v", err)
			return ExitError
		}
	}
	msg := fmt.Sprintf("%d line(s) appended to %s", len(enc), src)
	if skipped > 0 {
		msg += fmt.Sprintf(", %d skipped (already present)", skipped)
	}
	if stripped > 0 {
		msg += fmt.Sprintf(", #id and #rev removed from %d", stripped)
	}
	say("%s", msg)
	if withID > 0 {
		say("%d appended line(s) keep their #id; if a copy stays open in another journal, a client that holds both will close one (-strip-ids avoids this)", withID)
	}
	return ExitOK
}

// StripIDs removes the #id and #rev tags of a line; a client gives it new ones.
func StripIDs(line string) string {
	var out []string
	for _, w := range strings.Fields(line) {
		if strings.HasPrefix(w, "#id-") || strings.HasPrefix(w, "#rev-") {
			continue
		}
		out = append(out, w)
	}
	return strings.Join(out, " ")
}

// A source is a relay (http:// or https://) or a stored journal file.
type source interface {
	read(Keys) (string, error)
	append(Keys, []string) error
}

type relaySource struct{ c Client }

func (r relaySource) read(k Keys) (string, error)       { return r.c.Fetch(k) }
func (r relaySource) append(k Keys, enc []string) error { return r.c.Append(k, enc) }

type fileSource string

func (f fileSource) read(Keys) (string, error) {
	b, err := os.ReadFile(string(f))
	return string(b), err
}

// append adds the lines to the file as the relay does: one write, then fsync.
func (f fileSource) append(_ Keys, enc []string) error {
	cur, err := os.ReadFile(string(f))
	if err != nil {
		return err
	}
	var b strings.Builder
	if len(cur) > 0 && cur[len(cur)-1] != '\n' {
		b.WriteByte('\n')
	}
	for _, l := range enc {
		b.WriteString(l + "\n")
	}
	h, err := os.OpenFile(string(f), os.O_WRONLY|os.O_APPEND, 0)
	if err != nil {
		return err
	}
	if _, err := h.WriteString(b.String()); err != nil {
		h.Close()
		return err
	}
	if err := h.Sync(); err != nil {
		h.Close()
		return err
	}
	return h.Close()
}

func openSource(src string) (source, error) {
	if strings.HasPrefix(src, "https://") || strings.HasPrefix(src, "http://") {
		return relaySource{Client{Server: src}}, nil
	}
	st, err := os.Stat(src)
	if err != nil {
		return nil, fmt.Errorf("%s: no such file (a server is given as https://…)", src)
	}
	if st.IsDir() {
		return nil, fmt.Errorf("%s is a directory, not a journal file", src)
	}
	return fileSource(src), nil
}

func readLines(r io.Reader) ([]string, error) {
	var out []string
	sc := bufio.NewScanner(r)
	sc.Buffer(make([]byte, 64*1024), 1<<20)
	for sc.Scan() {
		out = append(out, strings.TrimRight(sc.Text(), "\r"))
	}
	return out, sc.Err()
}

func nonEmpty(lines []string) []string {
	var out []string
	for _, l := range lines {
		if strings.TrimSpace(l) != "" {
			out = append(out, l)
		}
	}
	return out
}

// readCode takes the phrase or code from a file, from stdin when printing and stdin is
// piped, or asks on the terminal without echo.
func readCode(file string, stdinAllowed bool, prompt string) (string, error) {
	if file != "" {
		b, err := os.ReadFile(file)
		return strings.TrimSpace(string(b)), err
	}
	if stdinAllowed && !isTerminal(os.Stdin) {
		b, err := io.ReadAll(os.Stdin)
		return strings.TrimSpace(string(b)), err
	}
	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
	if err != nil {
		return "", errors.New("no terminal to ask for the code; use -phrase-file")
	}
	defer tty.Close()
	fmt.Fprint(tty, prompt)
	stty(tty, "-echo")
	defer stty(tty, "echo")
	s, err := bufio.NewReader(tty).ReadString('\n')
	fmt.Fprintln(tty)
	return strings.TrimSpace(s), err
}

func stty(tty *os.File, arg string) {
	cmd := exec.Command("stty", arg)
	cmd.Stdin = tty
	_ = cmd.Run()
}

func isTerminal(f *os.File) bool {
	st, err := f.Stat()
	return err == nil && st.Mode()&os.ModeCharDevice != 0
}
