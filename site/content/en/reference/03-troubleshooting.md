# Troubleshooting

*When something looks wrong, and where to find more.*

## Sync does not happen

The circular arrows turn while a sync runs and turn red when it failed. Below the header, the time of the last successful sync is shown. If the server cannot be reached, the app keeps working offline and sends your changes later. If the server asks the app to slow down, it waits a few seconds and tries again by itself.

## Which version is running

*Settings*, at the bottom, and the *About* dialog show the version of the app. After the server was updated, an app on the home screen may still run the old version: close it and open it again, if needed twice.

## Forgotten PIN

*Forgot PIN* on the PIN screen clears this browser. The journals on the server stay; only changes that were not yet sent are lost. Set up again with your eight words and choose a new PIN. After five wrong attempts the app waits a minute, then longer each time.

## The diagnostic log

*Settings → Log*: tick *Write a log in this browser*, repeat what went wrong, then *Copy log* or *Save log*. The log contains requests, errors and the state of your journals, never the text of entries, words or keys. Journals appear by the first four characters of their identifier. Send it to whoever runs your server.

## Lines that vanished, journals that are gone

If lines of a journal disappear from the server, the app says so and offers to restore them from its copy. If a journal was deleted on the server, the app keeps its last state and offers to restore it to those who may write it.

## Technical documentation

For those who want to know how it works, or run a server themselves:

- [Architecture](https://github.com/outheis-labs/outheis-agenda/blob/main/docs/architecture.md): file format, encryption, server, synchronisation
- [Interface](https://github.com/outheis-labs/outheis-agenda/blob/main/docs/ui.md): every view and dialog
- [Decisions](https://github.com/outheis-labs/outheis-agenda/blob/main/docs/decisions.md): what was decided, and why
- [Running a server](https://github.com/outheis-labs/outheis-agenda/blob/main/deploy/DEPLOY.md)
