# Last30Days TS Conversion Eval

Run this eval after mechanical verification passes. Use a fresh review context or subagent so the evaluator is not biased by the converter's own reasoning.

## Goal

Judge whether the generated Last30Days TS downstream is a useful TypeScript CLI/library that preserves the upstream promise: recent public-signal research across multiple optional sources, source-aware ranking, citations, and concise briefs without all-or-nothing setup.

This is not a shell-script check. It is a product and behavior eval for a busy engineer deciding whether the conversion is good enough to ship.

## Inputs

- Contract: `codebases/last30days-ts/upstreamer.md`
- Downstream: `codebases/last30days-ts/downstream/`
- Upstream checkout: `tmp/upstreamer/last30days-ts/upstream/`
- Upstream README: `tmp/upstreamer/last30days-ts/upstream/README.md`
- Upstream skill: `tmp/upstreamer/last30days-ts/upstream/skills/last30days/SKILL.md`
- Downstream eval artifacts: `codebases/last30days-ts/downstream/eval-output/` when present

## Review Method

1. Read the contract first, then the upstream README and upstream skill.
2. Inspect the downstream README, `skills/last30days/SKILL.md`, source adapters, CLI/library API, tests, and eval outputs.
3. Prefer actual commands and generated artifacts when available: `npm test`, `npm run typecheck`, `npm run build`, `npm run eval`, and files under `eval-output/`.
4. If commands were already run in the conversion log, inspect their artifacts instead of rerunning expensive live evals unless the artifacts are missing or stale.
5. Judge whether the downstream would help a user research a current topic without hidden credentials or Python/plugin setup.

## Required Qualities

The downstream should satisfy these product-level requirements:

- Baseline zero-key use works or is credibly demonstrated through eval artifacts.
- Optional keyed sources are source-scoped. Missing keys skip only their adapters and do not break the whole run.
- Source coverage reflects the upstream surface where practical, with explicit deferrals where a source cannot be reasonably ported.
- The TypeScript library API is usable without shelling out and exposes structured results.
- The CLI output is concise, cited, recent, and readable.
- JSON output is available for programmatic use.
- Ranking combines freshness, relevance, engagement, source quality, and deduplication enough to avoid low-signal dumps.
- The README and installable skill explain how to run the tool, configure optional sources, interpret warnings, and enable stronger evals with `.env.example`.
- Python runtime, plugin packaging, logged-in Twitter/session-cookie auth, and provider upsell flows stay removed.
- Live eval outputs are inspected for actual usefulness, not treated as passing just because a command exited successfully.

## Failure Conditions

Return `FAIL` if any of these are true:

- The downstream compiles but cannot demonstrate a useful zero-key research run.
- A missing optional key or local tool can fail the whole pipeline instead of skipping its adapter.
- The README or skill implies a global required API key.
- Source adapters are stubs that return placeholders rather than real or testable source items.
- Citations, dates, or source metadata are missing enough that output cannot be trusted.
- Eval artifacts show generic, stale, uncited, duplicate-heavy, or fabricated-looking results.
- The TypeScript API requires shelling out to use core behavior.
- Python files, Python packaging, plugin packaging, or removed Twitter cookie/session auth reappear.
- The downstream claims support for a source but the implementation is absent and no explicit deferral explains why.

Return `PASS WITH WARNINGS` when the downstream is useful but some optional source coverage, live-provider eval, or output quality is limited by missing credentials or external service behavior.

Return `PASS` only when the zero-key path and representative configured-source behavior are useful, documented, and consistent with the contract.

## High-Risk Areas

Review these closely:

- `src/index.ts` and `src/cli.ts`: orchestration, source availability, failure isolation, JSON/Markdown output, and library API shape.
- `src/sources/`: adapters should be independently optional and should not contain placeholder-only behavior for claimed support.
- `src/sources/x.ts`: X/Twitter support must use xAI/Grok-style API keys only and must not mention or depend on logged-in Twitter cookies, `AUTH_TOKEN`, or `CT0`.
- `src/sources/reddit.ts`, `github.ts`, `digg.ts`, `youtube.ts`, and web-search adapters: these should preserve meaningful upstream source behavior where practical.
- `skills/last30days/SKILL.md`: should teach another agent when to use the tool, setup checks, command examples, source warnings, eval commands, and how to cite output.
- `README.md` and `.env.example`: should make baseline usage obvious and keep every key optional and source-scoped.
- `eval/run.ts` and `eval-output/`: should prove the tool produces recent, cited, source-diverse, non-placeholder output.

## Output Format

Return:

```markdown
# Last30Days TS Eval Result: PASS | PASS WITH WARNINGS | FAIL

## Summary

- [At-a-glance judgment for a busy engineer]

## Findings

1. [Severity] [area] [problem]
Evidence: [downstream path, upstream path, command output, or eval artifact]
Why it matters: [user-visible behavior or contract risk]
Required fix: [specific downstream/contract change]

## Sampled Areas

- `area`: PASS | WARNING | FAIL - [one-line reason]

## Eval Artifacts Reviewed

- [artifact or command reviewed]

## Recommendation

- Accept the conversion, accept with follow-up, or block state update.
```
