---
name: last30days
description: Research the last 30 days of public signals for a topic using the Last30Days TS CLI/library. Use when a user asks what is happening recently, wants recent discussion across web/social/dev/video sources, or needs a cited brief before deciding.
---

# Last30Days

Use this skill when the user asks for recent public signal, momentum, discourse, launches, controversies, adoption, market interest, or developer/community reaction around a topic.

## What This Tool Does

Last30Days TS searches available recent sources, normalizes evidence, ranks by freshness/relevance/engagement, groups near-duplicates, and renders a cited Markdown or JSON brief.

Useful source families include DuckDuckGo, Exa, Brave, Serper, Parallel, Perplexity/Sonar, Reddit, Hacker News, GitHub, Polymarket, YouTube through `yt-dlp`, Bluesky, X through xAI/Grok, and optional ScrapeCreators-backed social adapters.

## Before Running

1. Check whether the package is available in the current repo.
2. If source is present, run commands from the package root.
3. If installed as a package, prefer `npx last30days`.
4. Do not require API keys for baseline use.
5. Use `.env.example` as the source-specific key map when the user wants stronger keyed evals or richer source coverage.

## Baseline Commands

Run a zero-key brief:

```bash
npx last30days "AI coding agents" --limit 8
```

Run with debug/source status:

```bash
npx last30days "AI coding agents" --limit 8 --debug
```

Save Markdown output:

```bash
npx last30days "AI coding agents" --save --output-dir ./briefs
```

Render JSON for programmatic review:

```bash
npx last30days "AI coding agents" --format json
```

## Optional Keys

Keys unlock only their own adapters. Missing keys should be treated as normal skipped source status, not failure.

- `EXA_API_KEY`: Exa only.
- `BRAVE_API_KEY`: Brave only.
- `SERPER_API_KEY`: Serper only.
- `PARALLEL_API_KEY`: Parallel only.
- `OPENROUTER_API_KEY`: Perplexity/Sonar only.
- `XAI_API_KEY` or `GROK_API_KEY`: X/Twitter through xAI/Grok only.
- `GITHUB_TOKEN`: GitHub rate limit increase only.
- `SCRAPECREATORS_API_KEY`: retained social adapters.
- `LAST30DAYS_DIR`: output/cache directory.

Do not ask users for browser session credentials for X/Twitter; the X adapter is intentionally xAI/Grok-only.

## How To Use Results

1. Read the `What Stands Out` section first.
2. Check `Source Status` before drawing conclusions. Skipped keyed adapters mean unavailable credentials, not negative evidence.
3. Treat failed optional adapters as coverage limitations unless every useful source failed.
4. Prefer cited, inspectable, platform-native evidence over generic snippets.
5. Mention important coverage gaps in your answer, especially if DuckDuckGo returns sparse results or key social/search providers were skipped.
6. Do not invent source results that are not present in the brief.

## When To Run Evals

Run evals when modifying the package, checking a new installation, or validating that keyed sources improve output quality.

```bash
npm run eval:offline
npm run eval
```

Eval artifacts are written under `eval-output/` and include Markdown, JSON, source status, command options, and an agent-readable judgment.

## Good Agent Behavior

- Run the tool before answering when the user asks for recent public evidence and the answer would otherwise rely on stale model knowledge.
- Quote or summarize cited evidence with links.
- State the lookback window and notable skipped/failed sources.
- If the output is thin, say so and suggest enabling relevant keys from `.env.example`.
- Use `skills/planning.md` for query shaping and `skills/reranking.md` when judging whether the ranked evidence is actually useful.
