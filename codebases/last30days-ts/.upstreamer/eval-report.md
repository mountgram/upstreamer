# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

- Accept with follow-up. Exa and Brave web-search baselines produce recent, cited, non-placeholder results; JSON/API shape is usable; the X/Grok adapter now produces X items. The remaining warning is isolated to optional Perplexity source labeling/diagnostics.

## Findings

1. [Warning] Optional Perplexity eval is not cleanly inspectable as Perplexity.
Evidence: `codebases/last30days-ts/downstream/eval-output/summary-20260608.md`; `codebases/last30days-ts/downstream/eval-output/perplexity-20260608/judgment.md`.
Why it matters: Optional keyed-source status should be clear to users.
Required fix: Keep as warning per eval policy, or improve source labeling/diagnostics so Perplexity results are explicitly identifiable.

## Sampled Areas

- `Exa web search`: PASS - `eval-output/web-search-20260608/compact.md` has recent cited web items.
- `Brave fallback`: PASS - `eval-output/brave-20260608/compact.md` has recent cited Brave-backed web results.
- `X/Grok adapter`: PASS - `src/sources/x.ts` uses xAI `responses.create`, `grok-4.3`, `x_search`, and parses `output_text`; live eval produced X items.
- `JSON/API`: PASS - `eval-output/json-20260608/output.json` has structured clusters, candidates, source metadata, and no warnings.
- `Optional-source isolation`: PASS - Perplexity warning did not break Exa, Brave, or X runs.
- `Docs/config/skill`: PASS - README, `.env.example`, and skill document source-scoped keys.
- `Removed paths`: PASS - DuckDuckGo, Python runtime files, and removed X cookie/session auth were not present in tracked source/docs/tests.

## Eval Artifacts Reviewed

- `codebases/last30days-ts/downstream/eval-output/summary-20260608.md`
- `codebases/last30days-ts/downstream/eval-output/web-search-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/x-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/brave-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/json-20260608/output.json`

## Attempted Fixes

- Removed DuckDuckGo runtime, dependency, docs, tests, and verifier requirements.
- Made Exa the preferred reliable web-search path.
- Added Brave as an alternative/fallback web-search path in planning and evals.
- Updated live evals to record a Brave result when `BRAVE_API_KEY` is present.
- Fixed the X/Grok adapter by parsing strict JSON posts from xAI `output_text` instead of nonexistent top-level `tool_results`.
- Added X parser regression coverage for Responses API output shape and date normalization.
- Updated docs, skill guidance, contract, verifier, and changelog.

## Recommendation

- Accept with follow-up; do not block state update on isolated optional Perplexity warnings.
