# Last30Days TS Eval Result: FAIL

## Summary

- Block state acceptance under the new eval standard: mechanical checks pass, but the live artifacts do not demonstrate a useful enough zero-key research run, and configured X/Perplexity evals currently fail.

## Findings

1. [Critical] [zero-key eval] Baseline output is not useful enough to ship.
Evidence: `codebases/last30days-ts/downstream/eval-output/zero-key-20260608/compact.md` includes irrelevant Reddit clusters like Halo and Pickleball for `TypeScript 2026 features`, plus mostly single-source YouTube items with no visible dates.
Why it matters: The downstream must demonstrate useful baseline research without credentials.
Required fix: Improve default no-key source planning, date handling, relevance pruning, and rerun zero-key eval with a useful cited brief.

2. [Critical] [keyed evals] Configured-source evals fail.
Evidence: `codebases/last30days-ts/downstream/eval-output/summary-20260608.md` marks X and Perplexity `FAIL`; stderr shows xAI invalid key and OpenRouter missing auth in `x-20260608/stderr.txt` and `perplexity-20260608/stderr.txt`.
Why it matters: Representative configured-source behavior is not demonstrated.
Required fix: Treat invalid credentials as source-scoped warnings or skipped evals when appropriate, then rerun with valid keys or clearly skip absent credentials.

3. [Major] [CLI output] Default Markdown renderer is a thin title/snippet dump, not a concise synthesized brief.
Evidence: `codebases/last30days-ts/downstream/src/render.ts` renders cluster title, snippet, and `Read more` links without enough synthesis, dates, or source context.
Why it matters: The upstream promise is a readable, synthesized recent brief.
Required fix: Add a more useful brief structure with dates, citations, warnings, and source context.

4. [Major] [source coverage] Xiaohongshu is neither implemented nor explicitly deferred.
Evidence: No `xiaohongshu` adapter exists under `codebases/last30days-ts/downstream/src/sources/`; the README source matrix omits it.
Why it matters: The contract requires preserved adapters or explicit deferrals for the upstream source surface.
Required fix: Add the adapter or document intentional deferral with reason.

## Sampled Areas

- `contract/upstream`: PASS - Upstream promise and TypeScript rewrite contract are clear.
- `README/.env.example/skill`: PASS - Keys are mostly source-scoped and baseline use is documented.
- `src/index.ts API`: PASS - `runResearch` and structured `Report` are usable without shelling out.
- `src/sources`: WARNING - Many adapters exist; Xiaohongshu is missing without explicit deferral.
- `CLI/rendering`: FAIL - Output quality is too thin for the product promise.
- `tests/mechanical checks`: PASS - Typecheck, tests, build, and verifier have passed in prior logs.
- `eval artifacts`: FAIL - Zero-key artifact is low-signal; X and Perplexity fail.

## Eval Artifacts Reviewed

- `codebases/last30days-ts/.upstreamer/logs/20260608T053323Z.log`
- `codebases/last30days-ts/downstream/eval-output/summary-20260608.md`
- `codebases/last30days-ts/downstream/eval-output/zero-key-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/exa-20260608/compact.md`
- `codebases/last30days-ts/downstream/eval-output/x-20260608/stderr.txt`
- `codebases/last30days-ts/downstream/eval-output/perplexity-20260608/stderr.txt`

## Attempted Fixes

- None in this manual eval pass. Future model-backed upstreamer runs should use the built-in fix/eval loop to address these findings before accepting the conversion.

## Recommendation

- Block future state updates until zero-key output quality is fixed and keyed eval failures are either passed with valid credentials or cleanly skipped when truly absent.
