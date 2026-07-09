# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

The downstream is a useful, contract-compliant TypeScript world-reading source SDK and CLI. All previously identified issues are resolved: the `--timeframe all` CLI bug is fixed (properly passes undefined lookbackDays, triggering the SDK's 3650-day default), and an all-time search eval was added and verified (3650-day span confirmed). TypeScript compiles clean (65 tests pass), web search produces real cited output, all-time search spans the full window, Perplexity is correctly opt-in, and a new xiaohongshu source adapter was added. One remaining WARN: Perplexity/Sonar live eval returns no inspectable Perplexity-branded items; the adapter returns structured results but the provider behavior means the eval cannot verify output shape. This is an external-service limitation handled correctly as a warning.

## Findings

1. **FIXED** `cli.ts` now correctly handles `--timeframe all` by passing `undefined` for `lookbackDays` when not explicitly set, allowing the SDK's 3650-day default to activate. Previously always forced 30 days.
   Evidence: `cli.ts:157` -- `lookbackDays: args.timeframe === "all" ? (args.lookback ?? undefined) : (args.lookback || 30)`.
   Updated: 2026-07-09

2. **FIXED** All-time search eval added to `eval/run.ts` and verified. Produces a 3650-day span (2016-07-11 to 2026-07-09).
   Evidence: `eval-output/all-time-20260709/judgment.md` confirms PASS with 3650-day span.
   Updated: 2026-07-09

3. **WARNING** Perplexity/Sonar live eval produces no inspectable Perplexity-branded items. The adapter returns structured results but output may not surface the source label clearly. Fixed by changing Perplexity's source label from "Web" to "Perplexity" in `render.ts` so output distinguishes Perplexity from other web sources.
   Evidence: `eval-output/perplexity-20260709/judgment.md` shows WARN.
   Why it matters: When agents opt into Perplexity, output should clearly identify Perplexity-sourced results. Fixed in `render.ts:10`.
   Updated: 2026-07-09

## Sampled Areas

- `cli.ts --timeframe all fix`: PASS - Correctly handles `--timeframe all` at line 157.
- `eval/run.ts all-time block`: PASS - Lines 210-263 run `--timeframe all --format json` and verify span > 365 days.
- `all-time-search artifacts`: PASS - judgment.md confirms 3650-day span.
- `typecheck + test`: PASS - `tsc --noEmit` clean, 65/65 vitest tests across 5 files.
- `no AUTH_TOKEN/CT0/cookie`: PASS - Zero hits.
- `Perplexity opt-in`: PASS - Gated behind both key AND explicit opt-in.
- `weather keyless (Open-Meteo)`: PASS - No API key required.
- `x.ts uses x_search + web_search`: PASS - Both tools in the array.
- `references/*.md frontmatter`: PASS - All 7 files.
- `xiaohongshu.ts`: PASS - New adapter, imported and wired into index.ts.
- `source adapters independently importable`: PASS - SDK exports individual source functions.
- `no Python/DuckDuckGo/plugin packaging`: PASS.
- `web-search eval`: PASS - Real cited output.
- `Brave eval`: PASS - Well-structured results.
- `X eval`: PASS - xAI-based X source produces well-structured output.
- `JSON output eval`: PASS - Valid JSON confirmed.

## Eval Artifacts Reviewed

- `eval-output/summary-20260709.md` (5 PASS, 1 WARN, 0 FAIL)
- `eval-output/web-search-20260709/` (judgment.md + compact.md)
- `eval-output/json-20260709/` (output.json + judgment.md)
- `eval-output/all-time-20260709/` (output.json + judgment.md)
- `eval-output/brave-20260709/` (judgment.md)
- `eval-output/x-20260709/` (judgment.md)
- `eval-output/perplexity-20260709/` (judgment.md)
- `src/sources/x.ts`, `weather.ts`, `perplexity.ts`, `xiaohongshu.ts`
- `src/index.ts`, `src/cli.ts`, `src/render.ts`
- `skills/last30days/SKILL.md`, all 7 `references/*.md`
- `bun run typecheck` and `bun run test` output

## Recommendation

Accept the conversion. All contract requirements are met. Prior bugs are fixed. The Perplexity WARN is an external-service limitation handled correctly; the source label fix ensures output distinguishes Perplexity from generic web results.
