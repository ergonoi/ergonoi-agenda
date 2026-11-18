# Tags

*Every tag the agenda reads or writes.*

## Tags you set

| Tag | Meaning | Values |
|---|---|---|
| `#facet-…` | area of life or work; one to three per entry, the first decides journal and colour | your own names |
| `#topic-…` | subject across facets; up to three | your own names, words joined by hyphens |
| `#date-…` | the day; two dates make a span or the limits of a series | `YYYY-MM-DD` |
| `#time-…` | time, span or duration | `08:00`, `09:00-15:00`, `45m`, `1h30m` |
| `#recurring-…` | repetition | `daily`, `weekly`, `mon-wed`, `tue-thu`, `monthly-1-15`, `yearly` |
| `#anchor-…` | fixed to its day, or moving along until done | `fix`, `flex` |
| `#rank-…` | importance | `high`, `medium`, `low` |
| `#size-…` | effort | `s`, `m`, `l` |
| `#action-…` | state | `required`, `now`, `waiting`, `idle` |
| `#type-…` | kind of line | `memo`, `meta` |
| `#done-…` | closed on that day | `YYYY-MM-DD` |

## Tags the app writes

| Tag | Meaning |
|---|---|
| `#id-…` | the identity of an entry; it stays the same through every change |
| `#rev-…` | the revision; the highest one is the current state of an entry |
| `#skip-…` | a single occurrence of a series that is skipped |
| `#moved-…` | left behind where an entry moved to another journal |
| `#review-…` | something to check, for example a value that could not be read |
| `#ref-…` | a reference to another entry |

## Lines about the journal

These lines carry `#type-meta` and never appear in the list:

```
Journal name: Home #type-meta
Tag definition: family appointments #facet-family #type-meta
Journal version: 0.6.0 #type-meta
```

The name is what everybody who shares the journal sees; a Tag definition keeps a facet or topic and says what it stands for; the version tells older apps that they can only read the journal.
