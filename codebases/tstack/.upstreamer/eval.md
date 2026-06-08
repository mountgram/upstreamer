# TStack Conversion Eval

Run this eval after mechanical verification passes. Use a fresh review context or subagent so the evaluator is not biased by the converter's own reasoning.

## Goal

Judge whether the generated TStack downstream preserves the useful agent workflows from upstream GStack while removing GStack-specific infrastructure.

This is not a formatting check and not a word-count check. It is an instruction-fidelity review.

## Inputs

- Contract: `codebases/tstack/upstreamer.md`
- Downstream: `codebases/tstack/downstream/`
- Upstream checkout: `tmp/upstreamer/tstack/upstream/`
- Prefer upstream `<skill>/SKILL.md.tmpl` when it exists.
- Use upstream `<skill>/SKILL.md` as a fallback and cross-check.

## Review Method

1. Read the contract first.
2. Inventory downstream skill directories.
3. For every new, changed, or suspiciously short downstream skill, compare it to the matching upstream `SKILL.md.tmpl` when present.
4. Ignore expanded GStack preamble, telemetry, routing, browser daemon setup, gbrain, checkpointing, and helper-script mechanics.
5. Preserve portable instructions: phases, evidence requirements, scorecards, output templates, safety/refusal rules, examples, verification loops, rubrics, and decision criteria.
6. Decide whether the downstream skill lets an agent perform the same useful workflow with ordinary agent tools and standard shell/git/gh commands.

## Failure Conditions

Return `FAIL` if any of these are true:

- A rich upstream workflow was collapsed into a generic checklist that no longer teaches the workflow.
- A downstream skill drops the upstream workflow's major phases, scorecards, output templates, or evidence rules without a contract-backed reason.
- A downstream skill changes the core task. For example, a scraper becomes a trend-summary prompt, or an audit skill becomes only a list of topics.
- A downstream skill keeps GStack infrastructure references that should have been removed.
- The README or changelog claims a skill exists but the skill is too thin to be useful.

Return `PASS WITH WARNINGS` when the downstream is usable but a skill could preserve more examples, calibration detail, or output structure.

Return `PASS` only when rich skills remain operational and concise skills are concise because the upstream-specific mechanics were correctly removed.

## High-Risk Skills

Review these closely because prior conversions over-compressed them:

- `devex-review`: must preserve target discovery, TTHW, TESTED/PARTIAL/INFERRED evidence labels, 0-10 scoring, scorecard, the core DX dimensions, plan-vs-reality comparison, findings format, and next steps.
- `qa` and `qa-only`: must preserve the test/fix/verify loop or report-only boundary, scope capture, evidence, reproduction steps, regression thinking, and health/report output.
- `ios-design-review` and `ios-fix`: must preserve scoring/review rubrics, evidence capture, root-cause rules, verification loops, and failure handling while dropping GStack device-daemon specifics.
- `design-consultation`, `design-html`, and `design-shotgun`: must preserve context gathering, anti-slop rules, design-system rationale, variant/preview/refinement loops, and handoff outputs while dropping custom design binary paths.
- `document-generate`: must preserve research-before-writing, codebase archaeology, concept maps, Diataxis structure, cross-linking, and accuracy/completeness gates.
- `hackernews-frontpage`: must preserve the upstream task of retrieving structured top-story data rather than turning into a generic summary skill.
- `scrape`: must preserve read-only boundaries, JSON output discipline, failure handling, and no-partial-result rules.
- `spec`: must preserve phase gates, code evidence before questions, verified current state, acceptance criteria, testing plan, rollback, and out-of-scope sections.
- `canary`: must preserve baseline, page discovery, monitoring cadence, alert rules, console/perf/screenshot evidence, transient tolerance, and rollback guidance.
- `codex`: must preserve the operational wrapper modes, prompt boundaries, read-only safety, timeout/error handling, gate semantics, and recommendation output.

## Output Format

Return:

```markdown
# TStack Eval Result: PASS | PASS WITH WARNINGS | FAIL

## Summary

- [At-a-glance judgment for a busy engineer]

## Findings

1. [Severity] [skill] [problem]
Evidence: upstream path and downstream path.
Why it matters: [workflow behavior lost or preserved]
Required fix: [specific downstream/contract change]

## Sampled Skills

- `skill-name`: PASS | WARNING | FAIL - [one-line reason]

## Recommendation

- Accept the conversion, accept with follow-up, or block state update.
```
