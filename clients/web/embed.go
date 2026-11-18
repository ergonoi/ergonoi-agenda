// Package web provides the web client (PWA) as embedded files, served by the
// agenda service at "/".
package web

import "embed"

//go:embed index.html guide.html sw.js manifest.webmanifest icon-192.png icon-512.png apple-touch-icon.png favicon-32.png favicon.ico og-image.png fonts
var FS embed.FS
