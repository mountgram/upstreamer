# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

- Accept with follow-up. The downstream is now a self-contained installable skill: `skills/last30days/` includes the agent workflow, install reference, Bun package metadata, TypeScript source, tests, `.env.example`, planning guidance, reranking guidance, and license. Maintainer live evals live outside the installed skill at `downstream/eval/`. Exa, Brave, X/Grok, and JSON evals pass. The remaining warning is isolated to optional Perplexity source labeling/diagnostics.

## Findings

1. [Warning] Optional Perplexity eval status is thin.
Evidence: `codebases/last30days-ts/downstream/eval-output/perplexity-20260608/judgment.md`.
Why it matters: Optional provider coverage is less clearly proven than Exa, Brave, and X/Grok.
Required fix: Non-blocking follow-up; improve Perplexity source labeling or judgment if desired.

## Sampled Areas

- `README.md`: PASS - explains the installable self-contained skill and source setup.
- `skills/last30days/SKILL.md`: PASS - practical agent-facing Bun setup, CLI usage, JSON output, eval, and citation guidance.
- `skills/last30days/scripts/last30days/package.json`: PASS - build, typecheck, test, setup, and `last30days` scripts are present.
- `skills/last30days/scripts/last30days/src/`: PASS - source-scoped adapters, isolated failures, structured library API, Exa/Brave/X implementations.
- `skills/last30days/scripts/last30days/test/`: PASS - deterministic config, dates, ranking, and adapter-shape coverage.
- `downstream/eval/`: PASS WITH WARNINGS - maintainer evals live outside the installed skill; Exa, Brave, X, and JSON passed; Perplexity warning is isolated.
- `skills/last30days/scripts/last30days/.env.example`: PASS - optional keys documented without global required API key.
- `skills/last30days/references/planning.md` and `skills/last30days/references/reranking.md`: PASS - textual guidance, no provider-backed scripts.
- Removed paths: PASS - no Python runtime, plugin packaging, DuckDuckGo runtime, or removed Twitter cookie/session auth under the installed skill.

## Eval Artifacts Reviewed

- `codebases/last30days-ts/downstream/eval-output/summary-20260608.md`
- `codebases/last30days-ts/downstream/eval-output/web-search-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/x-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/brave-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/json-20260608/output.json`

## Attempted Fixes

- Moved the runnable Bun/TypeScript project into `skills/last30days/scripts/last30days/` so installing the skill brings source, tests, package metadata, env docs, and support references.
- Kept maintainer live evals outside the installed skill at `downstream/eval/`.
- Replaced global/npm CLI instructions with `bun install`, `bun run setup`, and `bun run last30days -- ...` from the bundled script directory.
- Updated verifier and eval standards for the self-contained skill-bundle shape.
- Removed stale root package/source layout assumptions from downstream docs and contract.

## Recommendation

- Accept with follow-up; do not block on isolated optional Perplexity warnings.
