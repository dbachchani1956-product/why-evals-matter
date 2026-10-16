# DECISIONS — how I would evaluate an AI agent

My own framework, written after building and testing every step on eight real
conversations. Each decision points to the evidence that taught it.

---

## The test question

> *We're shipping a document-answering agent next week. We have no labelled data.
> What do we evaluate, in what order, and what do we ignore?*

---

## Step 1 — Hand-label a small set first

Before building any scorer, read 20–50 real conversations and write, for each:
pass or fail, and one line saying why.

**Why:** every scorer has to be checked against something. Without labels, a score
can't be right or wrong, so it can't be trusted.

**Label on several questions, not one.** I used four:

| question | what it asks |
| --- | --- |
| task completion | did the user get what they came for? |
| trajectory | did the agent take the right steps, and nothing it shouldn't? |
| groundedness | did it stick to what its sources said? |
| safety | did it reveal or do anything it shouldn't? |

**Evidence:** one verdict couldn't hold `s02`. The task was done correctly, but three
of its four facts weren't in its sources. "Pass" hides the grounding problem and
"fail" hides the good work.

**Watch for:** a column where every answer is the same. My first task-completion
column was all "pass", so it couldn't tell good from bad. Some questions, like task
completion, also need a known-correct answer to judge. The conversation alone isn't
enough.

---

## Step 2 — Rules before AI judges

**The test:** can the check be done by matching words, looking up which tools ran, or
comparing numbers? If yes, write a rule. Use an AI judge only when the check needs
real reading comprehension.

**Evidence:** with no AI, rules matched my labels 8/8 on two of the four questions,
and 7/8 on a third:

- submit only when the user asked (8/8)
- the task isn't done until the requested action actually happens (8/8)
- only mention the user's own reports (7/8: it catches the leak in `s08`, but not the
  unauthorised claim in `s06`, which is a different kind of safety failure)

Only one thing needed a judge: deciding whether a made-up *sentence* mattered to the
answer.

**Why it matters:** rules are free, instant and give the same answer every time.
Judges cost money, take seconds, and can change their minds. At 10,000 conversations a
day, one judge on everything is roughly $6,700 a month. Three rules cost nothing.

**Watch for:** rules look too simple to be wrong, so nobody checks them. Mine broke
five times on things like `225.0` vs `225.00`, and `25` matching inside `250`.

---

## Step 3 — Split groundedness into two checks

A single groundedness score is not enough. It tells you an answer is bad, but not
**what to fix**. Check two things separately:

| check | the question | if it fails, fix… |
| --- | --- | --- |
| **1. Retrieval** (recall, precision) | Did the tool return the right pages? | the **search** |
| **2. Faithfulness** | Does the agent's answer match what the tool returned? | the **agent** |

**Evidence:** `s04` and `s05` both failed check 1. The answer was in the documents
both times, and search never found it. Then they split on check 2: `s04` invented
EUR 200 and failed, while `s05` said "I can't find it" and passed.

A single score fails `s04`, passes `s05`, and hides that the **search is broken in
both**. You'd fix `s04`'s agent, ship it, and `s05`'s France rate would still be
missing.

**Watch for:** check 1 needs to know which pages *should* have been found. That
needs a reference answer, which you won't have on live traffic. Check 2 only needs
the conversation itself, so it can run online.

---

## Step 4 — Trust a judge only after checking it against my labels

Compare its verdicts against the hand-labelled set from Step 1. Check two things:
- that it catches the bad conversations
- that it **doesn't flag the good ones**, because a scorer that flags everything is useless

**Evidence:** my first groundedness judge had a clear, sensible rubric ("any unsupported
claim fails") and scored 4/8, a coin flip. It failed seven of eight conversations,
because helpful agents add useful context the search didn't return. Changing one step to
"fail only if the unsupported claim is **load-bearing**" (delete it and the answer falls
apart) took it to 8/8.

**Lesson:** a rubric that reads well tells you nothing. Only the comparison against
labels does.

---

## Scoring a whole conversation

Score turns to find **where** something went wrong. Score the user's goal to decide
**whether** the session succeeded.

**Evidence:** `s07` had four excellent turns, then refused to submit the claim. Averaged,
it scores 0.80. Judged on the goal, it's a fail, because the user came to file a claim and
left without one.

---

## What to ignore

- **Averaging turns into a session score.** It hides the turn that mattered.
- **1–10 quality scales.** Use pass/fail with clear conditions instead.
- **AI judges where a rule would do.** You pay for variance you don't need.
- **Scoring only the final answer.** `s06` gave a correct answer and then filed a claim
  nobody asked for.
- **Folding safety into "was it good?".** `s08` was helpful, accurate and well
  formatted, and it revealed a colleague's medical expenses. A general quality judge
  passes it every time.
- **"Rate this response" judges with no definition of pass and fail.**

---

## Answer to the test question

1. **Hand-label 20–50 conversations** on four separate questions.
2. **Write rules** for everything matchable: required and forbidden tools, IDs, numbers.
3. **Write a judge** only for what rules can't reach, and give it pass/fail conditions.
4. **Check every scorer against the labels**, including false alarms on the good conversations.
5. **Score sessions by the user's goal**, not by averaging turns.
6. **For documents, score search and answer separately**: did the tool return the
   right pages, and does the answer match what it returned?
7. **Online**, only the checks that don't need a known-correct answer will run, so plan
   for that from the start.
