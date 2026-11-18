# Entries and tags

*An entry is one line: text first, tags after it.*

## One line

```
Call the plumber #facet-home #date-2026-11-20 #time-08:00
```

You rarely type tags yourself. Write the text, tap *Add*, choose the facet; date and time are set with the calendar and clock buttons. Everything else can be added later with the `+` next to an entry's tags. But every entry is this line, and in the *Text* view you see it as such.

## The tags

| Tag | Meaning | Examples |
|---|---|---|
| `#facet-…` | area of life or work; every entry has one, at most three | `#facet-work` |
| `#date-…` | the day; two dates make a span | `#date-2026-11-20` |
| `#time-…` | a time, a span or a duration | `#time-08:00`, `#time-09:00-15:00`, `#time-45m` |
| `#recurring-…` | repetition | `#recurring-daily`, `#recurring-tue-thu`, `#recurring-monthly-1-15` |
| `#topic-…` | subject, across facets | `#topic-taxes` |
| `#rank-…` | importance | `high`, `medium`, `low` |
| `#size-…` | effort | `s`, `m`, `l` |
| `#action-…` | state | `required`, `now`, `waiting`, `idle` |
| `#done-…` | closed on this day | `#done-2026-11-20` |

The complete list, with the tags the app writes itself, is in *Reference*.

## Events, tasks and memos

- An entry with a time or a repetition is **fixed**: it belongs to its day. If the day passes without *Done*, it waits under *Past* at the top of the list, so that a missed visit is not lost.
- An entry without time is **flexible**: it moves along to *Today* each day until it is done. The tag `#anchor-fix` or `#anchor-flex` changes this where needed.
- A **memo** is kept to be looked up: tap the bookmark when adding. It is never due and does not appear in the list; the search finds it under *Memos*.

## Notes

An entry can carry a note of up to 500 characters: an address, a phone number, an agenda. The note button next to `+` opens it. In the line, the note stands in double braces before the tags: `Meet the client {{Garden Square 3}} #facet-work`.

## Repetition

`#recurring-…` repeats an entry: daily, on weekdays (`mon-wed`, `tue-thu`), weekly, monthly on given days, yearly. With two dates, the dates give start and end of the series: `Training #date-2026-11-16 #date-2027-03-31 #time-12:00-13:00 #recurring-mon-wed`. If the dates are closer than one repetition, they are one occurrence over several days that repeats: a festival every year from 10 to 12 July.

On a recurring entry, swiping concerns the next occurrence only: *Skip* it or move it; *Delete series* ends the whole series.
