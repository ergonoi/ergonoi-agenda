// Package web provides the web client (PWA) as embedded files, served by the
// agenda service at "/".
package web

import (
	"embed"
	"strings"
)

//go:embed index.html sw.js manifest.webmanifest icon-192.png icon-512.png apple-touch-icon.png favicon-32.png favicon.ico og-image.png fonts
var FS embed.FS

//go:embed version.txt
var version string

// Version is the release of the client and the service (file VERSION, written by build.py).
func Version() string { return strings.TrimSpace(version) }
