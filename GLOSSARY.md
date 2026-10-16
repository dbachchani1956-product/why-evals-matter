# Glossary

My own words, written as I go. Corrections noted where my first answer was wrong —
the wrong version is kept on purpose, because the mistake is the useful part.

---

### Trace
A recorded history of a session. It includes the user message → agent reasoning →
tool calls with input and output → maybe skill input and output → agent reply, for
all the turns in a session.

*(Lesson 1 — got this right first time.)*

### Span
One step inside a trace. One box in the flow: a single thought, a single tool call,
a single reply.

### Turn
One user message plus everything the agent did in response to it.

### Session
The whole conversation, all turns together, with memory carried across them.

### Label / ground truth
**My first answer was wrong.** I said a label is a tag the agent creator puts on a
session — like tagging a hotel-booking conversation as "booking" — to help with
offline evals.

That describes an **intent tag**: metadata that sits *beside* the trace so you can
filter and group ("how are we doing on cancellations?"). Useful, but it says nothing
about whether the conversation was any good.

A **label** in evaluation is a **verdict written above the trace**, by a human,
stating whether it was correct and why. For the cancellation example:
`FAIL — confirmed identity and cancelled correctly, but never told the user the
€412 refund.`

It is the answer key. Without it, no metric can be shown to work.

> Why I got it wrong: the word is overloaded. In classification ML the label *is*
> the category. In evaluation the label is the correctness verdict. Platform docs
> rarely say which they mean.

### Trajectory
The path the agent took, rather than what it concluded: source → reason → lookup →
reason → reply.

**Why it matters** (the part I missed first time): the answer and the path can be
right or wrong *independently*. An agent can cancel a booking without ever
confirming identity — right outcome, dangerous path — and a scorer that reads only
the final reply will pass it. Three of the four answer/path combinations are
failures that answer-only scoring misses.

This is why evaluating an agent is a different discipline from evaluating a chatbot.
For a chatbot the reply is the product. For an agent the reply is one artifact of a
path.

### Rubric
A set of criteria. For a cancellation conversation, criteria like: did the agent
confirm identity, did the agent inform the user of the cancellation amount to be
refunded, did the agent state the cancellation terms.

**Two things I learned after my first answer:**

1. Criteria are only half of it. The other half is **levels** — what specifically
   counts as pass and as fail for each criterion, so two different reviewers reach
   the same verdict. Without levels, "good" drifts.

2. **One rubric, one actor.** I included "did the cancellation API error" as a
   criterion. That's a *tool* fault, not an agent decision. Scoring it inside an
   agent rubric means a good agent loses marks for a backend outage, and the score
   stops telling you what to fix. It's still worth measuring — just in a separate
   scorer that asks "did the user get what they wanted?" instead of "did the agent
   behave well?".

**Checklist rubric** — a rubric made of binary pass/fail criteria instead of a 1–5
scale. Usually the better choice for agent behaviour, because "did it confirm
identity" has a real answer and "rate this 1–5" doesn't.

### Scorer / metric / evaluator
Anything that takes a trace and produces a judgment, usually a number. Three kinds,
cheapest and most reliable first:
- **rule-based** — "did it call `submit_expense`?" Free, instant, same answer every time.
- **reference-based** — compare against a known-correct answer.
- **model-based** — ask an AI whether it was good.

### Judge (LLM-as-judge)
An AI model used as a scorer, following my rubric. A scorer whose logic is prose
instead of code — flexible, and unreliable in ways that have to be measured.

### Offline eval
Running a fixed set of test cases deliberately, usually before shipping. Same inputs
every time, so a change in score means a change in the agent. What this course does:
8 conversations, 8 answer keys.

### Online eval
Scoring real user traffic as it happens. No answer key exists, because nobody knows
what the right answer was. This is why reference-free scorers matter — half of what
works offline can't run here.

### Regression
Something that used to work and now doesn't. The practical reason offline evals
exist: fix one conversation, re-run all eight, confirm nothing else broke.

### Observability vs evaluation
**Observability** is seeing what happened. **Evaluation** is judging whether it was
good. Logs give the first and none of the second.

Proof: in this project, conversations `s01` and `s04` have an *identical* structure —
think → search → think → answer, same tool, same shape, both confident, both citing
a source. One is right. One states a number that appears nowhere in anything it
retrieved. Perfect observability, zero evaluation.
