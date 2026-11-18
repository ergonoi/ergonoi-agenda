package main

// Authorisation (docs/architecture.md, 8.4 and 8.11e). Two derivations are accepted
// side by side, so that journals can be converted from the first to the second:
//
// Version 1 (one level of access): "Authorization: Bearer <token>",
// account = SHA-256(token). Whoever has the token may read, write and delete.
//
// Version 2 (owner, ally, guest): the account ID combines the fingerprint of the
// owner's delete token D with the hash of the read token R,
//
//	R       = HMAC-SHA256(key = W, "outheis-agenda/read")
//	F       = the first 11 bytes of SHA-256(D)  (fingerprint; 88 bits, so that an
//	          ally code of M and F fits into 16 words)
//	account = SHA-256( F || SHA-256(R) )
//
// and each request proves one level:
//
//	Authorization: Read <R>     + X-Agenda-Fingerprint: <F>            read
//	Authorization: Write <W>    + X-Agenda-Fingerprint: <F>            read and write
//	Authorization: Delete <D>   + X-Agenda-Read-Hash: <SHA-256(R)>     delete
//
// Replacing the whole file (compaction) is the owner's: a write request that also
// carries X-Agenda-Owner: <D>, whose fingerprint must be F. An ally, who holds W but
// not D, can only append, and so cannot shorten the journal or drop the owner's
// private lines (audit S2).
//
// The service stores nothing for this beyond the file: every check is a
// recomputation of the account ID. Tokens and hashes are 32 bytes, sent as 64
// lowercase hex digits; the fingerprint is 11 bytes, 22 hex digits. Finding a D'
// with the same fingerprint takes about 2^88 hash computations. A version 1 token cannot address a version 2 account: it would have
// to be the 64 bytes hashed there.

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"strings"
)

type access int

const (
	accessNone access = iota
	accessRead
	accessWrite
	accessOwnerWrite // version 2: writing and replacing
	accessDelete     // version 2: deleting only; version 1: everything
	accessAll        // version 1 token
)

const (
	fingerprintHeader = "X-Agenda-Fingerprint"
	readHashHeader    = "X-Agenda-Read-Hash"
	ownerHeader       = "X-Agenda-Owner"
	readLabel         = "outheis-agenda/read"
)

const fingerprintBytes = 11

// hexN decodes 2n lowercase hex digits into n bytes.
func hexN(s string, n int) ([]byte, bool) {
	if len(s) != 2*n || strings.ToLower(s) != s {
		return nil, false
	}
	b, err := hex.DecodeString(s)
	return b, err == nil
}

func hex32(s string) ([]byte, bool) { return hexN(s, 32) }

// fingerprintOf is the first 11 bytes of SHA-256(D).
func fingerprintOf(d []byte) []byte { return sha(d)[:fingerprintBytes] }

func sha(b ...[]byte) []byte {
	h := sha256.New()
	for _, x := range b {
		h.Write(x)
	}
	return h.Sum(nil)
}

// readTokenOf derives R from W.
func readTokenOf(w []byte) []byte {
	m := hmac.New(sha256.New, w)
	m.Write([]byte(readLabel))
	return m.Sum(nil)
}

// accountV2 is SHA-256( F || SHA-256(R) ).
func accountV2(fingerprint, readHash []byte) string {
	return hex.EncodeToString(sha(fingerprint, readHash))
}

// authorize returns the account and the level of access a request proves.
func authorize(r *http.Request) (string, access) {
	h := r.Header.Get("Authorization")
	scheme, val, ok := strings.Cut(h, " ")
	if !ok {
		return "", accessNone
	}
	v, ok := hex32(val)
	if !ok {
		return "", accessNone
	}
	switch scheme {
	case "Bearer":
		return hex.EncodeToString(sha(v)), accessAll
	case "Read", "Write":
		fp, ok := hexN(r.Header.Get(fingerprintHeader), fingerprintBytes)
		if !ok {
			return "", accessNone
		}
		if scheme == "Read" {
			return accountV2(fp, sha(v)), accessRead
		}
		acc := accountV2(fp, sha(readTokenOf(v)))
		if d, ok := hex32(r.Header.Get(ownerHeader)); ok && hmac.Equal(fingerprintOf(d), fp) {
			return acc, accessOwnerWrite
		}
		return acc, accessWrite
	case "Delete":
		rh, ok := hex32(r.Header.Get(readHashHeader))
		if !ok {
			return "", accessNone
		}
		return accountV2(fingerprintOf(v), rh), accessDelete
	}
	return "", accessNone
}

func (a access) canRead() bool {
	return a == accessRead || a == accessWrite || a == accessOwnerWrite || a == accessAll
}
func (a access) canWrite() bool   { return a == accessWrite || a == accessOwnerWrite || a == accessAll }
func (a access) canReplace() bool { return a == accessOwnerWrite || a == accessAll }
func (a access) canDelete() bool  { return a == accessDelete || a == accessAll }
