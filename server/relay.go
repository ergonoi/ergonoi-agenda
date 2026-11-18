package main

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// Admission rules (docs/architecture.md, 8.4). These are constants on purpose:
// changing them requires rebuilding the binary.
const (
	maxAccountBytes = 5 << 20 // 5 MB per account file
	// One encrypted item per account for moving something between one's own devices
	// (architecture 8.15): 4 MB of content plus what encryption and its header add.
	maxClipBytes = 4<<20 + 64<<10
	// clipTTL is how long a clipboard item stays; the file's modification time is its age.
	clipTTL = 24 * time.Hour
	maxLineBytes = 4096 // decoded size of one encrypted line
	nonceBytes   = 12
	tagBytes     = 16
	padBlock     = 256
	inactiveDays = 5 * 365 // accounts without access are deleted after 5 years
)

var (
	errFormat   = errors.New("invalid line format")
	errTooLarge = errors.New("account size limit reached")
	errChanged  = errors.New("journal changed")
)

// validLine checks the form of one stored line: standard base64 whose decoded
// length is nonce + tag + n*256 bytes, at most maxLineBytes.
func validLine(l string) bool {
	if l == "" || len(l) > base64.StdEncoding.EncodedLen(maxLineBytes) {
		return false
	}
	b, err := base64.StdEncoding.Strict().DecodeString(l)
	if err != nil {
		return false
	}
	n := len(b) - nonceBytes - tagBytes
	return n >= padBlock && n%padBlock == 0 && len(b) <= maxLineBytes
}

// parseBody splits a request body into lines and validates every one. A body
// with any invalid line is rejected as a whole. Empty lines are ignored.
func parseBody(body []byte) ([]string, error) {
	var out []string
	sc := bufio.NewScanner(bytes.NewReader(body))
	sc.Buffer(make([]byte, 64*1024), maxAccountBytes+1)
	for sc.Scan() {
		l := strings.TrimSpace(sc.Text())
		if l == "" {
			continue
		}
		if !validLine(l) {
			return nil, errFormat
		}
		out = append(out, l)
	}
	if err := sc.Err(); err != nil {
		return nil, errFormat
	}
	return out, nil
}

// accountOf derives the account name from the token: hex(SHA-256(token bytes)).
// The token is sent as 64 lowercase hex characters (32 bytes).
func accountOf(token string) (string, bool) {
	raw, err := hex.DecodeString(token)
	if err != nil || len(raw) != 32 || strings.ToLower(token) != token {
		return "", false
	}
	sum := sha256.Sum256(raw)
	return hex.EncodeToString(sum[:]), true
}

func etagOf(data []byte) string {
	sum := sha256.Sum256(data)
	return `"` + hex.EncodeToString(sum[:16]) + `"`
}

// Relay stores one file of encrypted lines per account. It never decrypts.
type Relay struct {
	dir   string
	mu    sync.Mutex
	locks map[string]*sync.Mutex
	now   func() time.Time
}

func newRelay(dir string) (*Relay, error) {
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return nil, err
	}
	return &Relay{dir: dir, locks: map[string]*sync.Mutex{}, now: time.Now}, nil
}

func (r *Relay) lock(acc string) func() {
	r.mu.Lock()
	m, ok := r.locks[acc]
	if !ok {
		m = &sync.Mutex{}
		r.locks[acc] = m
	}
	r.mu.Unlock()
	m.Lock()
	return m.Unlock
}

func (r *Relay) path(acc, ext string) string { return filepath.Join(r.dir, acc+ext) }

// touch records the day of the last access (used for deleting inactive accounts).
func (r *Relay) touch(acc string) {
	day := r.now().UTC().Format("2006-01-02")
	p := r.path(acc, ".seen")
	if b, err := os.ReadFile(p); err == nil && strings.TrimSpace(string(b)) == day {
		return
	}
	os.WriteFile(p, []byte(day+"\n"), 0o600)
}

func (r *Relay) exists(acc string) bool {
	_, err := os.Stat(r.path(acc, ".enc"))
	return err == nil
}

// Get returns the stored file and its ETag. A missing account is an empty file.
func (r *Relay) Get(acc string) ([]byte, string, error) {
	defer r.lock(acc)()
	data, err := os.ReadFile(r.path(acc, ".enc"))
	if err != nil && !os.IsNotExist(err) {
		return nil, "", err
	}
	if err == nil {
		r.touch(acc)
	}
	return data, etagOf(data), nil
}

// Append adds lines to the account file in one write followed by fsync.
func (r *Relay) Append(acc string, lines []string) (string, error) {
	defer r.lock(acc)()
	p := r.path(acc, ".enc")
	cur, err := os.ReadFile(p)
	if err != nil && !os.IsNotExist(err) {
		return "", err
	}
	var buf bytes.Buffer
	if len(cur) > 0 && cur[len(cur)-1] != '\n' {
		buf.WriteByte('\n') // repair a truncated last write
	}
	for _, l := range lines {
		buf.WriteString(l)
		buf.WriteByte('\n')
	}
	if len(cur)+buf.Len() > maxAccountBytes {
		return "", errTooLarge
	}
	f, err := os.OpenFile(p, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o600)
	if err != nil {
		return "", err
	}
	if _, err := f.Write(buf.Bytes()); err != nil {
		f.Close()
		return "", err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return "", err
	}
	if err := f.Close(); err != nil {
		return "", err
	}
	r.touch(acc)
	return etagOf(append(cur, buf.Bytes()...)), nil
}

// Replace writes a new file if the current one still has the given ETag.
// The previous file is kept as <account>.enc.prev.
func (r *Relay) Replace(acc string, lines []string, ifMatch string) (string, error) {
	defer r.lock(acc)()
	p := r.path(acc, ".enc")
	cur, err := os.ReadFile(p)
	if err != nil && !os.IsNotExist(err) {
		return "", err
	}
	if etagOf(cur) != ifMatch {
		return "", errChanged
	}
	var buf bytes.Buffer
	for _, l := range lines {
		buf.WriteString(l)
		buf.WriteByte('\n')
	}
	if buf.Len() > maxAccountBytes {
		return "", errTooLarge
	}
	tmp := p + ".tmp"
	f, err := os.OpenFile(tmp, os.O_CREATE|os.O_TRUNC|os.O_WRONLY, 0o600)
	if err != nil {
		return "", err
	}
	if _, err := f.Write(buf.Bytes()); err != nil {
		f.Close()
		return "", err
	}
	if err := f.Sync(); err != nil {
		f.Close()
		return "", err
	}
	f.Close()
	if len(cur) > 0 {
		if err := os.WriteFile(p+".prev", cur, 0o600); err != nil {
			return "", err
		}
	}
	if err := os.Rename(tmp, p); err != nil {
		return "", err
	}
	if d, err := os.Open(r.dir); err == nil {
		d.Sync()
		d.Close()
	}
	r.touch(acc)
	return etagOf(buf.Bytes()), nil
}

// Delete removes all files of an account.
func (r *Relay) Delete(acc string) error {
	defer r.lock(acc)()
	for _, ext := range []string{".enc", ".enc.prev", ".enc.tmp", ".seen", ".clip", ".clip.tmp"} {
		if err := os.Remove(r.path(acc, ext)); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return nil
}

// Expire deletes accounts whose last access is older than inactiveDays.
func (r *Relay) Expire() (int, error) {
	cutoff := r.now().UTC().AddDate(0, 0, -inactiveDays).Format("2006-01-02")
	seen, err := filepath.Glob(filepath.Join(r.dir, "*.seen"))
	if err != nil {
		return 0, err
	}
	n := 0
	for _, s := range seen {
		b, err := os.ReadFile(s)
		if err != nil {
			continue
		}
		if day := strings.TrimSpace(string(b)); day != "" && day < cutoff {
			acc := strings.TrimSuffix(filepath.Base(s), ".seen")
			if err := r.Purge(acc); err != nil {
				return n, fmt.Errorf("expire %s: %w", acc, err)
			}
			n++
		}
	}
	// Clipboard items older than clipTTL go as well, read or not.
	clips, _ := filepath.Glob(filepath.Join(r.dir, "*.clip"))
	for _, c := range clips {
		if st, err := os.Stat(c); err == nil && r.now().Sub(st.ModTime()) > clipTTL {
			acc := strings.TrimSuffix(filepath.Base(c), ".clip")
			r.ClipDelete(acc)
		}
	}
	return n, nil
}

// ClipGet returns the stored clipboard item of an account and its ETag; none is empty.
func (r *Relay) ClipGet(acc string) ([]byte, string, error) {
	defer r.lock(acc)()
	p := r.path(acc, ".clip")
	if st, err := os.Stat(p); err == nil && r.now().Sub(st.ModTime()) > clipTTL {
		if err := os.Remove(p); err != nil && !os.IsNotExist(err) {
			return nil, "", err
		}
		return nil, "", nil
	}
	data, err := os.ReadFile(p)
	if err != nil && !os.IsNotExist(err) {
		return nil, "", err
	}
	if len(data) == 0 {
		return nil, "", nil
	}
	return data, etagOf(data), nil
}

// ClipPut replaces the clipboard item; there is only one per account.
func (r *Relay) ClipPut(acc string, data []byte) (string, error) {
	defer r.lock(acc)()
	if len(data) > maxClipBytes {
		return "", errTooLarge
	}
	p := r.path(acc, ".clip")
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return "", err
	}
	if err := os.Rename(tmp, p); err != nil {
		return "", err
	}
	r.touch(acc)
	return etagOf(data), nil
}

// ClipDelete removes the clipboard item.
func (r *Relay) ClipDelete(acc string) error {
	defer r.lock(acc)()
	if err := os.Remove(r.path(acc, ".clip")); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}
