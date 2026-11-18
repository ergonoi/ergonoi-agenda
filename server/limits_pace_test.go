package main

import (
	"testing"
	"time"
)

// A burst passes at once; then one request per interval, later ones wait their turn,
// and a request beyond maxWait is refused without taking a turn.
func TestPacer(t *testing.T) {
	now := time.Unix(1000, 0)
	p := newPacer(time.Second, 3, 2*time.Second)
	p.now = func() time.Time { return now }
	for i := 0; i < 3; i++ {
		if d, ok := p.wait("a"); !ok || d != 0 {
			t.Fatalf("burst request %d: %v %v", i, d, ok)
		}
	}
	if d, ok := p.wait("a"); !ok || d != time.Second {
		t.Fatalf("after the burst: %v %v, want 1s", d, ok)
	}
	if d, ok := p.wait("a"); !ok || d != 2*time.Second {
		t.Fatalf("next: %v %v, want 2s", d, ok)
	}
	if _, ok := p.wait("a"); ok {
		t.Fatal("3 s ahead must be refused")
	}
	if d, ok := p.wait("b"); !ok || d != 0 {
		t.Fatal("another key has its own bucket")
	}
	now = now.Add(10 * time.Second)
	for i := 0; i < 3; i++ {
		if d, ok := p.wait("a"); !ok || d != 0 {
			t.Fatalf("after a pause the burst is back, request %d: %v %v", i, d, ok)
		}
	}
}
