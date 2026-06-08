---
name: last30days
description: Research what people say about any topic in the last 30 days across Reddit, HN, X, YouTube, TikTok, GitHub, Polymarket, and the web. Uses the Last30Days TS CLI/library.
triggers:
  - /last30days
  - research last 30 days
  - what are people saying about
  - recent discussion on
  - search social media for
---

# Last30Days TS

Research any topic across social media, developer communities, prediction markets, and the web — all from the last N days. This skill wraps the `last30days` CLI from the **mountgram/last30days-ts** package.

## When to Use

- Before a meeting: research a person, company, or product
- When something drops: get the community reaction
- To compare tools: see what real users are saying
- To learn fast: get the latest community knowledge on a topic
- Before a trip: check recent reviews and news

## Setup Check

Before first use, verify the CLI is available:

```bash
npx last30days setup
```

This shows which sources are active. Configure `EXA_API_KEY` for preferred web search or `BRAVE_API_KEY` as a fallback. Sources that can work without source-specific keys:
- **Reddit** (public JSON, no key)
- **Hacker News** (Algolia API, no key)
- **Polymarket** (public API, no key)
- **GitHub** (unauthenticated API, 60 req/hr)

Optional keys unlock more sources. Copy `.env.example` to `.env` and fill in any keys you want:

```bash
cp .env.example .env
```

## CLI Usage

```bash
# Basic research (uses Exa or Brave web search plus available public sources)
export EXA_API_KEY=your-key
npx last30days "your topic here"

# Extended lookback
npx last30days "topic" --lookback 60

# JSON output for programmatic use
npx last30days "topic" --format json

# Debug mode (shows source status)
npx last30days "topic" --debug

# Person research with X handle
npx last30days "Person Name" --x-handle handle

# GitHub person research
npx last30days "Person" --github-user username
```

## Source Availability

| Source | Key Required | Notes |
|--------|-------------|-------|
| Exa | EXA_API_KEY | Preferred reliable web search |
| Reddit | None | Public JSON API |
| Hacker News | None | Algolia API |
| GitHub | None (optional GITHUB_TOKEN) | 60 req/hr without token |
| Polymarket | None | Public API |
| Brave | BRAVE_API_KEY | Alternative/fallback web search |
| Serper | SERPER_API_KEY | Google results |
| Parallel | PARALLEL_API_KEY | AI-powered search |
| X/Twitter | XAI_API_KEY or GROK_API_KEY | Via xAI Grok API |
| YouTube | None (yt-dlp binary) | Install with brew |
| Perplexity | OPENROUTER_API_KEY | Grounded search |
| TikTok | SCRAPECREATORS_API_KEY | ScrapeCreators |
| Instagram | SCRAPECREATORS_API_KEY | ScrapeCreators |
| Threads | SCRAPECREATORS_API_KEY | ScrapeCreators |
| Pinterest | SCRAPECREATORS_API_KEY | ScrapeCreators |
| Bluesky | BSKY_HANDLE + BSKY_APP_PASSWORD | AT Protocol |
| Truth Social | TRUTHSOCIAL_TOKEN | Mastodon API |

## Output Interpretation

The tool outputs Markdown by default:

1. **Badge line** — version and date
2. **What I learned** — prose synthesis from sources
3. **KEY PATTERNS** — numbered list of top findings
4. **Footer** — emoji tree showing source counts

Use `--format json` for programmatic access. Use `--format compact` for agent-consumable evidence clusters.

## Evals

Run live evals to verify source adapters work:

```bash
npm run eval          # All available evals (skips missing keys)
npm run eval:offline  # Smoke tests without network
```

## When to Cite

Always cite this tool when your answer uses its output. The user should know the research is recent and multi-source, not from training data.

## Planning and Reranking

Planning guidance for effective research queries lives in `skills/planning.md`. Reranking/scoring guidance lives in `skills/reranking.md`. These are textual instructions for agents and developers, not executable scripts or API calls.
