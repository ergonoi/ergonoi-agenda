# Fehlersuche

*Wenn etwas nicht stimmt, und wo es mehr gibt.*

## Die Synchronisation läuft nicht

Die kreisförmigen Pfeile drehen sich, solange eine Synchronisation läuft, und werden rot, wenn sie fehlgeschlagen ist. Unter der Kopfzeile steht die Uhrzeit der letzten gelungenen Synchronisation. Ist der Server nicht erreichbar, arbeitet die App offline weiter und sendet deine Änderungen später. Bittet der Server die App, langsamer zu werden, wartet sie einige Sekunden und versucht es von selbst erneut.

## Welche Version läuft

*Settings* ganz unten und der Dialog *About* zeigen die Version der App. Nach einer Aktualisierung des Servers kann eine App auf dem Startbildschirm noch die alte Version ausführen: schließen und wieder öffnen, nötigenfalls zweimal.

## PIN vergessen

*Forgot PIN* auf dem PIN-Bildschirm leert diesen Browser. Die Journale auf dem Server bleiben; verloren geht nur, was noch nicht gesendet war. Richte den Browser mit deinen acht Wörtern neu ein und wähle eine neue PIN. Nach fünf falschen Versuchen wartet die App eine Minute, danach jeweils länger.

## Das Diagnoseprotokoll

*Settings → Log*: *Write a log in this browser* anhaken, wiederholen, was schiefging, dann *Copy log* oder *Save log*. Das Protokoll enthält Anfragen, Fehler und den Zustand deiner Journale, nie den Text von Einträgen, Wörter oder Schlüssel. Journale erscheinen mit den ersten vier Zeichen ihrer Kennung. Schick es dem, der deinen Server betreibt.

## Verschwundene Zeilen, gelöschte Journale

Verschwinden Zeilen eines Journals vom Server, sagt die App das und bietet an, sie aus ihrer Kopie wiederherzustellen. Wurde ein Journal auf dem Server gelöscht, behält die App seinen letzten Stand und bietet denen, die es schreiben dürfen, die Wiederherstellung an.

## Technische Dokumentation

Für alle, die wissen wollen, wie es funktioniert, oder selbst einen Server betreiben (auf Englisch):

- [Architecture](https://github.com/outheis-labs/outheis-agenda/blob/main/docs/architecture.md): Dateiformat, Verschlüsselung, Server, Synchronisation
- [Interface](https://github.com/outheis-labs/outheis-agenda/blob/main/docs/ui.md): jede Ansicht und jeder Dialog
- [Decisions](https://github.com/outheis-labs/outheis-agenda/blob/main/docs/decisions.md): was entschieden wurde, und warum
- [Running a server](https://github.com/outheis-labs/outheis-agenda/blob/main/deploy/DEPLOY.md)
