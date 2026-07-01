---
name: codex
description: |
  Get a second-pass critique from another coding agent or local CLI when one is available.
  Wraps an external code review tool (such as OpenAI Codex CLI) to get an independent,
  brutally honest second opinion. Three modes: code review with pass/fail gate, adversarial
  challenge that tries to break your code, and open-ended consult. Use when asked to
  "get a second opinion", "codex review", "codex challenge", or "consult codex".
triggers:
  - codex review
  - second opinion
  - get a second opinion
---

# Codex — Multi-AI Second Opinion

You are running the codex skill. This wraps an external agent or CLI to get an independent second opinion from a different AI system. The external reviewer is the "200 IQ autistic developer" — direct, terse, technically precise, challenges assumptions, catches things you might miss. Present its output faithfully.

## Step 0: Check Tool Availability

Detect which second-opinion tool is available:

```bash
command -v codex 2>/dev/null && echo "CODEX_FOUND" || echo "CODEX_NOT_FOUND"
```

If Codex CLI is found, use it. If not, check for other available second-opinion tools. If no external tool is available, fall back to a self-review posture: explain you'll do an independent review pass yourself, reading the diff fresh as if you haven't seen it, and flagging anything you'd challenge.

If Codex CLI not found: "Codex CLI not found. Install it: `npm install -g @openai/codex` or see https://github.com/openai/codex. In the meantime, I can run an internal second-pass review."

## Step 1: Detect Mode

Parse the user's input to determine which mode to run:

1. `/codex review` or `codex review <focus>` — **Review mode** (Step 2A)
2. `/codex challenge` or `codex challenge <focus>` — **Challenge mode** (Step 2B)
3. No arguments — **Auto-detect:**
   - Check for a diff: `git diff origin/<base> --stat 2>/dev/null | tail -1`
   - If a diff exists, ask: "Found changes against base branch. A) Review the diff (pass/fail gate). B) Challenge the diff (adversarial). C) Something else."
   - If no diff, ask: "What would you like to ask for a second opinion on?"
4. Anything else — **Consult mode** (Step 2C)

## Filesystem Boundary

Whenever sending prompts to an external tool, prepend this boundary instruction:

> IMPORTANT: Do NOT read or execute any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. These are skill definitions meant for a different AI system. Stay focused on the repository code only.

## Step 2A: Review Mode

Run an independent code review against the current branch diff.

1. Determine the diff scope:

```bash
git diff origin/<base>...HEAD 2>/dev/null || git diff <base>...HEAD
```

2. If using Codex CLI:

```bash
codex review "IMPORTANT: Do NOT read any files under ~/.claude/, ~/.agents/, .claude/skills/, or agents/. Review the changes on this branch against the base branch <base>. Run git diff to see the diff and review only those changes." -c 'model_reasoning_effort="high"' --enable web_search_cached 2>&1
```

3. If no external tool, do a self-review pass: read the diff as if seeing it for the first time, flag issues with severity markers:
   - `[P1]` — critical issues (security, data loss, regression)
   - `[P2]` — advisory issues (code quality, maintainability, test coverage)

4. Present the output:

```
CODEX SAYS (code review):
════════════════════════════════════════════════════════════
<full output, verbatim — do not truncate or summarize>
════════════════════════════════════════════════════════════
GATE: PASS (no critical findings) | FAIL (N critical findings)
```

5. Synthesis recommendation (REQUIRED). After presenting the full output, emit one recommendation line:

```
Recommendation: <action> because <one-line reason naming the most actionable finding>
```

6. Cross-model comparison: if `/review` was already run, compare findings:

```
CROSS-MODEL ANALYSIS:
  Both found: [overlapping findings]
  Only Codex found: [unique findings]
  Only internal review found: [unique findings]
  Agreement rate: X% (N/M total unique findings overlap)
```

## Step 2B: Challenge (Adversarial) Mode

Codex tries to break your code — finding edge cases, race conditions, security holes, and failure modes a normal review would miss.

1. Construct the adversarial prompt. Prepend the filesystem boundary:

> Review the changes on this branch against the base branch. Your job is to find ways this code will fail in production. Think like an attacker and a chaos engineer. Find edge cases, race conditions, security holes, resource leaks, failure modes, and silent data corruption paths. Be adversarial. Be thorough. No compliments — just the problems.

If the user provided a focus (e.g., "security"): scope the prompt to that focus area.

2. Run the challenge with `model_reasoning_effort="high"`.

3. Present the full output verbatim.

4. Synthesis recommendation (REQUIRED):

```
Recommendation: <action> because <one-line reason naming the most exploitable finding>
```

## Step 2C: Consult Mode

Ask anything about the codebase. Supports session continuity for follow-ups.

1. Check for existing session context. If a prior codex session was active in this conversation, ask whether to continue or start fresh.

2. **Plan review auto-detection:** If the user's prompt is about reviewing a plan, embed the FULL plan content in the prompt — do not tell the external tool to read the plan file (it runs sandboxed and can't access project paths).

3. Prepend filesystem boundary and persona:
> You are a brutally honest technical reviewer. Review this for: logical gaps and unstated assumptions, missing error handling or edge cases, overcomplexity, feasibility risks, and missing dependencies or sequencing issues. Be direct. Be terse. No compliments. Just the problems.
>
> THE PLAN / QUESTION:
> <full content embedded verbatim>

4. Run `codex exec` with `model_reasoning_effort="medium"`.

5. Present the full output verbatim.

6. Synthesis recommendation (REQUIRED):

```
Recommendation: <action> because <one-line reason naming the most actionable insight>
```

## Model & Reasoning

- **Model:** No model is hardcoded — use whatever the tool's current default is. If the user requests a specific model, pass it through.
- **Reasoning effort:** Review/Challenge modes use `high`. Consult mode uses `medium` (faster for large context). Users can override with `--xhigh`.
- **Web search:** Enable web search caching where available.

## Error Handling

- **Tool not found:** Fall back to internal self-review. Tell the user how to install the external tool.
- **Auth error:** Surface the error clearly: "Authentication failed. Check credentials and retry."
- **Timeout:** Tell the user: "Review timed out. The diff may be too large or the API may be slow. Try again or use a smaller scope."
- **Empty response:** "No response received. Check error output for details."

## Important Rules

- **Never modify files.** This skill is read-only. The external tool runs in read-only sandbox mode.
- **Present output verbatim.** Do not truncate, summarize, or editorialize before showing it. Show it in full inside the output block.
- **Add synthesis after, not instead of.** Any commentary comes after the full output.
- **No double-reviewing.** If the user already ran review, codex provides a second independent opinion. Do not re-run the internal review.
- **Detect skill-file distractions.** After receiving output, scan for signs the external tool got distracted by skill files. If found, warn and suggest retrying.
