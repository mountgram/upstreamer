# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

- The conversion is a real, importable TypeScript source SDK + CLI with an Exa/Brave web-search baseline, xAI/Grok-only X access, keyless weather, all-time search, and four genuinely implemented new adapters (Meta Ads, Telegram, Amazon, DripStack). Typecheck, 73/73 tests, and the mechanical verifier all pass; the only limitation is that live provider runs cannot be demonstrated because no API keys exist in this environment.

## Findings

1. **PASS** [web-search] Exa and Brave baseline web search are real, key-gated implementations.
   Evidence: `src/sources/exa.ts` uses the official `exa-js` SDK and `DEPTH_LIMITS = { quick: 5, medium: 10, deep: 10 }` caps every request at ≤10 results including deep mode. `src/sources/brave.ts` uses `fetch` against the Brave web + news endpoints with `X-Subscription-Token`. Missing keys return `[]` and the source is not added to `availableSources`.
   Why it matters: Satisfies the "preferred Exa / Brave fallback, ≤10 results" contract and keyless degradation.
   Required fix: none.

2. **PASS** [X/Twitter] X access is xAI/Grok-only with the modern Responses API tools and no cookie/session auth.
   Evidence: `src/sources/x.ts` calls `client.responses.create({ model: "grok-4.3", tools: [{ type: "x_search" }, { type: "web_search" }] })` against `https://api.x.ai/v1`, parses strict JSON from `output_text`, and uses `usage.server_side_tool_usage_details.x_search_calls` only for diagnostics. Grep for `AUTH_TOKEN|CT0|logged-in Twitter|cookie-based Twitter|session-token X|Twitter cookies` returns zero matches.
   Why it matters: Meets the contract's ban on logged-in Twitter auth; `search_parameters` and top-level `tool_results` are absent (verifier confirms).
   Required fix: none.

3. **PASS** [source-isolation] Missing optional keys or local tools skip only their own adapter and never fail the run.
   Evidence: `src/index.ts` gates every keyed and binary source on its config flag or a `spawnSync("which", ...)` availability check; per-source errors are recorded in `errors_by_source`/`source_status` without aborting siblings.
   Why it matters: Confirms the "missing optional key skips only its adapter" failure condition is not tripped.
   Required fix: none.

4. **PASS** [all-time] `--timeframe all` / `timeframe: "all"` is honored and output is not hard-coded to "last 30 days".
   Evidence: `runResearch` sets `lookbackDays = isAllTime ? (lookbackDays || 3650) : 30`; `eval/run.ts` includes a dedicated all-time eval asserting a span > 365 days.
   Why it matters: Satisfies the all-time search contract.
   Required fix: none.

5. **PASS** [new-adapters] Meta Ads, Telegram, Amazon, and DripStack are real implementations, not placeholders, and skip correctly.
   Evidence: `meta_ads.ts` resolves an advertiser via ScrapeCreators ad-library search and paginates `company/ads` with a date window; `telegram.ts` reads posts per configured `TELEGRAM_SOURCES` channel and rejects private `joinchat` links; `amazon.ts` shells out to `brightdata` CLI pipelines and returns `[]` when the binary is absent; `dripstack.ts` queries the keyless `dripstack.xyz` search endpoint gated on finance-hint topics. All return `[]`/skip when their key or binary is missing.
   Why it matters: These are the sync-5 additions; none are stubs and none fail the pipeline when unavailable.
   Required fix: none.

6. **PASS** [provider-strategy] Perplexity/Sonar is opt-in only; OpenAI and Gemini are separate optional source SDKs.
   Evidence: `perplexity` is only added when `openrouterApiKey && (webBackend === "perplexity" || wantsSource("perplexity"))`; `.env.example` and README/SKILL document `--web-backend perplexity` / `--include-sources perplexity` as explicit opt-in. OpenAI (`gpt-4.1-mini` + `web_search_preview`) and Gemini (`gemini-2.5-flash`) are optional source SDKs.
   Why it matters: Avoids the "Perplexity default / preferred grounded path" failure condition.
   Required fix: none.

7. **PASS** [frontmatter] SKILL.md and all 7 references have valid title/name + description frontmatter; browser-research guidance is present.
   Evidence: verifier reports PASS for frontmatter on SKILL.md, INSTALL.md, all-time-search.md, browser-research.md, comparison-search.md, planning.md, reranking.md, and source-sdk-guide.md. `browser-research.md` states browser tools are optional companions, not bundled dependencies.
   Why it matters: Satisfies the frontmatter and browser-research requirements.
   Required fix: none.

8. **WARNING** [live-eval/credentials] Exa/Brave, all-time, and keyed evals cannot be demonstrated live because the environment has no API keys.
   Evidence: `eval/run.ts` marks the web-search, JSON, and all-time baseline evals as SKIPPED when `EXA_API_KEY`/`BRAVE_API_KEY` are absent, and keyed evals report SKIPPED with explicit reasons. No live network calls are possible here.
   Why it matters: The required Exa/Brave baseline is implemented but not live-demonstrated; per eval.md this is the credential-constrained case, so it maps to PASS WITH WARNINGS rather than FAIL.
   Required fix: none for the code; when credentials are available, run `bunx tsx ../../../../eval/run.ts` and inspect `eval-output/`.

## Sampled Areas

- `src/index.ts`: PASS - multi-source runner with per-source isolation, `searchInternet()` export, all-time handling.
- `src/sources/exa.ts` / `brave.ts`: PASS - SDK/fetch implementations, Exa capped ≤10, Brave fallback.
- `src/sources/x.ts`: PASS - grok-4.3 + `x_search`/`web_search`, JSON from `output_text`, no cookie/session auth.
- `src/sources/weather.ts`: PASS - keyless Open-Meteo geocoding + forecast.
- `src/sources/openai_web.ts` / `gemini_youtube.ts` / `gemini_maps.ts` / `perplexity.ts`: PASS - optional SDKs, Perplexity opt-in and cost-documented.
- `src/sources/meta_ads.ts` / `telegram.ts` / `amazon.ts` / `dripstack.ts`: PASS - real implementations with correct skip behavior.
- `SKILL.md` + 7 references + frontmatter: PASS - valid YAML, source-purpose map, browser-research, install/setup, all-time/reranking/comparison/source-SDK guidance.
- `eval/run.ts` skip logic: PASS - baseline and optional keyed evals both skip cleanly on missing credentials.

## Eval Artifacts Reviewed

- `bun run typecheck` → `tsc --noEmit` exit 0.
- `bun run test` → vitest, 5 files / 73 tests passed, exit 0.
- `bun run build` → `tsc` exit 0.
- `bash .upstreamer/scripts/verify-last30days-ts.sh <downstream>` → "Verification: PASSED (0 failures)".
- `bash scripts/verify-public-skills` → "Last30Days exposes all 1 skills" and "TStack exposes all 37 skills".
- `grep -RInE 'AUTH_TOKEN|CT0|...'` across downstream (excl. node_modules) → no matches.

## Recommendation

- Accept the conversion. When credentials are available, run the live eval suite to confirm Exa/Brave and all-time output quality end-to-end; the code needs no changes.
