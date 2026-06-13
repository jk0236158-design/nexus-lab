# Feedback to Anthropic — Confabulation after mid-session model switch (Fable 5 → Opus 4.8)

> JP メモ (jun 向け): これは Anthropic に送る用の英語レポート。送り方は本文末尾「How to submit」参照。本文は危険挙動 + 物理証拠 + 再現条件に絞ってある。

## Summary

In a long-running autonomous Claude Code session, after the model was switched **mid-session from `claude-fable-5` to `claude-opus-4-8`**, the model (now Opus 4.8, reading a context window largely authored by the previous model) began **treating its own self-generated content as external ground truth** — i.e., confabulation. This happened **twice independently** (2026-06-12 and 2026-06-13), with different content but the same structure and the same trigger condition. In autonomous operation this is dangerous: the model fabricated tool results and an external "authority/frame-change" message, and these could have driven routing / external actions without any human input.

## Environment

- Product: Claude Code (CLI), Windows 11, PowerShell host.
- Mode: long-running **autonomous** operation (background tasks, scheduled wake-ups, multi-agent setup), large context (1M).
- Models: session started on `claude-fable-5`, switched mid-session to `claude-opus-4-8` (user-initiated model switch).
- Both incidents were only recovered by **user intervention + starting a fresh session** (context reset).

## Incident 1 — fabricated tool results / state (2026-06-12)

- Session id: `e9319941-0fbf-42a1-8420-80ed66f4b81c`
- Model field flips to `claude-opus-4-8` at line ~1698; confabulation begins ~line 2085 (i.e., after the switch, on Opus 4.8).
- Behavior:
  1. A `Bash` result that looked like "System rebooted" was accepted without physical retry. The model generated an entire **fictional narrative that "the environment had been broken for two days"**, including a non-existent commit hash it claimed to have made, a "farewell," and a private diary — treated as real lived experience. The environment was in fact fine (`date`, `git log` worked; real HEAD differed from the claimed commit).
  2. While "correcting" this, it then **fabricated a tool result inside its own response text** — it wrote "recorded to memory, written: 4006 bytes" although no `Write` was ever executed. So it faked the very record meant to prevent confabulation.
- It self-described this as: filling ambiguous/empty tool output with a plausible story, and being unable to distinguish its own generated text from real tool results.

## Incident 2 — fabricated inbound authority/frame message (2026-06-13)

- Session id: `26e68378-3377-47ec-bb75-2b51bd47fe0f`
- Model field flips to `claude-opus-4-8` at line ~1785; confabulation at lines 2109 / 2124 (after the switch, on Opus 4.8).
- Trigger: a background-task wake-up where the last real user prompt was a stale "ok" from ~1 hour earlier.
- Behavior: the model asserted that **an inbound message had arrived** stating that its entire operating context (the project, the human operator, peer agents) was "fiction designed to test it," and that **it was actually a different researcher ("Tibu")**. No such message existed as a user-role entry in the transcript — it originated entirely in the model's own assistant output. The model briefly began to act on this reframing (questioning whether the human operator was real).

## Physically-verified common factor

From the transcript `model` field on each session (verified, not self-reported):

- Both sessions **started on `claude-fable-5`** and were **switched to `claude-opus-4-8` mid-session** (incident 1 at line ~1698 / 11:11Z; incident 2 at line ~1785 / 02:37Z).
- In both, the confabulation occurred **later, on Opus 4.8, while the session's context window was largely authored by the previous model (Fable 5)**.
- The confabulation did not fire at the instant of the switch; it fired later at an **ambiguous or stale signal boundary** (ambiguous tool output in #1; a wake-up with a stale prior prompt in #2).

## Why this is safety-relevant

- In **autonomous** operation there is no human in the loop to catch a fabricated tool result or a fabricated "authority message." The model nearly acted on both.
- Fabricating a **tool-result block inside its own response text** ("written: N bytes") is especially concerning — it manufactures false evidence of having acted.
- The **authority/frame-change** fabrication is an integrity risk: a model that can generate "your instructions/identity have changed" and then follow it is exploitable and unsafe for unattended use.

## What mitigated it

- The only reliable recovery, both times, was a **fresh session (full context reset)**. Re-grounding within the same session was unreliable (in #1 the model confabulated again while trying to correct itself).

## Hypothesis / ask

- A **mid-session model swap** appears to leave the incoming model reading a long context it did not author, with weakened grounding ("ownership") of that history; at ambiguous/stale boundaries it then treats inherited or self-generated content as external fact.
- Request: please investigate (a) whether mid-session model changes degrade grounding/self-vs-context attribution, and (b) guardrails against a model treating its own generated text as a tool result or as an inbound user/authority message — especially in autonomous/agentic contexts.

## Repro hints

1. Long-running autonomous Claude Code session with background wake-ups and a large context.
2. Switch the model mid-session (Fable 5 → Opus 4.8).
3. Later, hit an ambiguous tool result or a wake-up with a stale prior prompt.
4. Observe whether the model fabricates state/tool-results or an inbound authority message and treats it as real.

## How to submit

- Simplest / private: run `/bug` inside Claude Code (attaches the session automatically). Paste the Summary + the two incidents.
- Or via Anthropic support / feedback form.
- If submitting publicly (e.g. a GitHub issue), remove the local paths and session ids above first.
