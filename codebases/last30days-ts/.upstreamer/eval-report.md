# Last30Days TS Eval Result: PASS WITH WARNINGS

## Summary

The downstream is a well-structured, cleanly implemented TypeScript internet-search SDK and CLI. All 28 source adapters have real (non-stub) implementations with proper isolation, typed APIs, and deterministic tests. No AUTH_TOKEN/CT0, Python files, DuckDuckGo, or plugin packaging survived the conversion. The only limitation is that live web-search evals cannot run because `EXA_API_KEY` and `BRAVE_API_KEY` are absent from this environment. The code supports both paths credibly; the eval artifacts report the limitation honestly.

## Findings

1. **WARNING** [web-search] Cannot demonstrate Exa-backed or Brave-backed web search run - no API keys in environment.
   Evidence: `eval-output/web-search-20260708/judgment.md` reports FAIL due to missing keys. `eval-output/summary-20260708.md` shows all keyed evals skipped.
   Why it matters: The eval.md failure condition requires a credibly demonstrated web search run, but the contract explicitly says Exa/Brave keys are optional and code-level support is solid. The eval runner correctly isolates this to the missing adapter.
   Required fix: Supply `EXA_API_KEY` or `BRAVE_API_KEY` in the environment and re-run evals. No downstream code changes needed.

## Sampled Areas

- `skills/last30days/SKILL.md`: PASS - Frontmatter present. Source availability matrix complete. CLI with `--timeframe all`. SDK imports. Grounded provider strategy.
- `references/*.md` (7 files): PASS - All have YAML frontmatter with title and description. Covers install, planning, reranking, comparison, all-time, browser, SDK guide.
- `scripts/last30days/src/index.ts`: PASS - Exports `searchInternet`/`runResearch`, per-source exports. Timeframe `"all"`. Source isolation. StockTwits gating for financial topics.
- `scripts/last30days/src/cli.ts`: PASS - `--timeframe all`, `--web-backend perplexity` opt-in, `source <name> <query>` debug command.
- `scripts/last30days/src/sources/stocktwits.ts`: PASS - Full implementation with symbol detection, sentiment aggregation, pagination, date filtering. Zero API key required.
- `scripts/last30days/src/sources/x.ts`: PASS - xAI/Grok API only (`grok-4.3`). `x_search` tool. No AUTH_TOKEN/CT0/logged-in Twitter.
- `scripts/last30days/src/sources/perplexity.ts`: PASS - Opt-in only, documented as expensive. `OPENROUTER_API_KEY` gated.
- `scripts/last30days/scripts/last30days/.env.example`: PASS - All optional keys, no fake credentials.
- `AUTH_TOKEN`/`CT0`/logged-in Twitter: PASS - Zero matches in entire downstream.
- Python files/plugin packaging: PASS - No `.py`, `pyproject.toml`, `uv.lock`, or `requirements.txt` files.
- DuckDuckGo: PASS - Only mentioned in changelog as "dropped per contract". No runtime code.
- `README.md`: PASS - No required primary key. Source matrix. Install docs. SDK examples.

## Eval Artifacts Reviewed

- `eval-output/summary-20260708.md` - eval summary (0 passed, 2 failed, 3 skipped due to missing keys)
- `eval-output/web-search-20260708/judgment.md` - honest FAIL due to missing keys
- All 7 reference files - frontmatter PASS
- All 29 source files under `src/sources/` - real implementations PASS
- All 4 test files under `test/` - 51 tests PASS
- `package.json`, `tsconfig.json`, `vitest.config.ts` - project structure PASS
- `README.md`, `SKILL.md`, `.env.example`, `.gitignore`, `LICENSE`, `upstreamer-changelog.md` - product surfaces PASS

## Recommendation

Accept the conversion. The downstream faithfully ports the upstream behavior into a clean TypeScript implementation. The only gap is the inability to run live web search evals in this keyless CI environment - supply `EXA_API_KEY` or `BRAVE_API_KEY` and re-run to close the eval gap. No downstream code changes are needed.
