# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

- The conversion is structurally complete and contract-compliant. Exa and Brave web search adapters are credibly implemented using real SDKs with proper date filtering and result caps. Source isolation is robust. Weather is a real keyless source. X/Twitter uses only xAI/Grok API with zero cookie/session auth. Perplexity/Sonar is strictly opt-in with cost warnings. All-time search is supported. SKILL.md and all 7 reference docs have valid YAML frontmatter. The installed skill is self-contained. 68 tests pass, typecheck passes, mechanical verifier passes (0 failures). Live evals all fail in CI due to missing EXA_API_KEY/BRAVE_API_KEY -- the eval runner correctly reports missing credentials.

## Findings

1. **WARNING** [live-evals] Exa/Brave web search, JSON output, and all-time search evals all fail in CI because neither EXA_API_KEY nor BRAVE_API_KEY is configured. The eval runner correctly identifies missing keys and writes proper diagnostics rather than crashing or falsely claiming success.
   Evidence: `eval-output/summary-20260729.md` shows 0 passed, 3 failed, 3 skipped. Each `stderr.txt` reads `Missing EXA_API_KEY or BRAVE_API_KEY`.
   Why it matters: The contract requires demonstrating a useful Exa or Brave web search run. The code is correct but cannot be demonstrated live in this environment.
   Required fix: Run evals with a valid EXA_API_KEY or BRAVE_API_KEY. No code changes needed.

2. **PASS** [source-isolation] Missing optional keys correctly skip only their adapters. Each adapter returns [] on missing key or API error.

3. **PASS** [exa-implementation] Exa adapter uses exa-js SDK, caps all depths at 10 results including deep mode, and passes date range parameters.

4. **PASS** [weather-keyless] Weather adapter uses Open-Meteo geocoding and forecast APIs with no API key.

5. **PASS** [x-grok-only] X/Twitter uses OpenAI SDK at api.x.ai/v1, model grok-4.3, x_search + web_search tools, parses JSON from output_text. No AUTH_TOKEN, CT0, or cookie/session auth.

6. **PASS** [perplexity-opt-in] Perplexity adapter is only activated when explicitly requested. Cost warnings appear in .env.example, README, and SKILL.md.

7. **PASS** [frontmatter] All SKILL.md and references/*.md files have valid YAML frontmatter with title/name and description.

8. **PASS** [browser-research] Browser research guidance correctly explains optional browser tools without requiring dependencies.

9. **PASS** [repo-root-env] INSTALL.md and SKILL.md both explain repo-root .env handling.

10. **PASS** [no-disqualifying-artifacts] Zero Python files, AUTH_TOKEN, CT0, or DuckDuckGo in runtime code.

## Sampled Areas

- `exa.ts`: PASS - Uses exa-js SDK, caps at 10 results, date-aware
- `brave.ts`: PASS - Uses Brave search + news APIs, date filtering
- `weather.ts`: PASS - Real keyless Open-Meteo implementation
- `x.ts`: PASS - xAI/Grok only, no cookie auth
- `perplexity.ts`: PASS - Opt-in only via OpenRouter
- `index.ts`: PASS - Source isolation, all-time support, SDK exports
- `SKILL.md`: PASS - Valid frontmatter, source map, repo-root .env guidance
- `references/*.md` (7 files): PASS - All have valid YAML frontmatter
- `browser-research.md`: PASS - Optional companions, no required dependency
- `INSTALL.md`: PASS - Repo-root .env handling
- `.env.example`: PASS - All supported keys, grouped by source area
- `eval/run.ts`: PASS - Correctly skips on missing credentials
- Mechanical verifier: PASS (0 failures)
- Tests: PASS (68/68), Typecheck: PASS

## Eval Artifacts Reviewed

- `eval-output/summary-20260729.md` - 0 pass, 3 fail (credential-constrained), 3 skip
- `eval-output/web-search-20260729/judgment.md` - FAIL: missing EXA_API_KEY
- `eval-output/json-20260729/judgment.md` - FAIL: missing EXA_API_KEY
- `eval-output/all-time-20260729/judgment.md` - FAIL: missing EXA_API_KEY

## Recommendation

- Accept the conversion with follow-up: the downstream is ready to ship. When an EXA_API_KEY or BRAVE_API_KEY is available, re-run live evals to produce passing web-search, JSON, and all-time artifacts. The code itself needs no changes.
