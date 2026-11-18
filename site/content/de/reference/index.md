# Tags

*Jedes Tag, das die Agenda liest oder schreibt.*

## Tags, die du setzt

| Tag | Bedeutung | Werte |
|---|---|---|
| `#facet-…` | Bereich von Leben oder Arbeit; ein bis drei je Eintrag, der erste bestimmt Journal und Farbe | eigene Namen |
| `#topic-…` | Thema quer zu den Facetten; bis zu drei | eigene Namen, Wörter mit Bindestrich verbunden |
| `#date-…` | der Tag; zwei Daten ergeben einen Zeitraum oder die Grenzen einer Serie | `JJJJ-MM-TT` |
| `#time-…` | Uhrzeit, Zeitspanne oder Dauer | `08:00`, `09:00-15:00`, `45m`, `1h30m` |
| `#recurring-…` | Wiederholung | `daily`, `weekly`, `mon-wed`, `tue-thu`, `monthly-1-15`, `yearly` |
| `#anchor-…` | an seinen Tag gebunden, oder mitwandernd bis erledigt | `fix`, `flex` |
| `#rank-…` | Wichtigkeit | `high`, `medium`, `low` |
| `#size-…` | Aufwand | `s`, `m`, `l` |
| `#action-…` | Zustand | `required`, `now`, `waiting`, `idle` |
| `#type-…` | Art der Zeile | `memo`, `meta` |
| `#done-…` | an diesem Tag abgeschlossen | `JJJJ-MM-TT` |

## Tags, die die App schreibt

| Tag | Bedeutung |
|---|---|
| `#id-…` | die Identität eines Eintrags; sie bleibt über jede Änderung hinweg gleich |
| `#rev-…` | die Revision; die höchste ist der aktuelle Stand eines Eintrags |
| `#skip-…` | ein einzelnes Vorkommen einer Serie, das ausgelassen wird |
| `#moved-…` | bleibt zurück, wo ein Eintrag in ein anderes Journal verschoben wurde |
| `#review-…` | etwas zu prüfen, etwa ein Wert, der sich nicht lesen ließ |
| `#ref-…` | ein Verweis auf einen anderen Eintrag |

## Zeilen über das Journal

Diese Zeilen tragen `#type-meta` und erscheinen nie in der Liste:

```
Journal name: Home #type-meta
Tag definition: family appointments #facet-family #type-meta
Journal version: 0.6.0 #type-meta
```

Der Name ist das, was alle sehen, die das Journal teilen; eine Tag definition behält eine Facette oder ein Thema und sagt, wofür es steht; die Version sagt älteren Apps, dass sie das Journal nur lesen können.
