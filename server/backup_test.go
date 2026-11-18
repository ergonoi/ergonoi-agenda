package main

import (
	"encoding/json"
	"net/http"
	"os"
	"testing"
	"time"
)

func TestBackupSlotHanoi(t *testing.T) {
	want := map[int64]int{1: 0, 2: 1, 3: 0, 4: 2, 8: 3, 12: 2, 256: 8, 512: 8, 1024: 8}
	for d, k := range want {
		if got := backupSlot(d, 9); got != k {
			t.Errorf("day %d: place %d, want %d", d, got, k)
		}
	}
}

func TestDeleteUndoPurgeReopen(t *testing.T) {
	s, h := testServer(t)
	tok := token()
	if rec := do(t, h, "POST", "/append", tok, line(1)+"\n", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("append: %d", rec.Code)
	}
	if rec := do(t, h, "DELETE", "/journal", tok, "", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("delete: %d", rec.Code)
	}
	rec := do(t, h, "GET", "/journal", tok, "", nil)
	var info goneInfo
	json.Unmarshal(rec.Body.Bytes(), &info)
	if rec.Code != http.StatusGone || !info.Restorable {
		t.Fatalf("after delete: %d %+v", rec.Code, info)
	}
	if rec := do(t, h, "POST", "/append", tok, line(1)+"\n", nil); rec.Code != http.StatusGone {
		t.Fatalf("append to a deleted journal within the grace period: %d", rec.Code)
	}
	if rec := do(t, h, "POST", "/undelete", tok, "", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("undelete: %d", rec.Code)
	}
	if rec := do(t, h, "GET", "/journal", tok, "", nil); rec.Code != http.StatusOK || rec.Body.Len() == 0 {
		t.Fatalf("after undo: %d %d bytes", rec.Code, rec.Body.Len())
	}
	// Delete again and let the grace period pass.
	s.relay.Backup(9)
	do(t, h, "DELETE", "/journal", tok, "", nil)
	acc, _ := accountOf(tok)
	later := time.Now().Add(deleteGrace + time.Hour)
	s.relay.now = func() time.Time { return later }
	if n, err := s.relay.sweepDeleted(); err != nil || n != 1 {
		t.Fatalf("sweep: %d %v", n, err)
	}
	if _, err := os.Stat(s.relay.backupDir(acc)); !os.IsNotExist(err) {
		t.Fatal("backups not removed with the journal")
	}
	rec = do(t, h, "GET", "/journal", tok, "", nil)
	info = goneInfo{}
	json.Unmarshal(rec.Body.Bytes(), &info)
	if rec.Code != http.StatusGone || info.Restorable {
		t.Fatalf("after purge: %d %+v", rec.Code, info)
	}
	if rec := do(t, h, "POST", "/undelete", tok, "", nil); rec.Code != http.StatusGone {
		t.Fatalf("undo after the grace period: %d", rec.Code)
	}
	// The owner may start anew with the same words.
	if rec := do(t, h, "POST", "/append", tok, line(1)+"\n", nil); rec.Code != http.StatusNoContent {
		t.Fatalf("reopen: %d", rec.Code)
	}
	if rec := do(t, h, "GET", "/journal", tok, "", nil); rec.Code != http.StatusOK {
		t.Fatalf("after reopen: %d", rec.Code)
	}
}

func TestBackupsListedAndServed(t *testing.T) {
	s, h := testServer(t)
	tok := token()
	l := line(1)
	do(t, h, "POST", "/append", tok, l+"\n", nil)
	day := time.Unix(20800*86400+3*3600, 0) // day 20800 = 2^6 · 325: place 6
	s.relay.now = func() time.Time { return day }
	slot, n, err := s.relay.Backup(9)
	if err != nil || n != 1 || slot != 6 {
		t.Fatalf("backup: place %d, %d journals, %v", slot, n, err)
	}
	rec := do(t, h, "GET", "/backups", tok, "", nil)
	var list struct{ Backups []backupEntry }
	json.Unmarshal(rec.Body.Bytes(), &list)
	if rec.Code != http.StatusOK || len(list.Backups) != 1 || list.Backups[0].Slot != 6 {
		t.Fatalf("list: %d %s", rec.Code, rec.Body.String())
	}
	rec = do(t, h, "GET", "/backups/6", tok, "", nil)
	if rec.Code != http.StatusOK || rec.Body.String() != l+"\n" {
		t.Fatalf("get: %d", rec.Code)
	}
	if rec := do(t, h, "GET", "/backups/3", tok, "", nil); rec.Code != http.StatusNotFound {
		t.Fatalf("missing place: %d", rec.Code)
	}
	if rec := do(t, h, "GET", "/backups", token(), "", nil); rec.Code != http.StatusOK || rec.Body.String() != "{\"backups\":[]}\n" {
		t.Fatalf("other account: %d %s", rec.Code, rec.Body.String())
	}
}
