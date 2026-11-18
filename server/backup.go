package main

// Deletion with a grace period and rotating backups (architecture 8.4b, 8.4c).
//
// Deleting a journal is a decision of its owner: from that moment nobody else may read
// or write it, and every client that asks learns that it was deleted (410 Gone) and
// removes its own copy and its own backups. For deleteGrace the encrypted file and its
// backups stay, so that the owner can undo the deletion; then they are removed for good.
// What remains is a marker <account>.gone with the day of deletion and nothing else, so
// that a client can tell "deleted" from "server reset" (in the second case it must not
// remove anything). The marker is removed after inactiveDays.
//
// Backups: once a day the service copies every journal file into one of backupSlots
// places, chosen as in the towers of Hanoi: on day d (days since 1970) the place is the
// number of trailing zero bits of d, at most backupSlots-1. Place 0 is written every
// second day, place 1 every fourth, place k every 2^(k+1)-th; so the copies are 1, 2, 4,
// 8 … days old, and with 9 places they reach back about one year. The files stay
// encrypted; the service reads none of them.

import (
	"encoding/json"
	"errors"
	"fmt"
	"math/bits"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"
)

const deleteGrace = 7 * 24 * time.Hour

var errGone = errors.New("journal deleted")

// goneInfo describes a deleted account: the day of deletion and whether its owner can
// still undo it (the file is still there and the grace period has not passed).
type goneInfo struct {
	Deleted    string `json:"deleted"`
	Restorable bool   `json:"restorable"`
	Until      string `json:"until,omitempty"`
}

func (r *Relay) backupDir(acc string) string { return filepath.Join(r.dir, "backups", acc) }

// gone reports whether the account was deleted; callers hold no lock.
func (r *Relay) gone(acc string) (goneInfo, bool) {
	b, err := os.ReadFile(r.path(acc, ".gone"))
	if err != nil {
		return goneInfo{}, false
	}
	day := strings.TrimSpace(string(b))
	info := goneInfo{Deleted: day}
	if t, err := time.Parse(time.RFC3339, day); err == nil {
		info.Deleted = t.UTC().Format("2006-01-02")
		until := t.Add(deleteGrace)
		if _, err := os.Stat(r.path(acc, ".enc")); err == nil && r.now().Before(until) {
			info.Restorable = true
			info.Until = until.UTC().Format(time.RFC3339)
		}
	}
	return info, true
}

// SoftDelete marks the account as deleted by its owner. The clipboard and the record of
// use go at once; file and backups stay for the grace period. A second call changes nothing.
func (r *Relay) SoftDelete(acc string) error {
	defer r.lock(acc)()
	if _, err := os.Stat(r.path(acc, ".gone")); err == nil {
		return nil
	}
	for _, ext := range []string{".clip", ".clip.tmp", ".seen", ".enc.tmp"} {
		if err := os.Remove(r.path(acc, ext)); err != nil && !os.IsNotExist(err) {
			return err
		}
	}
	return os.WriteFile(r.path(acc, ".gone"), []byte(r.now().UTC().Format(time.RFC3339)+"\n"), 0o600)
}

// Undelete takes back a deletion within the grace period.
func (r *Relay) Undelete(acc string) error {
	info, ok := r.gone(acc)
	if !ok {
		return nil
	}
	if !info.Restorable {
		return errGone
	}
	defer r.lock(acc)()
	if err := os.Remove(r.path(acc, ".gone")); err != nil && !os.IsNotExist(err) {
		return err
	}
	r.touch(acc)
	return nil
}

// Purge removes the file, its backups and everything else of the account for good and
// leaves the marker (with the given time, unless one is there already).
func (r *Relay) Purge(acc string) error {
	if err := r.Delete(acc); err != nil {
		return err
	}
	defer r.lock(acc)()
	if err := os.RemoveAll(r.backupDir(acc)); err != nil {
		return err
	}
	p := r.path(acc, ".gone")
	if _, err := os.Stat(p); os.IsNotExist(err) {
		return os.WriteFile(p, []byte(r.now().UTC().Format(time.RFC3339)+"\n"), 0o600)
	}
	return nil
}

// Reopen lets the owner start anew with the same words once a deletion is final; what
// may still be left of the old journal is removed first.
func (r *Relay) Reopen(acc string) error {
	if err := r.Purge(acc); err != nil {
		return err
	}
	defer r.lock(acc)()
	if err := os.Remove(r.path(acc, ".gone")); err != nil && !os.IsNotExist(err) {
		return err
	}
	return nil
}

// sweepDeleted purges accounts whose grace period has passed and drops old markers.
func (r *Relay) sweepDeleted() (int, error) {
	marks, err := filepath.Glob(filepath.Join(r.dir, "*.gone"))
	if err != nil {
		return 0, err
	}
	n := 0
	for _, m := range marks {
		acc := strings.TrimSuffix(filepath.Base(m), ".gone")
		b, err := os.ReadFile(m)
		if err != nil {
			continue
		}
		t, err := time.Parse(time.RFC3339, strings.TrimSpace(string(b)))
		if err != nil {
			continue
		}
		age := r.now().Sub(t)
		if age >= deleteGrace {
			if _, err := os.Stat(r.path(acc, ".enc")); err == nil {
				if err := r.Purge(acc); err != nil {
					return n, fmt.Errorf("purge %s: %w", acc, err)
				}
				n++
			} else if _, err := os.Stat(r.backupDir(acc)); err == nil {
				os.RemoveAll(r.backupDir(acc))
			}
		}
		if age > inactiveDays*24*time.Hour {
			os.Remove(m)
		}
	}
	return n, nil
}

// backupSlot is the place for the backup of day d (towers of Hanoi).
func backupSlot(d int64, slots int) int {
	if d <= 0 {
		return 0
	}
	k := bits.TrailingZeros64(uint64(d))
	if k > slots-1 {
		k = slots - 1
	}
	return k
}

// Backup copies every journal that is not deleted into today's place. It returns the
// place and the number of journals copied.
func (r *Relay) Backup(slots int) (int, int, error) {
	if slots <= 0 {
		return 0, 0, nil
	}
	slot := backupSlot(r.now().UTC().Unix()/86400, slots)
	files, err := filepath.Glob(filepath.Join(r.dir, "*.enc"))
	if err != nil {
		return slot, 0, err
	}
	n := 0
	for _, f := range files {
		acc := strings.TrimSuffix(filepath.Base(f), ".enc")
		if _, ok := r.gone(acc); ok {
			continue
		}
		if err := r.backupOne(acc, slot); err != nil {
			return slot, n, fmt.Errorf("backup %s: %w", acc, err)
		}
		n++
	}
	return slot, n, nil
}

func (r *Relay) backupOne(acc string, slot int) error {
	defer r.lock(acc)()
	data, err := os.ReadFile(r.path(acc, ".enc"))
	if err != nil || len(data) == 0 {
		return nil
	}
	dir := r.backupDir(acc)
	if err := os.MkdirAll(dir, 0o700); err != nil {
		return err
	}
	p := filepath.Join(dir, strconv.Itoa(slot)+".enc")
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, data, 0o600); err != nil {
		return err
	}
	if err := os.Rename(tmp, p); err != nil {
		return err
	}
	now := r.now()
	return os.Chtimes(p, now, now)
}

type backupEntry struct {
	Slot int    `json:"slot"`
	Time string `json:"time"`
	Size int64  `json:"size"`
}

// Backups lists the places that hold a copy of the account, newest first.
func (r *Relay) Backups(acc string) ([]backupEntry, error) {
	files, err := filepath.Glob(filepath.Join(r.backupDir(acc), "*.enc"))
	if err != nil {
		return nil, err
	}
	out := []backupEntry{}
	for _, f := range files {
		k, err := strconv.Atoi(strings.TrimSuffix(filepath.Base(f), ".enc"))
		if err != nil {
			continue
		}
		st, err := os.Stat(f)
		if err != nil {
			continue
		}
		out = append(out, backupEntry{Slot: k, Time: st.ModTime().UTC().Format(time.RFC3339), Size: st.Size()})
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Time > out[j].Time })
	return out, nil
}

// BackupGet returns the copy in one place.
func (r *Relay) BackupGet(acc string, slot int) ([]byte, error) {
	if slot < 0 || slot > 63 {
		return nil, os.ErrNotExist
	}
	return os.ReadFile(filepath.Join(r.backupDir(acc), strconv.Itoa(slot)+".enc"))
}

func goneJSON(info goneInfo) []byte {
	b, _ := json.Marshal(info)
	return b
}
