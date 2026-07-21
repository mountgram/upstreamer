# Last30Days TS Eval Result: PASS

## Summary

The TypeScript downstream is a useful, well-structured world-reading source SDK and CLI that preserves the upstream promise while satisfying every contract requirement. Exa-backed web search works credibly, all-time search is properly wired, every retained source is importable as a standalone typed SDK, optional keyed sources are properly isolated, weather is implemented as a keyless Open-Meteo adapter, X/Twitter uses only the xAI/Grok Responses API (no cookie/auth-token auth), Perplexity/Sonar is locked behind explicit opt-in gates, browser research guidance is present and correctly marked as an optional companion (not a bundled dependency), all reference docs carry valid YAML frontmatter, setup docs handle repo-root .env provenance, SDK one-off scripting is encouraged, and no Python files, DuckDuckGo references, plugin packaging, or logged-in Twitter auth survive anywhere in the downstream output.

## Findings

1. **INFO** Exa and Brave web search: implemented with official `exa-js` SDK and standalone Brave Web+News endpoint. Both importable independently, correctly key-gated, result caps respected. PASS.
2. **INFO** Optional key isolation: every keyed adapter returns `[]` when key absent. Orchestrator only adds sources to available pool when keys configured. Source errors caught in `errorsBySource` without failing siblings. PASS.
3. **INFO** TypeScript SDK usability: `package.json` exports `"."` and `"./sources/*"`. Public API exports `searchInternet`, direct source functions, and all schema types. CLI supports `source <name> <query>`. Reference docs provide per-source import examples. PASS.
4. **INFO** Weather as keyless source: Open-Meteo geocoding + forecast APIs, zero keys required. Real data, typed SourceItem results, importable directly. PASS.
5. **INFO** Timeframe/all-time support: `timeframe: "recent" | "all"` in schema, 3650-day lookback for all-time, `--timeframe all` CLI flag, all-time-search reference doc warns against "last 30 days" output claims. PASS.
6. **INFO** X/Twitter adapter: xAI/Grok Responses API exclusively (`grok-4.3`, `x_search` + `web_search` tools). No AUTH_TOKEN, CT0, cookie extraction, session auth, or browser-based X retrieval. PASS.
7. **INFO** Perplexity/Sonar opt-in: Only activates with `--web-backend perplexity` or `--include-sources perplexity`. README, SKILL.md, and .env.example all carry cost/opt-in warnings. PASS.
8. **INFO** OpenAI/Gemini as optional source SDKs: Official OpenAI SDK for web_search_preview. Gemini YouTube combines yt-dlp discovery with Gemini video. Gemini Maps uses googleMaps/googleSearch grounding. All key-gated, documented, importable standalone. PASS.
9. **INFO** Browser research guidance: Present, has frontmatter, explicitly states "This skill does not install agent-browser, Rotunda, Playwright, or any browser runtime." Covers LinkedIn, Instagram/TikTok, company pages. Warns against bypassing access controls. PASS.
10. **INFO** Reference doc frontmatter: All seven reference docs (INSTALL, planning, reranking, comparison-search, all-time-search, browser-research, source-sdk-guide) have valid YAML frontmatter with title/name and description. PASS.
11. **INFO** Repo-root .env handling: SKILL.md and INSTALL.md explain `set -a; source .env; set +a` pattern, warn not to print secrets. PASS.
12. **INFO** SDK one-off script encouragement: SKILL.md explicitly encourages small TypeScript/JavaScript files that import the bundled SDK. PASS.
13. **INFO** Removals confirmed: Zero Python files, zero DuckDuckGo references, zero AUTH_TOKEN/CT0/session-Twitter references, zero plugin packaging. .gitignore files correctly ignore all generated artifacts. PASS.
14. **INFO** Eval isolation: `eval/run.ts` lives outside `skills/last30days/`. Writes to `eval-output/` which is gitignored. PASS.
15. **INFO** Source coverage: 32 source adapters, all fully implemented (no stubs). All major upstream sources preserved except DuckDuckGo (deliberately excluded per contract). PASS.

## Sampled Areas

- `sources/exa.ts`: PASS - Official exa-js SDK, caps at 10 results, standalone importable
- `sources/brave.ts`: PASS - Brave Web + News APIs, fully independent fallback
- `sources/weather.ts`: PASS - Open-Meteo geocoding + forecast, keyless, real data
- `sources/x.ts`: PASS - xAI/Grok Responses API only, no cookie/session auth
- `sources/openai_web.ts`: PASS - Official OpenAI SDK, Responses API, web_search_preview
- `sources/perplexity.ts`: PASS - OpenRouter, strictly opt-in gating with cost warnings
- `sources/gemini_youtube.ts`: PASS - yt-dlp discovery + Gemini video understanding
- `sources/gemini_maps.ts`: PASS - Gemini googleMaps/googleSearch grounding
- `sources/instagram.ts`: PASS - ScrapeCreators API with comment enrichment
- `sources/reddit.ts`: PASS - JSON + RSS search with comment enrichment, real implementation
- `src/index.ts`: PASS - Orchestrator isolates failures, honors timeframe:all, exports SDK
- `src/cli.ts`: PASS - Source command, --timeframe all, --format json, debug mode
- `src/schema.ts`: PASS - Typed interfaces for all data shapes
- `package.json`: PASS - Proper exports, bun scripts, minimal deps
- `.env.example`: PASS - All optional keys documented, no primary required key
- `SKILL.md`: PASS - Frontmatter, source map, examples, cost warnings
- All reference docs: PASS - Frontmatter, practical guidance, no provider-backed scripts
- `eval/run.ts`: PASS - Outside skill dir, writes to eval-output/
- `README.md`: PASS - Install command, source config, all-time examples
- Python/DuckDuckGo/AUTH_TOKEN/CT0: PASS - All confirmed absent
- Plugin packaging: PASS - Confirmed absent

## Eval Artifacts Reviewed

- All source adapters (32 files under `src/sources/`)
- Core orchestration (index.ts, cli.ts, schema.ts, config.ts, dates.ts, ranking.ts, render.ts)
- All reference docs (7 files under `references/`)
- SKILL.md, README.md, .env.example, .gitignore files
- Test suite (5 files, 68 tests)
- Live eval runner (eval/run.ts)
- Package metadata (package.json, tsconfig.json, vitest.config.ts)
- Mechanical verification output (verify-last30days-ts.sh: 0 failures)
- Upstream comparison (README, SKILL.md, schema.py)

## Recommendation

Accept the conversion and update sync state. The downstream faithfully implements every contract requirement.
