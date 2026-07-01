# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

The downstream compiles cleanly, all 50 deterministic tests pass, the source subcommand returns real cited HN results, `--timeframe all` is wired through the stack (CLI -> library -> 3650-day lookback), package exports are proper, all references have frontmatter, no Python files remain, `searchInternet` is exported, and browser-research guidance is present for optional browser tools on dynamic sources such as LinkedIn. OpenAI web grounding, Gemini YouTube, and Gemini Maps are importable optional source SDKs, while Perplexity/Sonar is now documented and wired as expensive opt-in. With the repo-root `.env` loaded, keyed live evals passed for Exa/Brave web search and X/Grok. The only remaining warning is Perplexity/OpenRouter returning no inspectable results.

## Findings

1. **WARNING** [Live eval] Perplexity/OpenRouter did not produce inspectable results
   Evidence: `eval-output/summary-20260701.md` reports `perplexity | latest AI research | WARN | WARN: Perplexity source did not produce inspectable results`.
   Why it matters: Perplexity is an optional keyed source. The failure is isolated and does not block Exa/Brave/X or public-source behavior.
   Required fix: Inspect OpenRouter/Perplexity provider behavior separately if Perplexity coverage is important for a release.

2. **INFO** [Live eval] Keyed Exa/Brave/X paths passed after loading repo `.env`
   Evidence: `eval-output/summary-20260701.md` reports PASS for web-search, JSON output, X/Grok, and Brave.
   Why it matters: This confirms the baseline web-search path and xAI `x_search` path work when credentials are available.
   Required fix: None.

## Sampled Areas

- `TypeScript compilation`: PASS - `tsc --noEmit` exits cleanly with zero errors
- `Deterministic tests`: PASS - 50/50 tests pass across 4 test files
- `CLI public-source smoke test`: PASS - Produces real, cited, dated HN results (e.g., "Claude Code is steganographically marking requests", 2026-06-30)
- `--timeframe all implementation`: PASS - CLI accepts `--timeframe all`, library sets 3650-day lookback
- `searchInternet SDK export`: PASS - Exported as alias to `runResearch`
- `package.json exports map`: PASS - `.` and `./sources/*` entrypoints configured
- `source CLI subcommand`: PASS - `source hackernews "query"` returns cited results
- `SKILL.md and reference frontmatter`: PASS - All 8 skill/reference files have YAML frontmatter with title/name and description
- `Browser research guidance`: PASS - `references/browser-research.md` explains when to use optional host browser tools without bundling browser dependencies
- `OpenAI/Gemini provider strategy`: PASS - `openai_web`, `gemini_youtube`, and `gemini_maps` source SDKs are importable and documented
- `Perplexity/Sonar cost control`: PASS - Perplexity requires explicit `--web-backend perplexity` or `--include-sources perplexity`
- `Repo-root .env guidance`: PASS - setup docs explain sourcing host `.env` before running commands from the skill directory
- `Custom SDK scripts`: PASS - docs encourage one-off TypeScript/JavaScript scripts for custom parsing and output shaping
- `No Python/AUTH_TOKEN/CT0`: PASS - Zero Python files, zero Twitter cookie/session auth
- `X adapter x_search/web_search tools`: PASS - Uses `grok-4.3`, `x_search` tool, parses from `output_text`
- `Keyed live evals`: PASS WITH WARNINGS - Exa/Brave/X passed; Perplexity warned with no inspectable results
- `Reddit keyless public access`: PASS - Public JSON, RSS fallback, comment enrichment
- `28 source adapters/utilities`: PASS - All documented sources have adapters with availability checks
- `Source isolation on missing keys`: PASS - Missing optional keys skip only their adapter

## Eval Artifacts Reviewed

- `bun run typecheck` — clean
- `bun run test` - 50/50 passed
- CLI smoke: `source hackernews "Claude Code"` — real results
- CLI smoke: `"Claude Code" --include-sources reddit,hackernews,github` — real results
- `eval-output/summary-20260701.md` - 4 passed, 1 warning, 0 failed, 0 skipped after sourcing repo `.env`
- All 7 `references/*.md` - valid frontmatter
- `scripts/last30days/.env.example` — all keys documented

## Recommendation

Accept the conversion with one optional-source follow-up. The downstream is structurally complete, compiles, passes tests, produces real cited output from no-key public sources, and passes keyed Exa/Brave/X live evals when the repo `.env` is loaded. Perplexity/OpenRouter remains a warning because it did not produce inspectable results.
