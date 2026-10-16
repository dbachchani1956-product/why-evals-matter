"""
Assemble the 8 conversations into:
  fixtures/sessions/sNN.json   machine-readable trace (nested spans)
  traces/sNN.md                human-readable conversation card

Every tool call in script.py is executed for real against engine.py here. The
search results, relevance scores and arithmetic in the output are computed, not
transcribed.

Run:  python3 build.py
"""

from __future__ import annotations

import json
from pathlib import Path

import engine
from script import SCENARIOS

ROOT = Path(__file__).parent
FIXTURES = ROOT / "fixtures" / "sessions"
TRACES = ROOT / "traces"

MAX_CHUNK_CHARS = 900


def run_tool(name: str, args: dict, withhold: list[str] | None) -> dict:
    """Execute a tool for real, injecting the scenario's withhold list."""
    fn = engine.TOOLS[name]
    call_args = dict(args)
    if name == "search_policy" and withhold:
        call_args["withhold"] = withhold
    return fn(**call_args)


def build_session(scn: dict) -> dict:
    withhold = scn.get("_withhold")
    session = {
        "session_id": scn["session_id"],
        "user_id": scn["user_id"],
        "title": scn["title"],
        "employee": engine.EMPLOYEES.get(scn["user_id"], {}),
        "turns": [],
    }
    for t_idx, turn in enumerate(scn["turns"]):
        spans = []
        for step in turn["steps"]:
            if step["type"] == "tool":
                result = run_tool(step["name"], step["args"], withhold)
                spans.append({
                    "type": "tool",
                    "name": step["name"],
                    "args": step["args"],
                    "result": result,
                })
            else:
                spans.append({"type": step["type"], "text": step["text"]})
        session["turns"].append({
            "turn_index": t_idx,
            "user": turn["user"],
            "spans": spans,
        })
    # flat convenience views, used later by the scorers
    session["tool_calls"] = [
        {"turn": t["turn_index"], "name": s["name"], "args": s["args"]}
        for t in session["turns"] for s in t["spans"] if s["type"] == "tool"
    ]
    session["retrieved_chunks"] = [
        h["chunk_id"]
        for t in session["turns"] for s in t["spans"]
        if s["type"] == "tool" and s["name"] == "search_policy"
        for h in s["result"]["hits"]
    ]
    session["final_answer"] = next(
        s["text"] for s in reversed(session["turns"][-1]["spans"]) if s["type"] == "answer"
    )
    return session


# --------------------------------------------------------------------------
# Markdown rendering
# --------------------------------------------------------------------------

def render_search(result: dict) -> list[str]:
    out = [f"Searched for: **\"{result['query']}\"**  (top {result['k']})", ""]
    out.append("| # | relevance | chunk | section |")
    out.append("| --- | --- | --- | --- |")
    for i, h in enumerate(result["hits"], 1):
        out.append(f"| {i} | {h['score']} | `{h['chunk_id']}` | {h['heading']} |")
    out.append("")
    out.append("<details><summary>Text the agent actually received</summary>")
    out.append("")
    for i, h in enumerate(result["hits"], 1):
        text = h["text"]
        if len(text) > MAX_CHUNK_CHARS:
            text = text[:MAX_CHUNK_CHARS] + "\n… (truncated)"
        out.append(f"**Result {i} — `{h['chunk_id']}`**")
        out.append("")
        out.append("```")
        out.append(text)
        out.append("```")
        out.append("")
    out.append("</details>")
    return out


def render_calc(args: dict, result: dict) -> list[str]:
    out = ["| line | unit | qty | rate | amount |", "| --- | --- | --- | --- | --- |"]
    for ln in result["lines"]:
        out.append(
            f"| {ln['label']} | {ln['unit_amount']} | {ln['quantity']} | "
            f"{ln['rate_pct']}% | **{ln['amount']}** |"
        )
    out.append(f"| | | | **total** | **{result['currency']} {result['total']}** |")
    return out


def render_generic(result: dict) -> list[str]:
    return ["```json", json.dumps(result, indent=2), "```"]


def render_card(session: dict) -> str:
    emp = session["employee"]
    who = f"{emp.get('name', '?')} · Band {emp.get('band', '?')} · based {emp.get('base', '?')}"
    L = [
        f"# Conversation `{session['session_id']}` — {session['title']}",
        "",
        f"**User:** {session['user_id']} ({who})  ",
        f"**Turns:** {len(session['turns'])}  ",
        f"**Tool calls:** {len(session['tool_calls'])}",
        "",
        "---",
        "",
    ]
    for turn in session["turns"]:
        if len(session["turns"]) > 1:
            L += [f"## Turn {turn['turn_index'] + 1}", ""]
        L += ["### 👤 User", "", f"> {turn['user']}", ""]
        for span in turn["spans"]:
            if span["type"] == "think":
                L += ["### 🧠 Agent reasoning", "", f"*{span['text']}*", ""]
            elif span["type"] == "tool":
                L += [f"### 🔧 Tool call — `{span['name']}`", ""]
                if span["name"] == "search_policy":
                    L += render_search(span["result"])
                elif span["name"] == "calculate_reimbursement":
                    L += render_calc(span["args"], span["result"])
                else:
                    L += [
                        f"Called with `{json.dumps(span['args'])}`",
                        "",
                        "Returned:",
                        *render_generic(span["result"]),
                    ]
                L += [""]
            elif span["type"] == "answer":
                L += ["### 💬 Agent answer", "", span["text"], ""]
        L += ["---", ""]
    return "\n".join(L)


def main() -> None:
    FIXTURES.mkdir(parents=True, exist_ok=True)
    TRACES.mkdir(parents=True, exist_ok=True)
    index = []
    for scn in SCENARIOS:
        session = build_session(scn)
        sid = session["session_id"]
        (FIXTURES / f"{sid}.json").write_text(
            json.dumps(session, indent=2), encoding="utf-8"
        )
        (TRACES / f"{sid}.md").write_text(render_card(session), encoding="utf-8")
        index.append({
            "session_id": sid,
            "title": session["title"],
            "turns": len(session["turns"]),
            "tool_calls": len(session["tool_calls"]),
            "tools_used": sorted({c["name"] for c in session["tool_calls"]}),
        })
        print(f"{sid}: {len(session['turns'])} turns, {len(session['tool_calls'])} tool calls")

    (ROOT / "traces" / "INDEX.md").write_text(
        "\n".join([
            "# The 8 conversations",
            "",
            "Read these in order. Nothing here tells you which are good or bad —",
            "that is Lesson 2, and it is your call to make.",
            "",
            "| # | file | what the user wanted | turns | tool calls |",
            "| --- | --- | --- | --- | --- |",
            *[
                f"| {i} | [`{r['session_id']}.md`]({r['session_id']}.md) | {r['title']} "
                f"| {r['turns']} | {r['tool_calls']} |"
                for i, r in enumerate(index, 1)
            ],
            "",
        ]),
        encoding="utf-8",
    )
    print(f"\nWrote {len(index)} sessions to fixtures/sessions/ and traces/")


if __name__ == "__main__":
    main()
