// Package journal reads and appends to an οὐθείς Agenda journal from the command line
// (docs/architecture.md, 8.2–8.4): key derivation, encryption of lines, the relay's
// interface. It has no state and keeps no key beyond the running process.
package journal

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// Line format (architecture 8.3).
const (
	pad     = 256
	maxLine = 4096
	nonceSz = 12
	gcmTag  = 16
)

// Keys of a journal: the AES key for its lines and the headers that prove access.
type Keys struct {
	Enc     []byte            // AES-256 key of the ordinary lines
	Account string            // hex account ID on the relay
	Auth    map[string]string // headers for reading and appending
}

// NormPhrase lower-cases the words, removes accents and joins them with single spaces, as
// the web client does; nothing changes for words of the ASCII lists.
func NormPhrase(p string) string {
	return strings.Join(strings.Fields(foldAccents(strings.ToLower(p))), " ")
}

// foldAccents removes the accents of Latin letters, as the web client does with NFKD, so that
// words typed with accents match the ASCII word lists (clients/core/wordlists).
func foldAccents(s string) string {
	return accentFolder.Replace(s)
}

var accentFolder = strings.NewReplacer(
	"à", "a", "á", "a", "â", "a", "ã", "a", "ä", "a", "å", "a",
	"ç", "c", "č", "c", "ď", "d",
	"è", "e", "é", "e", "ê", "e", "ë", "e", "ě", "e",
	"ì", "i", "í", "i", "î", "i", "ï", "i",
	"ñ", "n", "ň", "n",
	"ò", "o", "ó", "o", "ô", "o", "õ", "o", "ö", "o",
	"ř", "r", "š", "s", "ť", "t",
	"ù", "u", "ú", "u", "û", "u", "ü", "u", "ů", "u",
	"ý", "y", "ÿ", "y", "ž", "z",
)

func hmacSHA256(key, msg []byte) []byte {
	m := hmac.New(sha256.New, key)
	m.Write(msg)
	return m.Sum(nil)
}

// pbkdf2SHA256 derives one 32-byte block (the clients ask for 256 bits).
func pbkdf2SHA256(password, salt []byte, iter int) []byte {
	m := hmac.New(sha256.New, password)
	m.Write(salt)
	m.Write([]byte{0, 0, 0, 1})
	u := m.Sum(nil)
	out := append([]byte(nil), u...)
	for i := 1; i < iter; i++ {
		m.Reset()
		m.Write(u)
		u = m.Sum(u[:0])
		for j := range out {
			out[j] ^= u[j]
		}
	}
	return out
}

// HKDF-SHA256 with an empty salt, as WebCrypto derives it.
func hkdf(ikm []byte, info string, n int) []byte {
	prk := hmacSHA256(make([]byte, sha256.Size), ikm)
	var out, t []byte
	for i := byte(1); len(out) < n; i++ {
		t = hmacSHA256(prk, append(append(append([]byte(nil), t...), info...), i))
		out = append(out, t...)
	}
	return out[:n]
}

// KeysV1 derives the keys of a version 1 journal from its phrase (architecture 8.2):
// one token proves everything, account = SHA-256(token).
func KeysV1(phrase string) Keys {
	master := pbkdf2SHA256([]byte(NormPhrase(phrase)), []byte("outheis-agenda/v1"), 600000)
	enc, tok := hkdf(master, "enc", 32), hkdf(master, "auth", 32)
	acc := sha256.Sum256(tok)
	return Keys{Enc: enc, Account: hex.EncodeToString(acc[:]), Auth: map[string]string{"Authorization": "Bearer " + hex.EncodeToString(tok)}}
}

// MemberID of this program in a journal (architecture 8.4a): derived from the journal's
// own key, so that the command line counts as one more user of it.
func (k Keys) MemberID() string {
	seed := sha256.Sum256(append([]byte("outheis-agenda/member"), k.Enc...))
	return hex.EncodeToString(hmacSHA256(seed[:], []byte(k.Account)))
}

// Decrypt opens one stored line; ok is false for a line this key cannot open.
func Decrypt(key []byte, line string) (string, bool) {
	b, err := base64.StdEncoding.DecodeString(strings.TrimSpace(line))
	if err != nil || len(b) < nonceSz+gcmTag {
		return "", false
	}
	blk, _ := aes.NewCipher(key)
	g, _ := cipher.NewGCM(blk)
	pt, err := g.Open(nil, b[:nonceSz], b[nonceSz:], nil)
	if err != nil {
		return "", false
	}
	n := len(pt)
	for n > 0 && pt[n-1] == 0 {
		n--
	}
	if n == 0 || pt[n-1] != 0x80 {
		return "", false
	}
	return string(pt[:n-1]), true
}

// Encrypt seals one line, padded to a multiple of 256 bytes.
func Encrypt(key []byte, text string) (string, error) {
	data := []byte(text)
	size := (len(data) + 1 + pad - 1) / pad * pad
	if nonceSz+gcmTag+size > maxLine {
		return "", errors.New("line too long")
	}
	p := make([]byte, size)
	copy(p, data)
	p[len(data)] = 0x80
	nonce := make([]byte, nonceSz)
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	blk, _ := aes.NewCipher(key)
	g, _ := cipher.NewGCM(blk)
	return base64.StdEncoding.EncodeToString(append(nonce, g.Seal(nil, nonce, p, nil)...)), nil
}

// Client talks to the relay.
type Client struct {
	Server string
	HTTP   *http.Client
}

func (c Client) do(method, path string, k Keys, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequest(method, strings.TrimRight(c.Server, "/")+path, body)
	if err != nil {
		return nil, err
	}
	for h, v := range k.Auth {
		req.Header.Set(h, v)
	}
	req.Header.Set("X-Agenda-Member", k.MemberID())
	if body != nil {
		req.Header.Set("Content-Type", "text/plain")
	}
	hc := c.HTTP
	if hc == nil {
		hc = &http.Client{Timeout: 30 * time.Second}
	}
	return hc.Do(req)
}

// Fetch returns the stored (encrypted) file of the journal.
func (c Client) Fetch(k Keys) (string, error) {
	r, err := c.do("GET", "/journal", k, nil)
	if err != nil {
		return "", err
	}
	defer r.Body.Close()
	b, _ := io.ReadAll(r.Body)
	if r.StatusCode != http.StatusOK {
		return "", fmt.Errorf("server: %s %s", r.Status, strings.TrimSpace(string(b)))
	}
	return string(b), nil
}

// Append sends encrypted lines to the end of the journal.
func (c Client) Append(k Keys, enc []string) error {
	r, err := c.do("POST", "/append", k, strings.NewReader(strings.Join(enc, "\n")+"\n"))
	if err != nil {
		return err
	}
	defer r.Body.Close()
	if r.StatusCode/100 != 2 {
		b, _ := io.ReadAll(r.Body)
		return fmt.Errorf("server: %s %s", r.Status, strings.TrimSpace(string(b)))
	}
	return nil
}

// Open decrypts a stored file: the plain lines in stored order and the number of lines
// this key could not open (private lines of another level, damaged lines).
func Open(key []byte, file string) (plain []string, unread int) {
	for _, l := range strings.Split(file, "\n") {
		if strings.TrimSpace(l) == "" {
			continue
		}
		if p, ok := Decrypt(key, l); ok {
			plain = append(plain, p)
		} else {
			unread++
		}
	}
	return
}

func tagVal(line, dim string) string {
	for _, w := range strings.Fields(line) {
		if strings.HasPrefix(w, "#"+dim+"-") {
			return w[len(dim)+2:]
		}
	}
	return ""
}

// Current keeps, of every entry, the line with the highest revision, at the place where
// the entry first appears; lines without id are kept as they are (architecture 3.1, 6.4).
func Current(lines []string) []string {
	best := map[string]string{}
	for _, l := range lines {
		if id := tagVal(l, "id"); id != "" && tagVal(l, "rev") >= tagVal(best[id], "rev") {
			best[id] = l
		}
	}
	var res []string
	done := map[string]bool{}
	for _, l := range lines {
		id := tagVal(l, "id")
		switch {
		case id == "":
			res = append(res, l)
		case !done[id]:
			done[id] = true
			res = append(res, best[id])
		}
	}
	return res
}

// Closed tells whether a line carries #done.
func Closed(line string) bool {
	return tagVal(line, "done") != "" || strings.Contains(" "+line+" ", " #done ")
}
