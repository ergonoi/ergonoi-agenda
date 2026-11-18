# Kommandozeile

*Ein Journal im Terminal lesen, ergänzen und bearbeiten.*

## Wofür

`agenda-cli` ist ein kleines Programm für Skripte, Sicherungen und das Übertragen von Zeilen zwischen Journalen. Es liest ein Journal von einem Server oder aus einer gespeicherten Datei, gibt es entschlüsselt aus, hängt Zeilen an oder öffnet es in einem Texteditor. Es nimmt die acht Wörter, einen Ally-Code oder einen Guest-Code, speichert nichts auf der Platte und hält die Schlüssel nur, solange es läuft.

## Aufruf

Das erste Argument ist die Quelle: eine Serveradresse oder eine Journaldatei.

```
agenda-cli https://agenda.example.org                 # fragt nach den Wörtern, gibt das Journal aus
agenda-cli backup/4f3a….enc -o journal.txt             # eine gespeicherte Datei, in eine Textdatei
agenda-cli https://agenda.example.org -open            # nur offene Einträge
agenda-cli https://agenda.example.org add "Anna anrufen #facet-work"
```

`add` hängt Zeilen genau so an, wie sie angegeben sind. Eine Zeile, die schon vorhanden ist, wird übersprungen; eine Zeile, die einen vorhandenen Eintrag ändern würde, wird abgewiesen, außer `-strip-ids` nimmt ihr die Identität.

## Bearbeiten

```
agenda-cli https://agenda.example.org edit
```

öffnet das Journal im Editor, nach Art von `visudo`: Der Text liegt während der Bearbeitung im Arbeitsspeicher, wird beim Speichern geprüft, und nur was sich geändert hat, wird angehängt. Entfernte Zeilen werden nicht gelöscht; ein Eintrag wird mit `#done` abgeschlossen.

## Rückgabewerte

`0` Erfolg, `1` Fehler, `2` falscher Aufruf, `3` nichts geschrieben, weil Zeilen vorhandene Einträge geändert hätten.

Die vollständige Beschreibung steht im Repository, in `clients/cli/README.md`.
