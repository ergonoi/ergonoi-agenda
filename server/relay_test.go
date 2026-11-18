package main

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"
)

const testMember = "aa00000000000000000000000000000000000000000000000000000000000000"

func line(blocks int) string {
	b := make([]byte, nonceBytes+tagBytes+blocks*padBlock)
	rand.Read(b)
	return base64.StdEncoding.EncodeToString(b)
}

func token() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func do(t *testing.T, h http.Handler, method, path, tok, body string, hdr map[string]string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	if tok != "" {
		req.Header.Set("Authorization", "Bearer "+tok)
		req.Header.Set(memberHeader, testMember)
	}
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func testServer(t *testing.T) (*server, http.Handler) {
	relay, err := newRelay(t.TempDir())
	if err != nil {
		t.Fatal(err)
	}
	s := newServer(relay, newMembers(""))
	return s, s.mux()
}

func TestLineFormat(t *testing.T) {
	if !validLine(line(1)) || !validLine(line(15)) {
		t.Fatal("valid lines rejected")
	}
	if validLine(line(16)) {
		t.Fatal("line above 4096 bytes accepted")
	}
	b := make([]byte, nonceBytes+tagBytes+100)
	if validLine(base64.StdEncoding.EncodeToString(b)) {
		t.Fatal("unpadded line accepted")
	}
	if validLine("plain text #facet-self") {
		t.Fatal("plain text accepted")
	}
}

func TestAppendGetReplace(t *testing.T) {
	_, h := testServer(t)
	tok := token()
	if r := do(t, h, "GET", "/journal", "", "", nil); r.Code != 401 {
		t.Fatalf("no token: %d", r.Code)
	}
	if r := do(t, h, "GET", "/journal", "ABC", "", nil); r.Code != 401 {
		t.Fatalf("bad token: %d", r.Code)
	}
	l1, l2 := line(1), line(2)
	if r := do(t, h, "POST", "/append", tok, l1+"\n"+l2+"\n", nil); r.Code != 204 {
		t.Fatalf("append: %d %s", r.Code, r.Body)
	}
	r := do(t, h, "GET", "/journal", tok, "", nil)
	if r.Code != 200 || r.Body.String() != l1+"\n"+l2+"\n" {
		t.Fatalf("get: %d %q", r.Code, r.Body)
	}
	etag := r.Header().Get("ETag")
	if r := do(t, h, "GET", "/journal", tok, "", map[string]string{"If-None-Match": etag}); r.Code != 304 {
		t.Fatalf("not modified: %d", r.Code)
	}
	// Another account sees nothing.
	if r := do(t, h, "GET", "/journal", token(), "", nil); r.Code != 200 || r.Body.Len() != 0 {
		t.Fatalf("other account: %d %q", r.Code, r.Body)
	}
	// Replace needs If-Match and fails after a concurrent append.
	if r := do(t, h, "PUT", "/journal", tok, l1+"\n", nil); r.Code != 428 {
		t.Fatalf("put without If-Match: %d", r.Code)
	}
	do(t, h, "POST", "/append", tok, line(1)+"\n", nil)
	if r := do(t, h, "PUT", "/journal", tok, l1+"\n", map[string]string{"If-Match": etag}); r.Code != 412 {
		t.Fatalf("stale put: %d", r.Code)
	}
	cur := do(t, h, "GET", "/journal", tok, "", nil).Header().Get("ETag")
	if r := do(t, h, "PUT", "/journal", tok, l1+"\n", map[string]string{"If-Match": cur}); r.Code != 204 {
		t.Fatalf("put: %d %s", r.Code, r.Body)
	}
	if r := do(t, h, "GET", "/journal", tok, "", nil); r.Body.String() != l1+"\n" {
		t.Fatalf("after put: %q", r.Body)
	}
	if r := do(t, h, "DELETE", "/journal", tok, "", nil); r.Code != 204 {
		t.Fatalf("delete: %d", r.Code)
	}
	if r := do(t, h, "GET", "/journal", tok, "", nil); r.Code != http.StatusGone {
		t.Fatalf("after delete: %d %q", r.Code, r.Body)
	}
}

func TestRejectInvalidBody(t *testing.T) {
	_, h := testServer(t)
	tok := token()
	if r := do(t, h, "POST", "/append", tok, line(1)+"\nnot base64 at all\n", nil); r.Code != 400 {
		t.Fatalf("invalid body: %d", r.Code)
	}
	if r := do(t, h, "GET", "/journal", tok, "", nil); r.Body.Len() != 0 {
		t.Fatalf("partial write: %q", r.Body)
	}
}

func TestSizeLimit(t *testing.T) {
	s, h := testServer(t)
	s.writes = newWindow(time.Minute, 1<<20)
	tok := token()
	big := strings.Repeat(line(15)+"\n", 300) // about 1.6 MB per request
	var code int
	for i := 0; i < 5; i++ {
		code = do(t, h, "POST", "/append", tok, big, nil).Code
	}
	if code != 413 {
		t.Fatalf("size limit not enforced: %d", code)
	}
	if r := do(t, h, "GET", "/journal", tok, "", nil); r.Body.Len() > maxAccountBytes {
		t.Fatalf("file exceeds limit: %d", r.Body.Len())
	}
}

func TestNewAccountLimitPerIP(t *testing.T) {
	_, h := testServer(t)
	var last int
	for i := 0; i <= newAccountsPerIPDay; i++ {
		last = do(t, h, "POST", "/append", token(), line(1)+"\n", nil).Code
	}
	if last != 429 {
		t.Fatalf("account creation not limited: %d", last)
	}
}

func TestForwardedForOnlyFromLoopback(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.RemoteAddr = "127.0.0.1:5000"
	r.Header.Set("X-Forwarded-For", "203.0.113.7")
	if clientIP(r) != "203.0.113.7" {
		t.Fatal("proxy header ignored")
	}
	r.RemoteAddr = "198.51.100.1:5000"
	if clientIP(r) != "198.51.100.1" {
		t.Fatal("forged header trusted")
	}
}

func TestExpireInactive(t *testing.T) {
	relay, _ := newRelay(t.TempDir())
	acc, _ := accountOf(token())
	relay.Append(acc, []string{line(1)})
	old := time.Now().AddDate(-6, 0, 0)
	relay.now = func() time.Time { return old }
	relay.touch(acc)
	os.WriteFile(relay.path(acc, ".seen"), []byte(old.Format("2006-01-02")+"\n"), 0o600)
	relay.now = time.Now
	if n, err := relay.Expire(); err != nil || n != 1 {
		t.Fatalf("expire: %d %v", n, err)
	}
	if relay.exists(acc) {
		t.Fatal("account not deleted")
	}
}

func TestIndexOriginForLinkPreview(t *testing.T) {
	s := newServer(nil, newMembers(""))
	h := s.mux()
	req := httptest.NewRequest("GET", "/", nil)
	req.Host = "agenda.example.org"
	req.RemoteAddr = "127.0.0.1:5000"
	req.Header.Set("X-Forwarded-Proto", "https")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	body := rec.Body.String()
	if !strings.Contains(body, `content="https://agenda.example.org/og-image.png"`) {
		t.Fatalf("og:image not absolute: %d", rec.Code)
	}
	req = httptest.NewRequest("GET", "/", nil)
	req.Host = `evil"><script>`
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if strings.Contains(rec.Body.String(), "<script>\"") || strings.Contains(rec.Body.String(), `evil"`) {
		t.Fatal("host not sanitised")
	}
	req = httptest.NewRequest("GET", "/og-image.png", nil)
	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != 200 || rec.Header().Get("Content-Type") != "image/png" {
		t.Fatalf("og-image: %d %s", rec.Code, rec.Header().Get("Content-Type"))
	}
}

func TestMemberRequired(t *testing.T) {
	_, h := testServer(t)
	req := httptest.NewRequest("GET", "/journal", nil)
	req.Header.Set("Authorization", "Bearer "+token())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("without member ID: %d, want 400", rec.Code)
	}
}

func TestMembersListed(t *testing.T) {
	_, h := testServer(t)
	tok := token()
	other := "bb" + strings.Repeat("0", 62)
	if rec := do(t, h, "POST", "/append", tok, line(1)+"\n", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("append: %d", rec.Code)
	}
	do(t, h, "GET", "/journal", tok, "", map[string]string{memberHeader: other})
	rec := do(t, h, "GET", "/members", tok, "", nil)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Body.String(), testMember[:16]) || !strings.Contains(rec.Body.String(), other[:16]) {
		t.Fatalf("members: %d %s", rec.Code, rec.Body.String())
	}
	if strings.Contains(rec.Body.String(), testMember) {
		t.Fatal("full member ID must not be returned")
	}
}

func TestMembersPersistOnlyWithDir(t *testing.T) {
	dir := t.TempDir()
	m := newMembers(dir)
	acc, _ := accountOf(token())
	m.touch(acc, testMember)
	m.sweep()
	if _, err := os.Stat(dir + "/" + acc + ".json"); err != nil {
		t.Fatalf("not written: %v", err)
	}
	if _, l := newMembers(dir).list(acc); len(l) != 1 {
		t.Fatalf("not read back: %v", l)
	}
	mem := newMembers("")
	mem.touch(acc, testMember)
	mem.sweep() // must not write anywhere
}

func TestHealth(t *testing.T) {
	_, h := testServer(t)
	rec := do(t, h, "GET", "/health", "", "", nil)
	if rec.Code != 200 || rec.Header().Get("Access-Control-Allow-Origin") != "*" || rec.Header().Get("Cache-Control") != "no-store" {
		t.Fatalf("health: %d %v", rec.Code, rec.Header())
	}
	var v map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &v); err != nil || v["service"] != "outheis-agenda" || v["version"] == "" {
		t.Fatalf("health body: %q", rec.Body.String())
	}
	if rec := do(t, h, "POST", "/health", "", "", nil); rec.Code != 405 {
		t.Fatalf("POST /health: %d", rec.Code)
	}
}
