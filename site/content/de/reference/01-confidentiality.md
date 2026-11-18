# Vertraulichkeit

*Was verschlüsselt ist, was der Server sieht, und was nicht.*

## Auf deinem Gerät

Aus den acht Wörtern eines Journals entstehen auf deinem Gerät die Schlüssel; das dauert etwa eine Sekunde. Jede Zeile wird mit diesen Schlüsseln verschlüsselt, mit AES-GCM, bevor sie das Gerät verlässt. Die Wörter selbst verlassen das Gerät nie und stehen nie in einem Link.

## Auf dem Server

Der Server hält eine Datei je Journal: verschlüsselte Zeilen, eine nach der anderen. Er kann erkennen, wie viele Zeilen es sind, wie groß sie sind und wann sie geschrieben wurden. Lesen kann er keine einzige, und er hat keinen Schlüssel, mit dem er es könnte. Er speichert keine Namen, keine E-Mail-Adressen und keine Passwörter.

Um zu erkennen, wer lesen oder schreiben darf, bekommt der Server aus den Schlüsseln abgeleitete Token, nicht die Schlüssel selbst. Um zu zählen, wie viele Personen ein Journal verwenden, bekommt er eine Kennung, die für jedes Journal eine andere ist und nicht verrät, wer jemand ist.

## Was daraus folgt

- Verlorene Wörter lassen sich nicht wiederherstellen, von niemandem.
- Wer die Wörter hat, hat das Journal. Gib nur weiter, was nötig ist: den Ally-Code denen, die schreiben, den Guest-Code denen, die lesen.
- Exporte als reiner Text und Kalenderdateien sind nicht verschlüsselt; sie sollen die Agenda verlassen.
- Die Kopie in deinem Browser liegt mit deiner PIN verschlüsselt. Wer den Speicher eines gestohlenen Geräts ausliest, könnte außerhalb der App dennoch alle PINs durchprobieren; eine längere PIN macht das deutlich langsamer. *Clear data in this browser* entfernt die Kopie.

## Selbst nachprüfen

Der Code ist öffentlich. Die Datei auf dem Server lässt sich herunterladen und ansehen; das Kommandozeilenwerkzeug liest sie mit den Wörtern, ohne die Web-App. Die Einzelheiten stehen in der technischen Dokumentation (siehe *Fehlersuche*).
