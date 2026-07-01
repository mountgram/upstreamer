# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

- The downstream is a well-structured, self-contained installable skill with real source adapters, credible ranking, and structured output. Prior eval artifacts (June 8) prove the Exa, Brave, X/Grok, and JSON paths produce useful results. In the current environment, the web-search baseline cannot be re-demonstrated due to missing API keys, and the Perplexity adapter showed thin labeling in prior runs. Accept with follow-up on Perplexity diagnostics and re-verify the web-search baseline in a keyed environment.

## Findings

1. [Warning] Web-search baseline cannot be re-demonstrated in this environment.
Evidence: `eval-output/summary-20260625.md` shows FAIL for web-search and JSON due to missing EXA_API_KEY/BRAVE_API_KEY.
Why it matters: A fresh evaluator cannot independently confirm the Exa/Brave path works today.
Required fix: Non-blocking; the June 8 eval artifacts provide credible evidence the path worked at conversion time. Re-run with keys to confirm.

2. [Info] Web-search eval artifacts from prior run (June 8) show credible, recent, cited output.
Evidence: `eval-output/web-search-20260608/compact.md` — 5 real results, all dated May 2026, with URLs and containers.
Why it matters: Proves the Exa adapter is not a stub and produces inspectable, timely results when keys are present.

3. [Warning] Perplexity adapter produced no inspectable results in prior eval.
Evidence: `eval-output/summary-20260608.md` — "WARN: Perplexity source did not produce inspectable results."
Why it matters: The adapter may function but its output labeling/diagnostics couldn't be confirmed.
Required fix: Non-blocking follow-up to improve Perplexity source labeling or add better diagnostic output.

4. [Info] No Python files, plugin packaging, or Twitter cookie/session auth found.
Evidence: Grep for `.py`, `pyproject.toml`, `AUTH_TOKEN`, `CT0`, `OPENAI_API_KEY`, `GEMINI_API_KEY` returned zero hits in downstream code.
Why it matters: Key contract requirement satisfied.

5. [Info] X adapter uses only xAI/Grok API path.
Evidence: `src/sources/x.ts` — uses `OpenAI` client pointed at `https://api.x.ai/v1`, reads `config.xaiApiKey || config.grokApiKey`, returns `[]` gracefully when keys are absent.
Why it matters: Contract-required isolation of X search to the xAI API path.

## Sampled Areas

- `README.md`: PASS — explains self-contained skill install, source configuration with no global required key, web-search duality.
- `skills/last30days/SKILL.md`: PASS — agent-facing workflow with Bun setup, CLI examples, source matrix, JSON output, citation guidance.
- `src/index.ts`: PASS — source-scoped availability, isolated error handling per adapter, concurrent execution.
- `src/cli.ts`: PASS — full flag set (lookback, depth, format, debug, x-handle, github-user, hiring-signals, etc.), setup subcommand.
- `src/ranking.ts`: PASS — source quality weights, engagement weights per source, Jaccard deduplication, clustering, RRF, freshness scoring.
- `src/sources/x.ts`: PASS — xAI `responses.create` with `x_search` tool, `grok-4.3` model, `output_text` parsing, no cookie/session auth.
- `src/sources/exa.ts`: PASS — uses official `exa-js` SDK, proper depth limits, returns structured `SourceItem[]`.
- `src/sources/brave.ts`: PASS — 179-line adapter with web search API handling.
- `.env.example`: PASS — all keys documented with source-grouping, no global required key implied, `XAI_API_KEY`/`GROK_API_KEY` aliased.
- `eval/run.ts`: PASS — maintainer eval outside installed skill, isolates web-search env vars, skips optional keyed evals cleanly.
- `references/planning.md` and `references/reranking.md`: PASS — textual guidance only, no provider-backed scripts.
- Removed paths: PASS — no Python, no DuckDuckGo runtime, no cookie/Twitter auth, no plugin packaging.

## Eval Artifacts Reviewed

- `eval-output/summary-20260608.md` — 4 PASS, 1 WARN, 0 FAIL
- `eval-output/summary-20260625.md` — 0 PASS, 0 WARN, 2 FAIL, 3 SKIPPED (no keys in env)
- `eval-output/web-search-20260608/compact.md` — 5 real Exa results, dated May 2026, with URLs
- `eval-output/web-search-20260608/judgment.md` — PASS judgment
- `eval-output/json-20260608/output.json` — valid structured JSON with items, clusters, query plan
- `eval-output/x-20260608/compact.md` — 2 X posts with real URLs and dates
- `eval-output/brave-20260608/compact.md` — 5 Brave web results with real URLs

## Recommendation

- Accept with follow-up. Do not block state update. The web-search baseline is credibly implemented and was demonstrated in the prior conversion run. The two warnings (current-environment key unavailability, Perplexity labeling thinness) are isolated and do not indicate code defects. Re-verify the web-search baseline after restoring API keys.
