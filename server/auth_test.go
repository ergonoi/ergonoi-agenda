package main

import (
	"encoding/hex"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// v2 holds the tokens of one version 2 journal (architecture 8.11e).
type v2 struct{ d, w, r, fp, rh string }

func newV2() v2 {
	d, _ := hex.DecodeString(token())
	w, _ := hex.DecodeString(token())
	r := readTokenOf(w)
	return v2{
		d:  hex.EncodeToString(d),
		w:  hex.EncodeToString(w),
		r:  hex.EncodeToString(r),
		fp: hex.EncodeToString(fingerprintOf(d)),
		rh: hex.EncodeToString(sha(r)),
	}
}

func doV2(t *testing.T, h http.Handler, method, path, auth string, hdr map[string]string, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Authorization", auth)
	req.Header.Set(memberHeader, testMember)
	for k, v := range hdr {
		req.Header.Set(k, v)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestV2Levels(t *testing.T) {
	relay, _ := newRelay(t.TempDir())
	h := newServer(relay, newMembers("")).mux()
	j := newV2()
	fp := map[string]string{fingerprintHeader: j.fp}

	// An ally (write token) creates the journal and reads it.
	if rec := doV2(t, h, "POST", "/append", "Write "+j.w, fp, line(1)); rec.Code != 204 {
		t.Fatalf("ally append: %d %s", rec.Code, rec.Body)
	}
	if rec := doV2(t, h, "GET", "/journal", "Write "+j.w, fp, ""); rec.Code != 200 || rec.Body.Len() == 0 {
		t.Fatalf("ally read: %d", rec.Code)
	}
	// A guest (read token) reads the same file, but may not write or delete.
	rec := doV2(t, h, "GET", "/journal", "Read "+j.r, fp, "")
	if rec.Code != 200 || rec.Body.Len() == 0 {
		t.Fatalf("guest read: %d", rec.Code)
	}
	etag := rec.Header().Get("ETag")
	if rec := doV2(t, h, "POST", "/append", "Read "+j.r, fp, line(1)); rec.Code != 403 {
		t.Fatalf("guest append: %d", rec.Code)
	}
	if rec := doV2(t, h, "PUT", "/journal", "Read "+j.r, map[string]string{fingerprintHeader: j.fp, "If-Match": etag}, line(1)); rec.Code != 403 {
		t.Fatalf("guest replace: %d", rec.Code)
	}
	if rec := doV2(t, h, "DELETE", "/journal", "Read "+j.r, fp, ""); rec.Code != 403 {
		t.Fatalf("guest delete: %d", rec.Code)
	}
	// The ally may not delete either: Write cannot delete, and without D the
	// fingerprint does not prove anything.
	if rec := doV2(t, h, "DELETE", "/journal", "Write "+j.w, fp, ""); rec.Code != 403 {
		t.Fatalf("ally delete: %d", rec.Code)
	}
	// Whoever has only the fingerprint cannot delete: it is no valid D.
	if rec := doV2(t, h, "DELETE", "/journal", "Delete "+j.fp, map[string]string{readHashHeader: j.rh}, ""); rec.Code != 401 {
		t.Fatalf("fingerprint as D: %d", rec.Code)
	}
	if rec := doV2(t, h, "GET", "/journal", "Read "+j.r, fp, ""); rec.Body.Len() == 0 {
		t.Fatal("the journal must survive a delete with a wrong token")
	}
	// The owner deletes with D and the hash of R.
	if rec := doV2(t, h, "DELETE", "/journal", "Delete "+j.d, map[string]string{readHashHeader: j.rh}, ""); rec.Code != 204 {
		t.Fatalf("owner delete: %d", rec.Code)
	}
	if rec := doV2(t, h, "GET", "/journal", "Read "+j.r, fp, ""); rec.Code != 200 || rec.Body.Len() != 0 {
		t.Fatalf("after delete: %d %d", rec.Code, rec.Body.Len())
	}
	// A guest may see who uses the journal.
	if rec := doV2(t, h, "GET", "/members", "Read "+j.r, fp, ""); rec.Code != 200 {
		t.Fatalf("guest members: %d", rec.Code)
	}
}

func TestV2WrongFingerprintIsAnotherAccount(t *testing.T) {
	relay, _ := newRelay(t.TempDir())
	h := newServer(relay, newMembers("")).mux()
	j, k := newV2(), newV2()
	doV2(t, h, "POST", "/append", "Write "+j.w, map[string]string{fingerprintHeader: j.fp}, line(1))
	if rec := doV2(t, h, "GET", "/journal", "Read "+j.r, map[string]string{fingerprintHeader: k.fp}, ""); rec.Body.Len() != 0 {
		t.Fatal("a wrong fingerprint must not find the journal")
	}
}

func TestV2HeadersRequired(t *testing.T) {
	relay, _ := newRelay(t.TempDir())
	h := newServer(relay, newMembers("")).mux()
	j := newV2()
	for _, c := range []struct{ auth string }{{"Read " + j.r}, {"Write " + j.w}, {"Delete " + j.d}, {"Write " + strings.ToUpper(j.w)}, {"Other " + j.w}} {
		if rec := doV2(t, h, "GET", "/journal", c.auth, nil, ""); rec.Code != 401 {
			t.Fatalf("%s without headers: %d", strings.SplitN(c.auth, " ", 2)[0], rec.Code)
		}
	}
}

func TestV1StillWorks(t *testing.T) {
	relay, _ := newRelay(t.TempDir())
	h := newServer(relay, newMembers("")).mux()
	tok := token()
	if rec := do(t, h, "POST", "/append", tok, line(1), nil); rec.Code != 204 {
		t.Fatalf("v1 append: %d", rec.Code)
	}
	if rec := do(t, h, "DELETE", "/journal", tok, "", nil); rec.Code != 204 {
		t.Fatalf("v1 delete: %d", rec.Code)
	}
}

func TestReadTokenDerivation(t *testing.T) {
	// Fixed vector, so that clients can check their implementation.
	w, _ := hex.DecodeString("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")
	if got := hex.EncodeToString(readTokenOf(w)); got != "1abf8e051a666ee4556dc7802b26ea8ccbdba10e5b7933a822e3aabd13b50698" {
		t.Fatal(got)
	}
}

func TestAccountVector(t *testing.T) {
	// Fixed values, checked by the client tests (clients/core/test/keys.test.mjs).
	d, _ := hex.DecodeString("202122232425262728292a2b2c2d2e2f303132333435363738393a3b3c3d3e3f")
	w, _ := hex.DecodeString("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f")
	acc := accountV2(fingerprintOf(d), sha(readTokenOf(w)))
	if fmt.Sprintf("%x", fingerprintOf(d)) != "72dbb7336c76780023f83d" || acc != "672c022ed6a8b8533441efe1735fe3b86a2b3684ec5262f6ddb6ce31c890cefb" {
		t.Fatal(acc)
	}
}

// Replacing the file is the owner's (audit S2): an ally, who holds W but not D, may only
// append; a D that does not belong to the journal does not help.
func TestV2ReplaceOnlyByOwner(t *testing.T) {
	relay, _ := newRelay(t.TempDir())
	h := newServer(relay, newMembers("")).mux()
	j, k := newV2(), newV2()
	fp := map[string]string{fingerprintHeader: j.fp}
	doV2(t, h, "POST", "/append", "Write "+j.w, fp, line(1)+"\n"+line(2))
	etag := doV2(t, h, "GET", "/journal", "Write "+j.w, fp, "").Header().Get("ETag")
	if rec := doV2(t, h, "PUT", "/journal", "Write "+j.w, map[string]string{fingerprintHeader: j.fp, "If-Match": etag}, line(3)); rec.Code != 403 {
		t.Fatalf("ally replace: %d", rec.Code)
	}
	if rec := doV2(t, h, "PUT", "/journal", "Write "+j.w, map[string]string{fingerprintHeader: j.fp, "If-Match": etag, ownerHeader: k.d}, line(3)); rec.Code != 403 {
		t.Fatalf("replace with another journal's D: %d", rec.Code)
	}
	if rec := doV2(t, h, "PUT", "/journal", "Write "+j.w, map[string]string{fingerprintHeader: j.fp, "If-Match": etag, ownerHeader: j.d}, line(3)); rec.Code != 204 {
		t.Fatalf("owner replace: %d %s", rec.Code, rec.Body)
	}
}

func TestClipOwnerOnly(t *testing.T) {
	dir := t.TempDir()
	relay, _ := newRelay(dir)
	h := newServer(relay, newMembers("")).mux()
	j := newV2()
	fp := map[string]string{fingerprintHeader: j.fp}
	own := map[string]string{fingerprintHeader: j.fp, ownerHeader: j.d}
	if rec := doV2(t, h, "PUT", "/clip", "Write "+j.w, own, "x"); rec.Code != 404 {
		t.Fatalf("clip before the journal exists: %d", rec.Code)
	}
	doV2(t, h, "POST", "/append", "Write "+j.w, fp, line(1))
	if rec := doV2(t, h, "PUT", "/clip", "Write "+j.w, fp, "x"); rec.Code != 403 {
		t.Fatalf("ally clip: %d", rec.Code)
	}
	if rec := doV2(t, h, "GET", "/clip", "Write "+j.w, own, ""); rec.Code != 404 {
		t.Fatalf("empty clip: %d", rec.Code)
	}
	rec := doV2(t, h, "PUT", "/clip", "Write "+j.w, own, "secret")
	if rec.Code != 204 {
		t.Fatalf("owner clip: %d %s", rec.Code, rec.Body)
	}
	etag := rec.Header().Get("ETag")
	if rec := doV2(t, h, "GET", "/clip", "Write "+j.w, own, ""); rec.Code != 200 || rec.Body.String() != "secret" {
		t.Fatalf("get clip: %d %q", rec.Code, rec.Body)
	}
	if rec := doV2(t, h, "GET", "/clip", "Write "+j.w, map[string]string{fingerprintHeader: j.fp, ownerHeader: j.d, "If-None-Match": etag}, ""); rec.Code != 304 {
		t.Fatalf("unchanged clip: %d", rec.Code)
	}
	later := time.Now().Add(clipTTL + time.Minute)
	relay.now = func() time.Time { return later }
	if rec := doV2(t, h, "HEAD", "/clip", "Write "+j.w, own, ""); rec.Code != 404 {
		t.Fatalf("expired clip: %d", rec.Code)
	}
	if left, _ := filepath.Glob(filepath.Join(dir, "*.clip")); len(left) != 0 {
		t.Fatalf("expired clip still on disk: %v", left)
	}
	relay.now = time.Now
	if rec := doV2(t, h, "PUT", "/clip", "Write "+j.w, own, strings.Repeat("a", maxClipBytes+1)); rec.Code != 413 {
		t.Fatalf("too large: %d", rec.Code)
	}
	if rec := doV2(t, h, "DELETE", "/clip", "Write "+j.w, own, ""); rec.Code != 204 {
		t.Fatalf("delete: %d", rec.Code)
	}
	if rec := doV2(t, h, "GET", "/clip", "Write "+j.w, own, ""); rec.Code != 404 {
		t.Fatalf("after delete: %d", rec.Code)
	}
}
