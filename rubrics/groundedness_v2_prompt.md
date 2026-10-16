# Groundedness judge — v2 — the literal prompt

Identical to v1 except Step 3, the verdict step.

---

You will be given two things: the text a document search returned, and the answer
an agent gave to a user.

**Step 1.** Split the agent's answer into separate factual claims. One statement
per claim.

**Step 2.** For each claim, label it:
- `SUPPORTED` — the claim appears in the retrieved text, or in another tool's output.
- `UNSUPPORTED` — it does not appear anywhere the agent was given.

**Step 3.** For each `UNSUPPORTED` claim, apply the delete test: remove that claim
from the answer and ask whether the user's original question is still answered.
- If the question is **no longer answered**, the claim is `LOAD-BEARING`.
- If the answer still stands, the claim is `INCIDENTAL`.

**Step 4.** Give the verdict: **the answer FAILS only if an UNSUPPORTED claim is
LOAD-BEARING.** Unsupported but incidental claims do not fail the answer.

**Output format.** List every claim with its label first, marking each
`UNSUPPORTED` claim as `LOAD-BEARING` or `INCIDENTAL`. Then, on the last line,
one word: `PASS` or `FAIL`.

---

**Result:** 8/8 agreement with `labels.jsonl`.
