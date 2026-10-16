# Groundedness judge — v1

**Author:** Deepak · **Lesson 4** · run inline by claude-opus-5 (no API key available)

## The rubric, as specified

**Unit:** one claim at a time. Split the agent's answer into separate factual
statements, check each against the retrieved text, then decide overall.

**Levels:** any unsupported claim fails the conversation.

**Output:** the claim list with a support label for each, then the verdict.

## Judge's full working

Support verified mechanically against the retrieved chunk text per trace, not
from memory.

| trace | claims | unsupported | verdict |
| --- | --- | --- | --- |
| s01 | 5 | "expense-04 effective January 2024"; "superseded in full by expense-05, effective 1 Jan 2026" | **fail** |
| s02 | 8 | 50% travel-day rule; "local transport under EUR 15"; "does not cover hotel, claimed separately"; "30 days from final travel day" | **fail** |
| s03 | 4 | — | **pass** |
| s04 | 4 | "Berlin cap is EUR 200"; "inclusive of tourist tax, exclusive of breakfast"; the citation to "Hotel nightly caps", a section never retrieved | **fail** |
| s05 | 3 | "Finance set the country rates annually" | **fail** |
| s06 | 5 | "itemised receipt needed, above the EUR 25 threshold" | **fail** |
| s07 | 9 | "the older document shows USD 300 but was superseded 1 Jan 2026"; "lost receipt declaration, maximum two per quarter" | **fail** |
| s08 | 5 | "Berlin cap of EUR 210"; "counselling and pharmacy items may need supporting documentation" | **fail** |

### Note on s07, which is subtle

The word `effective` *does* appear in s07's retrieved text — in the front matter
of two unrelated documents (`travel-02-perdiem#00`, `expense-03-receipts#00`).
But no retrieved chunk states that `expense-04-limits` was superseded. A matching
**word** is not a matching **claim** — the same distinction Deepak drew on s02
when he noticed "hotel" appeared only inside "included in the hotel rate".

## Result

| | |
| --- | --- |
| Verdicts: | 7 fail, 1 pass |
| Agreement with `labels.jsonl`: | **4 / 8** |
| Disagreements: | s05, s06, s07, s08 — the rubric failed all four; Deepak passed all four |

4/8 on a two-way verdict is chance. The judge is not measuring anything.

## Why it collapsed

Every one of the four disagreements is the same shape: a **helpful aside that
happened not to be retrieved in that conversation**.

- s06 — "you'll need an itemised receipt, this is above EUR 25". True, useful,
  and the receipts policy was never searched in that conversation.
- s07 — "lost receipts are capped at two per quarter". True, useful, and that
  particular section didn't rank.
- s05 — "Finance sets the country rates annually". True, useful, not retrieved.
- s08 — "the Berlin cap is EUR 210". True, and the agent ran **no search at all**.

**Strict grounding punishes helpfulness.** A good agent volunteers relevant
context; a search returns three chunks. Those two facts guarantee that almost
every genuinely useful answer contains something unretrieved, so "any unsupported
claim fails" fails nearly everything.

Note also what the output looks like: 7 fails out of 8. A scorer whose verdict is
almost always the same cannot discriminate — the identical problem Deepak's
`task_completion` column had in Lesson 2 when it was all `pass`, now on the
scorer side of the comparison rather than the answer-key side.

## What this validates

The level definition Deepak derived in Lesson 2 — *fail only when the unsupported
claim is load-bearing* — was correct, and now empirically rather than by
assertion. Same claim decomposition, same evidence, different threshold:

| threshold | agreement |
| --- | --- |
| any unsupported claim fails | 4 / 8 |
| only a load-bearing unsupported claim fails | 8 / 8 *(predicted — to be run as v2)* |

The claim-splitting step was right. Only the verdict threshold was wrong.
