// agenda-service: relay for encrypted agenda journals (docs/architecture.md, 8.4).
//
// The service stores one file of encrypted lines per account and hands it back.
// It holds no key and never decrypts, merges or compacts; clients do.
//
//	POST   /append    append encrypted lines (creates the account on first use)
//	GET    /journal   the stored file (ETag, If-None-Match)
//	PUT    /journal   replace the file; requires If-Match (compaction by a client)
//	DELETE /journal   delete the account
//	GET    /members   who uses the journal: member IDs with last use (members.go)
//	GET    /clip      the one encrypted clipboard item of the account (ETag; HEAD for presence)
//	PUT    /clip      replace it (owner only, at most 4 MB of content)
//	DELETE /clip      remove it
//	GET    /health    service name and version, for a connection test; stores nothing
//	GET    /          web application
//
// The account is identified by what the request proves (auth.go): a version 1
// token ("Authorization: Bearer <64 hex>", account = hex(SHA-256(token))) or a
// version 2 read, write or delete token (owner, ally, guest; architecture 8.11e).
// Every request also carries a member ID ("X-Agenda-Member: <64 hex>", members.go).
package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"flag"
	"io"
	"log"
	"mime"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/outheis-labs/outheis-agenda/clients/web"
)

var (
	listenAddr = flag.String("listen", "127.0.0.1:41380", "listen address")
	dataDir    = flag.String("data", "accounts", "directory for account files")
	membersDir = flag.String("members-dir", "", "keep the member table of each journal also in this directory (default: memory only)")
)

// Rate limits (architecture 8.4, open issue 5).
const (
	writesPerMinute     = 60  // per account
	readsPerMinute      = 240 // per account
	newAccountsPerIPDay = 10
	requestsPerIPMinute = 1200 // against abuse only: several devices behind one router share it

	// Pace per journal and member: a burst of paceBurst requests (one sync), then one per
	// second. A request beyond waits for its turn (at most maxPaceWait) instead of being
	// refused, so that a client that asks too often is slowed down without seeing errors.
	paceInterval = time.Second
	paceBurst    = 6
	maxPaceWait  = 10 * time.Second
)

type server struct {
	relay   *Relay
	writes  *window
	reads   *window
	newAcc  *window
	perIP   *window
	pace    *pacer
	members *members
}

func cors(w http.ResponseWriter) {
	h := w.Header()
	h.Set("Access-Control-Allow-Origin", "*")
	h.Set("Access-Control-Allow-Headers", "Authorization, If-None-Match, If-Match, Content-Type, X-Agenda-Member, X-Agenda-Fingerprint, X-Agenda-Read-Hash, X-Agenda-Owner")
	h.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	h.Set("Access-Control-Expose-Headers", "ETag, Retry-After")
}

func (s *server) handleJournal(w http.ResponseWriter, r *http.Request) {
	cors(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	ip := clientIP(r)
	if !s.perIP.allow(ip) {
		tooMany(w, 60)
		return
	}
	acc, level := authorize(r)
	if level == accessNone {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}
	forbidden := func() { http.Error(w, "not allowed with this code", http.StatusForbidden) }
	member := r.Header.Get(memberHeader)
	if !memberPattern.MatchString(member) {
		http.Error(w, "member ID required (update the app)", http.StatusBadRequest)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	if d, ok := s.pace.wait(acc + "/" + member); !ok {
		tooMany(w, int(d/time.Second)+1)
		return
	} else if d > 0 {
		select {
		case <-time.After(d):
		case <-r.Context().Done():
			return
		}
	}

	switch {
	case r.URL.Path == "/journal" && (r.Method == http.MethodGet || r.Method == http.MethodHead):
		if !level.canRead() {
			forbidden()
			return
		}
		if !s.reads.allow(acc) {
			tooMany(w, 60)
			return
		}
		data, etag, err := s.relay.Get(acc)
		if err != nil {
			s.fail(w, err)
			return
		}
		if len(data) > 0 {
			s.members.touch(acc, member)
		}
		w.Header().Set("ETag", etag)
		if r.Header.Get("If-None-Match") == etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		w.Write(data)

	case r.URL.Path == "/append" && r.Method == http.MethodPost,
		r.URL.Path == "/journal" && r.Method == http.MethodPut:
		if !level.canWrite() {
			forbidden()
			return
		}
		if !s.writes.allow(acc) {
			tooMany(w, 60)
			return
		}
		if !s.relay.exists(acc) && !s.newAcc.allow(ip) {
			w.Header().Set("Retry-After", "3600")
			http.Error(w, "too many new accounts", http.StatusTooManyRequests)
			return
		}
		body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxAccountBytes+1))
		if err != nil {
			http.Error(w, "body too large", http.StatusRequestEntityTooLarge)
			return
		}
		lines, err := parseBody(body)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		var etag string
		if r.Method == http.MethodPost {
			if len(lines) == 0 {
				http.Error(w, "no lines", http.StatusBadRequest)
				return
			}
			etag, err = s.relay.Append(acc, lines)
		} else {
			if !level.canReplace() {
				http.Error(w, "only the owner may replace the journal", http.StatusForbidden)
				return
			}
			im := r.Header.Get("If-Match")
			if im == "" {
				http.Error(w, "If-Match required", http.StatusPreconditionRequired)
				return
			}
			etag, err = s.relay.Replace(acc, lines, im)
		}
		if err != nil {
			s.fail(w, err)
			return
		}
		s.members.touch(acc, member)
		w.Header().Set("ETag", etag)
		w.WriteHeader(http.StatusNoContent)

	case r.URL.Path == "/members" && r.Method == http.MethodGet:
		if !level.canRead() {
			forbidden()
			return
		}
		if !s.reads.allow(acc) {
			tooMany(w, 60)
			return
		}
		s.members.touch(acc, member)
		since, list := s.members.list(acc)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{"since": since, "members": list})

	// The clipboard (architecture 8.15): one encrypted item per account, for the owner only,
	// to move a picture, a file or a text between one's own devices.
	case r.URL.Path == "/clip":
		if !level.canReplace() {
			http.Error(w, "the clipboard belongs to the owner", http.StatusForbidden)
			return
		}
		switch r.Method {
		case http.MethodGet, http.MethodHead:
			if !s.reads.allow(acc) {
				tooMany(w, 60)
				return
			}
			data, etag, err := s.relay.ClipGet(acc)
			if err != nil {
				s.fail(w, err)
				return
			}
			if len(data) == 0 {
				http.Error(w, "empty", http.StatusNotFound)
				return
			}
			w.Header().Set("ETag", etag)
			if r.Header.Get("If-None-Match") == etag {
				w.WriteHeader(http.StatusNotModified)
				return
			}
			w.Header().Set("Content-Type", "application/octet-stream")
			w.Header().Set("Content-Length", strconv.Itoa(len(data)))
			if r.Method == http.MethodGet {
				w.Write(data)
			}
		case http.MethodPut:
			if !s.writes.allow(acc) {
				tooMany(w, 60)
				return
			}
			if !s.relay.exists(acc) {
				http.Error(w, "no such journal", http.StatusNotFound)
				return
			}
			body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxClipBytes+1))
			if err != nil || len(body) > maxClipBytes {
				http.Error(w, "too large for the clipboard", http.StatusRequestEntityTooLarge)
				return
			}
			if len(body) == 0 {
				http.Error(w, "empty", http.StatusBadRequest)
				return
			}
			etag, err := s.relay.ClipPut(acc, body)
			if err != nil {
				s.fail(w, err)
				return
			}
			w.Header().Set("ETag", etag)
			w.WriteHeader(http.StatusNoContent)
		case http.MethodDelete:
			if err := s.relay.ClipDelete(acc); err != nil {
				s.fail(w, err)
				return
			}
			w.WriteHeader(http.StatusNoContent)
		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}

	case r.URL.Path == "/journal" && r.Method == http.MethodDelete:
		if !level.canDelete() {
			forbidden()
			return
		}
		if err := s.relay.Delete(acc); err != nil {
			s.fail(w, err)
			return
		}
		s.members.forget(acc)
		w.WriteHeader(http.StatusNoContent)

	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

// tooMany refuses a request and says after how many seconds to ask again.
func tooMany(w http.ResponseWriter, seconds int) {
	w.Header().Set("Retry-After", strconv.Itoa(seconds))
	http.Error(w, "too many requests", http.StatusTooManyRequests)
}

func (s *server) fail(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, errChanged):
		http.Error(w, "journal changed", http.StatusPreconditionFailed)
	case errors.Is(err, errTooLarge):
		http.Error(w, "account size limit reached", http.StatusRequestEntityTooLarge)
	default:
		log.Printf("storage error: %v", err)
		http.Error(w, "storage error", http.StatusInternalServerError)
	}
}

// housekeeping deletes inactive accounts and clears rate-limit state once a day.
func (s *server) housekeeping() {
	for {
		if n, err := s.relay.Expire(); err != nil {
			log.Printf("expire: %v", err)
		} else if n > 0 {
			log.Printf("deleted %d inactive accounts", n)
		}
		for i := 0; i < 24*60; i++ {
			time.Sleep(time.Minute)
			s.writes.sweep()
			s.reads.sweep()
			s.perIP.sweep()
			s.pace.sweep()
			s.members.sweep()
			if i%60 == 0 {
				s.newAcc.sweep()
			}
		}
	}
}

func newServer(relay *Relay, m *members) *server {
	return &server{
		members: m,
		relay:   relay,
		writes:  newWindow(time.Minute, writesPerMinute),
		reads:   newWindow(time.Minute, readsPerMinute),
		newAcc:  newWindow(24*time.Hour, newAccountsPerIPDay),
		perIP:   newWindow(time.Minute, requestsPerIPMinute),
		pace:    newPacer(paceInterval, paceBurst, maxPaceWait),
	}
}

func (s *server) mux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/journal", s.handleJournal)
	mux.HandleFunc("/append", s.handleJournal)
	mux.HandleFunc("/members", s.handleJournal)
	mux.HandleFunc("/clip", s.handleJournal)
	mux.HandleFunc("/health", handleHealth)
	files := http.FileServer(http.FS(web.FS))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		securityHeaders(w)
		if r.URL.Path == "/" || r.URL.Path == "/index.html" {
			serveIndex(w, r)
			return
		}
		files.ServeHTTP(w, r)
	})
	return mux
}

// handleHealth answers the connection test of the clients (ui.md 1a): which service
// answers and in which version. It reads no account and stores nothing.
func handleHealth(w http.ResponseWriter, r *http.Request) {
	cors(w)
	switch r.Method {
	case http.MethodOptions:
		w.WriteHeader(http.StatusNoContent)
		return
	case http.MethodGet, http.MethodHead:
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	if r.Method == http.MethodHead {
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"service": "outheis-agenda", "version": web.Version()})
}

// securityHeaders limits what the page may load and where it may be framed (audit S5).
// The app is one file with inline script and style and embedded fonts; it talks to its
// own service or to another one the user configured (https).
func securityHeaders(w http.ResponseWriter) {
	h := w.Header()
	h.Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' data: blob: about:; worker-src 'self'; manifest-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
	h.Set("X-Content-Type-Options", "nosniff")
	h.Set("Referrer-Policy", "no-referrer")
}

// The page carries absolute addresses for link previews (og:image); messengers
// need them with scheme and host. They are taken from the request, so the binary
// needs no configuration of its domain.
var hostPattern = regexp.MustCompile(`^[A-Za-z0-9.\-]+(:[0-9]+)?$`)

func requestOrigin(r *http.Request) string {
	scheme := "http"
	if r.TLS != nil {
		scheme = "https"
	}
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		if ip := net.ParseIP(host); ip != nil && ip.IsLoopback() && r.Header.Get("X-Forwarded-Proto") == "https" {
			scheme = "https"
		}
	}
	host := r.Host
	if !hostPattern.MatchString(host) {
		host = "localhost"
	}
	return scheme + "://" + host
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	page, err := web.FS.ReadFile("index.html")
	if err != nil {
		http.Error(w, "missing page", http.StatusInternalServerError)
		return
	}
	page = bytes.ReplaceAll(page, []byte("@@ORIGIN@@"), []byte(requestOrigin(r)))
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	if r.Method == http.MethodHead {
		return
	}
	w.Write(page)
}

func main() {
	flag.Parse()
	mime.AddExtensionType(".webmanifest", "application/manifest+json")
	relay, err := newRelay(*dataDir)
	if err != nil {
		log.Fatalf("data directory %s: %v", *dataDir, err)
	}
	s := newServer(relay, newMembers(*membersDir))
	go s.housekeeping()
	if *membersDir != "" {
		log.Printf("member tables kept in %s", *membersDir)
	}
	log.Printf("agenda-service listening on http://%s, data in %s", *listenAddr, *dataDir)
	log.Fatal(http.ListenAndServe(*listenAddr, s.mux()))
}
