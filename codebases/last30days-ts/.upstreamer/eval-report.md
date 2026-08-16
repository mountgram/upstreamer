# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

- The conversion is a genuine, self-contained TypeScript world-reading source SDK and CLI that preserves the upstream promise (public-signal research across many optional sources) and correctly reorients it around source access first. Typecheck passes clean, all 77 deterministic tests pass, mechanical verifier passes with 0 failures, and live keyless runs produce real cited output (weather via Open-Meteo, Hacker News via Algolia) including a verified 3650-day all-time window. The only thing not demonstrable in this CI environment is a live Exa/Brave web-search baseline, because no `EXA_API_KEY` or `BRAVE_API_KEY` is configured — the eval runner honestly reports the missing keys and skips keyed evals rather than faking a pass.

## Findings

1. **WARNING** [live eval] The Exa-backed or Brave-backed web-search baseline could not be demonstrated live in this environment.
   Evidence: `downstream/eval-output/summary-20260816.md` shows web-search/json/all-time `FAIL` with "EXA_API_KEY or BRAVE_API_KEY is required"; keyed evals (x, perplexity, brave) are correctly `SKIPPED`.
   Why it matters: The eval standard's top Required Quality (Exa/Brave web search "credibly demonstrated") cannot be satisfied without credentials, but the failure is isolated, honestly reported, and the adapter code is present and correct (`src/sources/exa.ts` uses the `exa-js` SDK with `numResults` capped at 10; `src/sources/brave.ts` uses the Search API with a date window).
   Required fix: None for the code. Run `bunx tsx ../../../../eval/run.ts` with `EXA_API_KEY` (or `BRAVE_API_KEY`) set to produce a real baseline artifact and flip this to PASS.

2. **PASS** [source isolation] Missing optional keys skip only their adapter and never break the run. `src/index.ts` gates each keyed source behind its env var; per-source errors are caught and recorded in `errors_by_source`/`source_status`.

3. **PASS** [xai/X contract] The X adapter uses only the xAI/Grok API (`grok-4.3` with `x_search` + `web_search` tools, strict-JSON parsing from `output_text`). `AUTH_TOKEN`, `CT0`, logged-in/browser/cookie Twitter auth are absent from all downstream code, docs, env examples, tests, and reports.

4. **PASS** [provider strategy] OpenAI web grounding (`web_search_preview`, gpt-4.1-mini) is the preferred LLM-grounded web path; Gemini YouTube/Maps grounding are optional source SDKs; Perplexity/Sonar is expensive opt-in only via `--web-backend perplexity`/`--include-sources perplexity`.

5. **PASS** [all-time search] `--timeframe all` produces a ~3650-day span (`range_from: 2016-08-18`), verified live via JSON output. Markdown output never hard-codes "last 30 days".

6. **PASS** [SDK shape] `package.json` exports `.` and `./sources/*`; `src/index.ts` exports `searchInternet`/`runResearch` plus per-source search functions; direct `source <name> <query>` CLI path and `references/source-sdk-guide.md` document source access as first-class.

7. **PASS** [frontmatter + references] `SKILL.md` and all 7 `references/*.md` files have valid YAML frontmatter with `title`/`name` and `description`; install, planning, reranking, comparison, all-time, browser-research, and source-SDK guidance are all present.

8. **PASS** [no-key baseline] No-key sources (Reddit, Hacker News, GitHub, Polymarket, Weather, Health) return real cited output, not placeholders.

9. **PASS** [Amazon/Bright Data deferral] Amazon buyer-signal is intentionally deferred (paid, login-gated `brightdata` CLI outside the contract surface) and documented in the README rather than stubbed.

10. **PASS** [robustness follow-up] After the initial review flagged bare `fetch` calls without timeouts, every raw-HTTP adapter now applies an `AbortSignal.timeout` (15–60s by source), so a hung upstream connection degrades to a caught error/empty result instead of stalling the `Promise.all` orchestration.

## Sampled Areas

- `package.json`: PASS - exports map, scripts, maintained deps (`exa-js`, `openai`, `zod`).
- `src/index.ts`: PASS - `searchInternet`/`runResearch`, per-source exports, failure isolation, all-time handling.
- `src/cli.ts`: PASS - `--timeframe all`, `--format json`, `source <name>`, `--hiring-signals`, `--web-backend`.
- `src/sources/weather.ts`: PASS - real keyless Open-Meteo current conditions + forecast.
- `src/sources/x.ts`: PASS - xAI `responses.create` with `x_search`/`web_search`, no cookie/session auth.
- `src/sources/exa.ts` / `brave.ts`: PASS - real SDK/API, Exa capped ≤10, date window applied.
- `src/sources/github.ts`: PASS - qualifier stripping + authenticated `is:issue`/`is:pull-request` partition.
- `src/ranking.ts`: PASS - out-of-window candidates demoted in final scoring.
- `skills/last30days/SKILL.md` + `references/*.md` (7 files): PASS - valid frontmatter, source map, install/repo-root `.env` guidance.
- `README.md` + `.env.example` + `references/INSTALL.md`: PASS - no global required key, repo-root `.env` handling, one-off SDK scripts encouraged.
- `eval/run.ts` + root `eval-output/`: PASS (with WARNING) - runs outside the skill, skips keyed evals cleanly, honestly reports missing credentials.

## Eval Artifacts Reviewed

- `bun run typecheck` → exit 0.
- `bun run test` → 6 files passed, 77 tests passed.
- `bun run last30days -- "weather in Lisbon tomorrow" --format json --depth quick --include-sources weather` → real Open-Meteo current conditions.
- `bun run last30days -- "TypeScript" --format markdown --depth quick --include-sources hackernews` → real cited HN results + footer.
- `bun run last30days -- "Einstein relativity" --timeframe all --format json --include-sources weather` → `range_from: 2016-08-18`.
- `downstream/eval-output/{summary,web-search,json,all-time}-20260816/` → honest missing-credential failures and keyed-eval SKIPPEDs.
- Mechanical verifier `verify-last30days-ts.sh` → PASSED (0 failures); `scripts/verify-public-skills` → PASS.

## Recommendation

- Accept the conversion with follow-up. Mechanical verification and deterministic tests pass, and the qualitative eval passes with warnings. Update sync state. The single follow-up is to run the live Exa/Brave baseline eval in an environment with `EXA_API_KEY` (or `BRAVE_API_KEY`) set to produce the missing web-search artifact; no code changes are required for that.
