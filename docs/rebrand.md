# Rebranding a clone as ergonoi Agenda

The repository builds οὐθείς Agenda; the ergonoi look and name are built in as a second
theme, switched on per device in *Settings → Device → Display → ergonoi theme* (ui.md 2.10).
That switch is the preview: whatever a clone would show can be tried here first.

A clone that is to show *ergonoi Agenda* by default:

1. Clone or fork the repository into the ergonoi organisation.
2. In `clients/web/brand.json` set `"default": "ergonoi"`.
3. `python3 clients/web/build.py`: page title, wordmark, colours, manifest name and theme
   colour follow, and the ergonoi icons (`icon-src/icons/ergonoi-*`) become
   `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`, `favicon-32.png` and
   `favicon.ico`. Then build the service as usual; it embeds the client.
4. Optionally: `og-image.png` (link preview) and the documentation site, which still name
   οὐθείς Agenda.

What stays the same, on purpose:

- The protocol: KDF salts and labels (`outheis-agenda/v2/...`), the service id at
  `/health`, the ICS UID suffix and the Go module path. An ergonoi Agenda therefore works
  with the same service and with allys on οὐθείς Agenda, and the other way round.
- The switch in Settings: users of the clone can still choose the outheis look.

Changes to the app are made here and taken over by the clone with a pull or merge; the
clone should carry no other change than the one line in `brand.json` (and, if wanted, the
optional files above), so that merging stays trivial.
