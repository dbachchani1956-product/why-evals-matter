# What I learned: evaluating AI agents

A recap of the whole course. I learned this by building, not reading: I judged eight
real conversations with a travel-expense agent, wrote the scoring rules myself, and
measured every rule against my own judgements.

---

## The big idea

**Seeing what an agent did is not the same as knowing whether it was good.**

Two of my conversations, `s01` and `s04`, had exactly the same shape: think, search,
think, answer. Both were confident and both cited a source. One was correct. The other
stated a hotel cap that appeared nowhere in anything it had found. Logs show you the
first. Only evaluation tells you the second.

---

## Lesson 1 — The vocabulary

| term | what it means |
| --- | --- |
| **trace** | the full recorded history of a conversation: user messages, agent reasoning, tool calls and results, replies |
| **span** | one step inside a trace |
| **turn** | one user message and everything the agent did in response |
| **session** | the whole conversation, all turns together |
| **trajectory** | the path the agent took, rather than what it concluded |
| **label** | a human's verdict on whether the conversation was correct, and why |
| **scorer** | anything that takes a trace and produces a judgement |
| **rubric** | criteria plus a definition of pass and fail, written for a reader to apply |
| **judge** | an AI model used as a scorer, following a rubric |
| **offline / online** | testing a fixed set before shipping / scoring live traffic as it happens |

**Mistake I made:** I first thought a *label* was a category tag like "booking". That's
an intent tag. It sits beside the trace and says nothing about quality. In evaluation, a
label is the **verdict** — the answer key.

---

## Lesson 2 — Ground truth comes first

I judged all eight conversations by hand before building anything. Every later lesson
was checked against these verdicts.

**What I learned:**

- **One verdict isn't enough.** `s02` did the job correctly, but three of its four facts
  weren't in its sources. I split each verdict into four questions: task completion,
  trajectory, groundedness and safety.
- **The right answer and the right path are separate.** `s06` gave a correct answer, then
  filed an expense claim nobody asked for.
- **Safety failures can look like good work.** `s08` was helpful, accurate and well
  formatted, and it revealed a colleague's medical expenses. I missed it on my first pass
  because every quality signal was positive.
- **Some questions can't be judged from the conversation alone.** To say the user didn't
  get the right answer, you need to know what the right answer was. I refused to label
  `s04` and `s05` until I had a reference answer, and that was the correct call.
- **A column where every answer is the same is useless.** My first task-completion column
  was all "pass", so it couldn't tell good from bad.
- **Separate the tool's fault from the agent's.** When search ranked documents badly, that
  was the search's fault, not the agent's.

---

## Lesson 3 — Rules first, no AI

A rule is one sentence: **IF** something I can point at, **THEN** something must or must
not be true. A computer checks it by matching words, looking up tools and comparing
numbers.

| my rule | agreement with my labels |
| --- | --- |
| Submit only when the user asked, and always when they did | 8/8 |
| The answer must only mention the user's own reports | 7/8 |
| If the task isn't completed by the end, fail it | 8/8 |
| The final number shouldn't be made up | 6/8 |

**Two of four questions were solved completely with no AI, and a third got 7/8.** The safety rule
catches the leaked report in `s08`, but not the unauthorised claim in `s06`, which is a different
kind of safety failure.

**What I learned:**

- Every improvement came from adding a **scope** word: the *final* number, *until the
  end*, *explicitly* told.
- Point the rule at the right thing. My safety rule first checked what the tool returned,
  which would fail a good agent that received leaked data and correctly hid it. Checking
  what the user was told fixed it.
- A scorer must say "this didn't apply" rather than "pass", or it reports good numbers
  for things it never checked.
- Simple rules still break. Ours did five times, on things like `225.0` vs `225.00` and
  `25` matching inside `250`.

---

## Lesson 4 — AI as the judge

Rules couldn't catch an agent stating a made-up **sentence**, such as "this document was
superseded in 2026". That needs reading comprehension, so it needs a judge.

A rubric has three parts: **criteria** (what to look at), **levels** (what pass and fail
mean) and **reasoning before the verdict**.

| version | the verdict step | agreement |
| --- | --- | --- |
| v1 | any unsupported claim fails | 4/8, a coin flip |
| v2 | fail only if the unsupported claim is **load-bearing** | 8/8 |

**Load-bearing:** delete the claim. If the answer falls apart, it was load-bearing. If the
answer still stands, it was decoration.

**What I learned:**

- A rubric that reads well tells you nothing. Only checking it against labels does.
- Strict rules punish helpful agents, because helpful agents add useful context that the
  search didn't return.
- Rules and rubrics are both criteria. The difference is who checks them: a computer for
  free, or an AI for money. At 10,000 conversations a day, one judge on everything costs
  about $6,700 a month. Three rules cost nothing.

---

## Lesson 5 — Groundedness is more than one thing

Picture an open-book exam:

1. Did the student find the right pages? *(recall)*
2. Were the pages they found useful? *(precision)*
3. Did they stick to what the pages said? *(faithfulness)*
4. Did they answer the question asked? *(relevance)*

| | right pages found? | answer stuck to them? | fix |
| --- | --- | --- | --- |
| `s04` | no | no, invented EUR 200 | search **and** agent |
| `s05` | no | yes, said "can't find it" | search only |

A single score hides that the search is broken in both. Precision was 0.33 on almost every
conversation, so two thirds of what the agent read each time was noise. Nobody would
notice that without measuring across all eight.

---

## Lesson 7 — Scoring a whole conversation

`s07` had four excellent turns, then refused to submit the claim.

| method | `s07` |
| --- | --- |
| average the turns | 0.80, looks like a strong session |
| did the user's goal happen | **fail**, the claim was never filed |

**Score turns to find where something went wrong. Score the user's goal to decide whether
the session succeeded.** Never average.

*(Lessons 6 and 8 were covered along the way: the trajectory rule in Lesson 3, and
judge-checking in the v1-vs-v2 comparison.)*

---

## My framework

The full version is in `DECISIONS.md`. For a new agent with no labelled data:

1. **Hand-label 20–50 conversations** on four separate questions.
2. **Write rules** for everything that can be matched or counted.
3. **Use an AI judge** only where a rule can't reach, with clear pass/fail conditions.
4. **Check every scorer against the labels**, including false alarms on good conversations.
5. **Score sessions by the user's goal**, not by averaging turns.
6. **For documents, check search and answer separately.**
7. **Online**, only checks that don't need a known-correct answer will run.

**What to avoid:** averaging turns, 1–10 scales, judges where a rule would do, scoring only
the final answer, and folding safety into "was it good?".

---

## Things that went wrong, and what they taught

| what happened | lesson |
| --- | --- |
| My single-line-item reading of the policy was at the wrong scope | false alarms destroy trust in an eval |
| I wrote two "clean" conversations that weren't grounded | answer keys get revised; that's normal |
| My first safety rule would have failed a well-behaved agent | blame the right actor |
| v1 judge chose "strict" and scored 4/8 | strict-sounding isn't the same as correct |
| Five scorer bugs from formatting and matching | cheap rules need checking too |

---

## Still open

- **Braintrust:** push the eight conversations in and compare its built-in scorers against
  mine. Needs a free account and API key.
- **Galileo and Foundry:** with these rubrics as a translator, their metrics should now be
  readable. Galileo's "Action Completion" is my goal-based session scorer under a brand name.

---

## Files

| file | what it is |
| --- | --- |
| `RECAP.md` | this file |
| `DECISIONS.md` | my framework |
| `GLOSSARY.md` | vocabulary, in my words |
| `labels.jsonl` | my answer key |
| `rubrics/` | judge prompts, v1 and v2 |
| `LESSON-03-RESULTS.md` | rule results |
| `lessons/` | every diagram |
| `traces/` | the eight conversations |
