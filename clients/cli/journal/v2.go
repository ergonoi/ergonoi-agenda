package journal

// Version 2 keys (docs/architecture.md, 8.4 and 8.11e): owner, ally, guest.
//
//	phrase ─┬─► P private key ─ (owner)
//	        ├─► M ally secret, 11 bytes ─┬─► K journal key
//	        │                             └─► W write token ─► R = HMAC(W, "outheis-agenda/read")
//	        └─► D delete token
//	F = SHA-256(D)[:11]; account = SHA-256(F ‖ SHA-256(R))
//
// Ally code: M ‖ F as 16 words. Guest code: "g1." + base64url(K ‖ R ‖ F).

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
)

// Level of access held.
const (
	Owner = "owner"
	Ally  = "ally"
	Guest = "guest"
)

// KeysV2 adds to Keys what version 2 knows: the level and the owner's private key.
type KeysV2 struct {
	Keys
	Level string
	Priv  []byte // owner only: decrypts the private lines
}

func keysV2(level string, k, w, r, f, p []byte) KeysV2 {
	rh := sha256.Sum256(r)
	acc := sha256.Sum256(append(append([]byte(nil), f...), rh[:]...))
	auth := map[string]string{"Authorization": "Read " + hex.EncodeToString(r), "X-Agenda-Fingerprint": hex.EncodeToString(f)}
	if w != nil {
		auth["Authorization"] = "Write " + hex.EncodeToString(w)
	}
	return KeysV2{Keys: Keys{Enc: k, Account: hex.EncodeToString(acc[:]), Auth: auth}, Level: level, Priv: p}
}

func fromAlly(m []byte) (k, w, r []byte) {
	k, w = hkdf(m, "outheis-agenda/v2/enc", 32), hkdf(m, "outheis-agenda/v2/write", 32)
	return k, w, hmacSHA256(w, []byte("outheis-agenda/read"))
}

// OwnerV2 derives the owner's keys from the eight words of a version 2 journal.
func OwnerV2(phrase string) KeysV2 {
	master := pbkdf2SHA256([]byte(NormPhrase(phrase)), []byte("outheis-agenda/v2"), 600000)
	p, d := hkdf(master, "outheis-agenda/v2/private", 32), hkdf(master, "outheis-agenda/v2/delete", 32)
	m := hkdf(master, "outheis-agenda/v2/ally", 11)
	fd := sha256.Sum256(d)
	k, w, r := fromAlly(m)
	return keysV2(Owner, k, w, r, fd[:11], p)
}

// AllyV2 derives the keys of an ally from the 16 words of an ally code.
func AllyV2(code string) (KeysV2, error) {
	words := strings.Fields(NormPhrase(code))
	if len(words) != 16 {
		return KeysV2{}, fmt.Errorf("an ally code has 16 words, not %d", len(words))
	}
	idx := map[string]int{}
	for i, w := range bip39 {
		idx[w] = i
	}
	var bits []byte
	for _, w := range words {
		i, ok := idx[w]
		if !ok {
			return KeysV2{}, fmt.Errorf("%q is not a word of the list", w)
		}
		for b := 10; b >= 0; b-- {
			bits = append(bits, byte(i>>b&1))
		}
	}
	raw := make([]byte, 22)
	for i := range raw {
		for b := 0; b < 8; b++ {
			raw[i] = raw[i]<<1 | bits[i*8+b]
		}
	}
	k, w, r := fromAlly(raw[:11])
	return keysV2(Ally, k, w, r, raw[11:22], nil), nil
}

// GuestV2 reads a guest code ("g1.…"): it can only read.
func GuestV2(code string) (KeysV2, error) {
	s := strings.TrimPrefix(strings.TrimSpace(code), "g1.")
	raw, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil || len(raw) != 75 {
		return KeysV2{}, errors.New("not a guest code")
	}
	return keysV2(Guest, raw[:32], nil, raw[32:64], raw[64:75], nil), nil
}

// FromCode takes eight words (owner), 16 words (ally) or a guest code.
func FromCode(code string) (KeysV2, error) {
	c := strings.TrimSpace(code)
	if strings.HasPrefix(c, "g1.") {
		return GuestV2(c)
	}
	switch n := len(strings.Fields(c)); n {
	case 8:
		return OwnerV2(c), nil
	case 16:
		return AllyV2(c)
	default:
		return KeysV2{}, fmt.Errorf("%d words: a phrase has 8, an ally code 16", n)
	}
}

// OpenV2 decrypts a stored file; the owner also reads the private lines.
func OpenV2(k KeysV2, file string) (plain []string, unread int) {
	for _, l := range strings.Split(file, "\n") {
		if strings.TrimSpace(l) == "" {
			continue
		}
		if p, ok := Decrypt(k.Enc, l); ok {
			plain = append(plain, p)
		} else if k.Priv != nil {
			if p, ok := Decrypt(k.Priv, l); ok {
				plain = append(plain, p)
			} else {
				unread++
			}
		} else {
			unread++
		}
	}
	return
}

// IsPrivate tells whether a line is one of the owner's private lines (8.11e).
func IsPrivate(line string) bool {
	for _, p := range []string{"Journal key:", "Journal alias:", "Tag overlay:", "Journal overlay:", "Addon function:"} {
		if strings.HasPrefix(line, p) {
			return true
		}
	}
	return false
}

// AccessV1 is what eight words open in a journal of version 1: everything.
func AccessV1(phrase string) Access {
	k := KeysV1(phrase)
	return Access{
		Keys:   k,
		Open:   func(f string) ([]string, int) { return Open(k.Enc, f) },
		KeyFor: func(string) ([]byte, error) { return k.Enc, nil },
	}
}

// AccessV2 is what a code opens in a journal of version 2: a guest only reads; private
// lines are written by the owner alone, with the private key.
func AccessV2(kv KeysV2) Access {
	a := Access{Keys: kv.Keys, Open: func(f string) ([]string, int) { return OpenV2(kv, f) }}
	if kv.Level != Guest {
		a.KeyFor = func(l string) ([]byte, error) {
			if !IsPrivate(l) {
				return kv.Enc, nil
			}
			if kv.Priv == nil {
				return nil, errors.New("only the owner writes private lines")
			}
			return kv.Priv, nil
		}
	}
	return a
}

// AccessAny tries a code as the web client does: eight words first as the owner's phrase
// of a journal of version 2, then as the phrase of one of version 1; 16 words and guest
// codes are of version 2.
func AccessAny(code string) ([]Access, error) {
	kv, err := FromCode(code)
	if err != nil {
		return nil, err
	}
	out := []Access{AccessV2(kv)}
	if kv.Level == Owner {
		out = append(out, AccessV1(code))
	}
	return out, nil
}
