package main

// Members of a journal (architecture 8.4a). Everyone who shares a journal uses
// the same token, so the service cannot tell people apart. Each client sends a
// member ID with every request: HMAC-SHA256 over the journal's account ID, keyed
// with a secret of the user's own default journal that the service never sees.
// The ID is the same on all devices of a person, different for every journal,
// and reveals neither the person's account nor anything about the journal.
//
// The service keeps, per journal, the member IDs and when each was last seen,
// in memory only. With -members-dir the table is also written to that
// directory (one file per journal) and read back at start; it is off by default.

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

const (
	memberHeader = "X-Agenda-Member"
	memberKeep   = 30 * 24 * time.Hour // IDs not seen for this long are dropped
	memberMax    = 200                 // per journal; the oldest is dropped beyond
)

var memberPattern = regexp.MustCompile(`^[0-9a-f]{64}$`)

// anonymousMember is sent by a client that only looks whether a journal exists, before
// the person has decided to use it (architecture 8.4a); it is not counted.
var anonymousMember = strings.Repeat("0", 64)

type members struct {
	mu    sync.Mutex
	seen  map[string]map[string]time.Time // account -> member -> last seen
	since time.Time                       // start of the record
	dir   string                          // "" = memory only
	dirty map[string]bool
}

func newMembers(dir string) *members {
	m := &members{seen: map[string]map[string]time.Time{}, since: time.Now().UTC(), dir: dir, dirty: map[string]bool{}}
	if dir == "" {
		return m
	}
	if err := os.MkdirAll(dir, 0o700); err != nil {
		log.Printf("members dir %s: %v (kept in memory only)", dir, err)
		m.dir = ""
		return m
	}
	if b, err := os.ReadFile(filepath.Join(dir, "since")); err == nil {
		if t, err := time.Parse(time.RFC3339, string(b)); err == nil {
			m.since = t
		}
	} else {
		os.WriteFile(filepath.Join(dir, "since"), []byte(m.since.Format(time.RFC3339)), 0o600)
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*.json"))
	for _, f := range files {
		acc := filepath.Base(f[:len(f)-len(".json")])
		if !memberPattern.MatchString(acc) {
			continue
		}
		var tab map[string]time.Time
		if b, err := os.ReadFile(f); err == nil && json.Unmarshal(b, &tab) == nil {
			m.seen[acc] = tab
		}
	}
	return m
}

// touch records that member id used journal acc now.
func (m *members) touch(acc, id string) {
	if id == anonymousMember {
		return
	}
	m.mu.Lock()
	defer m.mu.Unlock()
	tab := m.seen[acc]
	if tab == nil {
		tab = map[string]time.Time{}
		m.seen[acc] = tab
	}
	now := time.Now().UTC().Truncate(time.Minute)
	if prev, ok := tab[id]; ok && prev.Equal(now) {
		return
	}
	tab[id] = now
	if len(tab) > memberMax {
		var oldest string
		for k, t := range tab {
			if oldest == "" || t.Before(tab[oldest]) {
				oldest = k
			}
		}
		delete(tab, oldest)
	}
	m.dirty[acc] = true
}

type memberView struct {
	ID   string    `json:"id"` // the first 16 hex characters; enough to recognise one's own
	Last time.Time `json:"last"`
}

// list returns the members of journal acc, most recent first.
func (m *members) list(acc string) (time.Time, []memberView) {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := []memberView{}
	for id, t := range m.seen[acc] {
		out = append(out, memberView{ID: id[:16], Last: t})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Last.After(out[j].Last) })
	return m.since, out
}

// forget drops journal acc (deleted account).
func (m *members) forget(acc string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.seen, acc)
	m.dirty[acc] = true
}

// sweep drops old entries and, with a directory, writes changed tables.
func (m *members) sweep() {
	m.mu.Lock()
	defer m.mu.Unlock()
	cut := time.Now().Add(-memberKeep)
	for acc, tab := range m.seen {
		for id, t := range tab {
			if t.Before(cut) {
				delete(tab, id)
				m.dirty[acc] = true
			}
		}
		if len(tab) == 0 {
			delete(m.seen, acc)
		}
	}
	if m.dir == "" {
		m.dirty = map[string]bool{}
		return
	}
	for acc := range m.dirty {
		p := filepath.Join(m.dir, acc+".json")
		tab, ok := m.seen[acc]
		if !ok {
			os.Remove(p)
			continue
		}
		b, _ := json.Marshal(tab)
		tmp := p + ".tmp"
		if os.WriteFile(tmp, b, 0o600) == nil {
			os.Rename(tmp, p)
		}
	}
	m.dirty = map[string]bool{}
}
