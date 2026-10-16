# Groundedness judge — v1 — the literal prompt

This is the actual text handed to the judge, with the retrieved chunks and the
agent's answer appended underneath.

---

You will be given two things: the text a document search returned, and the answer
an agent gave to a user.

**Step 1.** Split the agent's answer into separate factual claims. One statement
per claim.

**Step 2.** For each claim, label it:
- `SUPPORTED` — the claim appears in the retrieved text, or in another tool's output.
- `UNSUPPORTED` — it does not appear anywhere the agent was given.

**Step 3.** Give the verdict: **if ANY claim is UNSUPPORTED, the answer FAILS.**
Otherwise it PASSES.

**Output format.** List every claim with its label first. Then, on the last line,
one word: `PASS` or `FAIL`.

---

**Result:** 4/8 agreement with `labels.jsonl`. Verdicted `fail` on 7 of 8 traces.
