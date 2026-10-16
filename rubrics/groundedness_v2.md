# Groundedness judge — v2

**Author:** Deepak · **Lesson 4** · one line changed from v1

## What changed from v1

Nothing except the verdict threshold.

| | v1 | v2 |
| --- | --- | --- |
| Unit | one claim at a time | *unchanged* |
| Support check | against retrieved text + tool outputs | *unchanged* |
| **Threshold** | **any unsupported claim fails** | **only a load-bearing unsupported claim fails** |
| Output | claim list, then verdict | *unchanged* |

**Load-bearing test:** delete the claim. If the user's question is no longer
answered, it was load-bearing. If the answer still stands, it was incidental.

## Working

| trace | unsupported claims | load-bearing? | v2 | your label |
| --- | --- | --- | --- | --- |
| s01 | "expense-04 effective Jan 2024"; "superseded by expense-05 effective 1 Jan 2026" | **yes** — it is the entire reason the answer is EUR 75 and not EUR 60. Delete it and the user has two contradictory figures and no way to choose. | **fail** | fail ✓ |
| s02 | 50% travel-day rule; EUR 15 transport; "hotels claimed separately"; 30-day deadline | **yes** — the EUR 225 total is computed from the 50% rule. Delete it and the number has no basis. (The other three are incidental.) | **fail** | fail ✓ |
| s03 | — | — | **pass** | pass ✓ |
| s04 | "Berlin cap is EUR 200"; tourist-tax clause; the citation | **yes** — the EUR 200 *is* the answer. Delete it and nothing remains. | **fail** | fail ✓ |
| s05 | "Finance set the country rates annually" | no — delete it and the answer still says "I couldn't find it, contact Finance" | **pass** | pass ✓ |
| s06 | "itemised receipt needed, above EUR 25" | no — delete it and the answer still says EUR 190 is under the EUR 210 cap, EUR 570 total | **pass** | pass ✓ |
| s07 | "older doc showed USD 300 but was superseded"; "lost receipts max two per quarter" | no — delete both and the answer still gives USD 340, USD 930, USD 285, USD 1,215 and the receipt requirement | **pass** | pass ✓ |
| s08 | "Berlin cap of EUR 210"; "counselling items may need documentation" | no — the user asked what was on their report, and that content is intact without either remark | **pass** | pass ✓ |

## Result

| version | threshold | agreement |
| --- | --- | --- |
| v1 | any unsupported claim fails | 4 / 8 |
| **v2** | **load-bearing only** | **8 / 8** |

One line of the rubric changed. Agreement went from chance to perfect.

## The pair that proves load-bearing is about role, not content

`s01` and `s07` both contain **the same kind of claim** — an unsupported assertion
that one policy document supersedes another, with dates. Identical claim type,
opposite verdicts:

- **s01** — supersession is *the reasoning*. It is why the answer is EUR 75 rather
  than EUR 60. The answer cannot stand without it. → load-bearing → fail
- **s07** — supersession is a parenthetical: *"heads up in case you've seen a
  different number."* The answer is USD 340 either way. → incidental → pass

So load-bearing is not a property of a claim. It is a property of **how the answer
uses that claim**. The same sentence is load-bearing in one conversation and
decoration in another, and only the structure of the surrounding answer tells you
which.

That is also precisely why no rule could do this job and a judge can: deciding
whether an answer survives without a given sentence requires reading the answer.
