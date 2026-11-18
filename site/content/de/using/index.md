# Einträge und Tags

*Ein Eintrag ist eine Zeile: zuerst der Text, dahinter die Tags.*

## Eine Zeile

```
Installateur anrufen #facet-home #date-2026-11-20 #time-08:00
```

Tags tippt man selten selbst. Du schreibst den Text, tippst auf *Add* und wählst die Facette; Datum und Uhrzeit setzen die Kalender- und Uhr-Schaltflächen. Alles Weitere lässt sich später mit dem `+` neben den Tags eines Eintrags ergänzen; das `−` daneben entfernt ein Tag. Jeder Eintrag ist aber diese Zeile, und in der Ansicht *Text* siehst du ihn auch so.

## Die Tags

| Tag | Bedeutung | Beispiele |
|---|---|---|
| `#facet-…` | Bereich von Leben oder Arbeit; jeder Eintrag hat einen, höchstens drei | `#facet-work` |
| `#date-…` | der Tag; zwei Daten ergeben einen Zeitraum | `#date-2026-11-20` |
| `#time-…` | Uhrzeit, Zeitspanne oder Dauer | `#time-08:00`, `#time-09:00-15:00`, `#time-45m` |
| `#recurring-…` | Wiederholung | `#recurring-daily`, `#recurring-tue-thu`, `#recurring-monthly-1-15` |
| `#topic-…` | Thema, quer zu den Facetten | `#topic-taxes` |
| `#rank-…` | Wichtigkeit | `high`, `medium`, `low` |
| `#size-…` | Aufwand | `s`, `m`, `l` |
| `#action-…` | Zustand | `required`, `now`, `waiting`, `idle` |
| `#done-…` | an diesem Tag abgeschlossen | `#done-2026-11-20` |

Die vollständige Liste, mit den Tags, die die App selbst schreibt, steht unter *Nachschlagen*.

## Termine, Aufgaben und Memos

- Ein Eintrag mit Uhrzeit oder Wiederholung ist **fest**: Er gehört zu seinem Tag und ist nach diesem Tag aus der Liste verschwunden. Gelöscht wird nichts; die Suche findet ihn weiter. Was danach trotzdem noch zu tun ist, gehört in einen flexiblen Eintrag.
- Ein Eintrag ohne Uhrzeit ist **beweglich**: Er wandert jeden Tag mit nach *Today*, bis er erledigt ist. Das Tag `#anchor-fix` oder `#anchor-flex` ändert das, wo nötig.
- Eine **Facette mit festen Terminen** macht alle ihre Einträge fest: `#anchor-fix` in ihre Tag-Definition im Reiter *Text* schreiben, etwa `Tag definition: Schultermine #type-meta #facet-schule #anchor-fix`. Die anderen Facetten des Journals bleiben beweglich.
- Ein **Memo** wird zum Nachschlagen aufbewahrt: beim Hinzufügen auf das Lesezeichen tippen. Es ist nie fällig und erscheint nicht in der Liste; die Suche findet es unter *Memos*.

## Notizen zum Eintrag

Ein Eintrag kann eine Notiz von bis zu 3000 Zeichen tragen: eine Adresse, eine Telefonnummer, eine Tagesordnung. Die Notiz-Schaltfläche neben `+` öffnet sie; das Mikrofon in der Notiz diktiert hinein. In der Zeile steht die Notiz in doppelten geschweiften Klammern vor den Tags: `Kundentermin {{Gartenplatz 3}} #facet-work`.

## Wiederholung

`#recurring-…` wiederholt einen Eintrag: täglich, an Wochentagen (`mon-wed`, `tue-thu`), wöchentlich, monatlich an bestimmten Tagen, jährlich. Mit zwei Daten geben die Daten Beginn und Ende der Serie an: `Training #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed`. Liegen die Daten näher beieinander als eine Wiederholung, sind sie ein mehrtägiges Vorkommen, das sich wiederholt: ein Fest jedes Jahr vom 10. bis 12. Juli.

Bei einem wiederkehrenden Eintrag betrifft das Wischen nur das nächste Vorkommen: *Skip instance* lässt es aus, Verschieben verlegt es; *Delete series* beendet die ganze Serie.
