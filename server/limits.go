package main

import (
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// window is a fixed-window counter per key.
type window struct {
	mu    sync.Mutex
	span  time.Duration
	max   int
	start map[string]time.Time
	count map[string]int
	now   func() time.Time
}

func newWindow(span time.Duration, max int) *window {
	return &window{span: span, max: max, start: map[string]time.Time{}, count: map[string]int{}, now: time.Now}
}

// allow counts one event for key and reports whether it is within the limit.
func (w *window) allow(key string) bool {
	w.mu.Lock()
	defer w.mu.Unlock()
	now := w.now()
	if s, ok := w.start[key]; !ok || now.Sub(s) >= w.span {
		w.start[key] = now
		w.count[key] = 0
	}
	if w.count[key] >= w.max {
		return false
	}
	w.count[key]++
	return true
}

// sweep drops expired keys so the maps do not grow without bound.
func (w *window) sweep() {
	w.mu.Lock()
	defer w.mu.Unlock()
	now := w.now()
	for k, s := range w.start {
		if now.Sub(s) >= w.span {
			delete(w.start, k)
			delete(w.count, k)
		}
	}
}

// clientIP returns the address of the client. X-Forwarded-For is trusted only
// when the request comes from the local reverse proxy.
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	if ip := net.ParseIP(host); ip != nil && ip.IsLoopback() {
		if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
			parts := strings.Split(xff, ",")
			return strings.TrimSpace(parts[len(parts)-1])
		}
	}
	return host
}

// pacer lets a burst of requests per key through and then one per interval (a token
// bucket): a sync asks a journal a few times in a row, but nobody needs to sync more than
// once a second. A request without a token waits for the next one instead of being
// refused, up to maxWait (docs/architecture.md, 8.4).
type pacer struct {
	mu       sync.Mutex
	interval time.Duration
	burst    int
	maxWait  time.Duration
	tokens   map[string]float64
	last     map[string]time.Time
	now      func() time.Time
}

func newPacer(interval time.Duration, burst int, maxWait time.Duration) *pacer {
	return &pacer{interval: interval, burst: burst, maxWait: maxWait, tokens: map[string]float64{}, last: map[string]time.Time{}, now: time.Now}
}

// wait returns how long the request must wait for a token, and false if that is longer
// than maxWait (the request is then refused and takes no token).
func (p *pacer) wait(key string) (time.Duration, bool) {
	p.mu.Lock()
	defer p.mu.Unlock()
	now := p.now()
	t, seen := p.tokens[key]
	if !seen {
		t = float64(p.burst)
	} else {
		t += float64(now.Sub(p.last[key])) / float64(p.interval)
		if t > float64(p.burst) {
			t = float64(p.burst)
		}
	}
	p.last[key] = now
	if t >= 1 {
		p.tokens[key] = t - 1
		return 0, true
	}
	d := time.Duration((1 - t) * float64(p.interval))
	if d > p.maxWait {
		p.tokens[key] = t
		return d, false
	}
	// The token that comes in d is this request's.
	p.tokens[key] = t - 1
	return d, true
}

// sweep drops keys that have been quiet long enough to have a full bucket again.
func (p *pacer) sweep() {
	p.mu.Lock()
	defer p.mu.Unlock()
	now := p.now()
	for k, l := range p.last {
		if now.Sub(l) > time.Duration(p.burst+1)*p.interval {
			delete(p.last, k)
			delete(p.tokens, k)
		}
	}
}
