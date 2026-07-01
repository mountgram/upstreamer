---
name: last30days
description: Research what people say about any topic across Reddit, HN, X, YouTube, TikTok, GitHub, Polymarket, Digg, arXiv, Techmeme, Trustpilot, LinkedIn, and the web. Includes a bundled Bun/TypeScript CLI with per-source SDK imports.
triggers:
  - /last30days
  - research last 30 days
  - what are people saying about
  - recent discussion on
  - search social media for
---

# Last30Days TS

Research any topic across social media, developer communities, prediction markets, web news, academic papers, brand sentiment, professional posts, YouTube videos, maps/place context, and web search, all from recent or all-time windows. This skill includes its own Bun/TypeScript CLI, source SDKs, tests, planning/reranking references, and a `.env.example`.

Do not assume a global `last30days` package is installed. Use the bundled code that came with this skill.

## When to Use

- Before a meeting: research a person, company, or product
- When something drops: get the community reaction
- To compare tools: see what real users are saying across platforms
- To learn fast: get the latest community knowledge on a topic
- Before a trip or purchase: check recent reviews, brand sentiment, and news
- Hiring research: analyze company focus shifts from public job postings
- Academic research: find recent arXiv papers on a topic
- Source verification: use an available browser tool for dynamic pages, LinkedIn profiles/posts, or exact quote/source validation when APIs return thin metadata

## First-Time Setup

From this installed skill directory, read `references/INSTALL.md` first, then run:

```bash
cd scripts/last30days
bun install
bun run setup
```

This shows which sources are active. Configure `EXA_API_KEY` for preferred web search or `BRAVE_API_KEY` as a fallback.

If the host project keeps API keys in a repo-root `.env`, explicitly load or copy those variables before running commands from `scripts/last30days/`. The bundled config automatically reads `.env` from the current working directory, but many skill commands execute inside the installed skill directory rather than the project root.

```bash
# From the host project root, load keys without printing them.
set -a; source .env; set +a

# Then run the installed skill commands.
cd .agents/skills/last30days/scripts/last30days
bun run setup
```

### Sources That Work Immediately (No Key)

| Source | Access |
|--------|--------|
| Reddit | Public JSON/RSS, top comments with scores |
| Hacker News | Algolia public API |
| Polymarket | Public prediction market API |
| GitHub | Unauthenticated API (60 req/hr) |
| Health | MedlinePlus/NIH public API |
| YouTube | Requires `yt-dlp` binary (brew install yt-dlp) |
| Digg | Requires `digg-pp-cli` binary |
| arXiv | Requires `arxiv-pp-cli` binary |
| Techmeme | Requires `techmeme-pp-cli` binary |
| Jobs | Public ATS APIs (Greenhouse, Lever, Ashby) via `--hiring-signals` |

### Key-Gated Sources (Optional)

Copy `scripts/last30days/.env.example` to `scripts/last30days/.env` and fill in any keys:

```bash
cd scripts/last30days
cp .env.example .env
```

## CLI Usage

From the installed skill directory:

```bash
cd scripts/last30days

# Basic research with Exa or Brave web search plus available public sources
export EXA_API_KEY=your-key
bun run last30days -- "React Server Components"

# All-time search (no 30-day window)
bun run last30days -- "Rust vs Go" --timeframe all --lookback 3650

# Extended lookback
bun run last30days -- "topic" --lookback 60

# JSON output
bun run last30days -- "topic" --format json

# Debug mode (shows source status)
bun run last30days -- "topic" --debug

# Person research with X handle
bun run last30days -- "Person Name" --x-handle handle

# GitHub person research
bun run last30days -- "Person" --github-user username

# Hiring signals analysis
bun run last30days -- "Company" --hiring-signals --job-board companyname

# Comparison search
bun run last30days -- "Cursor IDE vs Codex" --depth deep

# Direct source debugging
bun run last30days -- source exa "query"
bun run last30days -- source hackernews "query"
```

## Source Availability

| Source | Key Required | Notes |
|--------|-------------|-------|
| Exa | EXA_API_KEY | Preferred reliable web search |
| Brave | BRAVE_API_KEY | Alternative/fallback web search |
| OpenAI Web | OPENAI_API_KEY | Responses API web-search grounding; preferred LLM-grounded web option |
| Serper | SERPER_API_KEY | Google results via Serper |
| Parallel | PARALLEL_API_KEY | AI-powered web search |
| Reddit | None | Public JSON/RSS with comment enrichment |
| Hacker News | None | Algolia public API |
| GitHub | None (optional GITHUB_TOKEN) | 60 req/hr without token, 5000 with |
| Polymarket | None | Public prediction market API |
| X/Twitter | XAI_API_KEY or GROK_API_KEY | Via xAI Grok API x_search tool |
| YouTube | None (yt-dlp binary) | Install: brew install yt-dlp |
| Gemini YouTube | GEMINI_API_KEY + yt-dlp | Video understanding over YouTube URLs discovered by yt-dlp |
| Gemini Maps | GEMINI_API_KEY | Google Maps grounding for spatial/place questions |
| Perplexity | OPENROUTER_API_KEY | Grounded Sonar search via OpenRouter; expensive, opt in explicitly |
| TikTok | SCRAPECREATORS_API_KEY | ScrapeCreators API |
| Instagram | SCRAPECREATORS_API_KEY | ScrapeCreators API |
| Threads | SCRAPECREATORS_API_KEY | ScrapeCreators API |
| Pinterest | SCRAPECREATORS_API_KEY | ScrapeCreators API, opt-in |
| LinkedIn | SCRAPECREATORS_API_KEY | Post search + article enrichment |
| Bluesky | BSKY_HANDLE + BSKY_APP_PASSWORD | AT Protocol |
| Truth Social | TRUTHSOCIAL_TOKEN | Mastodon-compatible API |
| Digg | None (digg-pp-cli binary) | AI leaderboard headlines |
| arXiv | None (arxiv-pp-cli binary) | Research papers via Atom API |
| Techmeme | None (techmeme-pp-cli binary) | Tech news headlines |
| Trustpilot | None (trustpilot-pp-cli binary) | Auto-gated on brand topics |
| Health | None | MedlinePlus/NIH public API |
| Jobs | None (opt-in via --hiring-signals) | Greenhouse, Lever, Ashby ATS APIs |

## SDK Import

Import source SDKs directly without running the CLI:

```typescript
import { runResearch, searchExa, searchHackerNews, searchReddit } from "last30days-skill";

const report = await runResearch({
  topic: "React Server Components",
  lookbackDays: 30,
  outputFormat: "markdown",
});

const hnItems = await searchHackerNews("Claude Code", "2026-06-01", "2026-07-01", "medium");
```

See `references/source-sdk-guide.md` for full import examples for every source.

For non-trivial research, it is great to write a small TypeScript or JavaScript file that imports the bundled SDK, runs tailored source searches, custom-parses the JSON, and emits exactly the table/source-manifest/synthesis shape you need. Run scratch scripts with Bun from `scripts/last30days/`, and do not commit throwaway outputs unless they are intentional project artifacts.

## Grounded Provider Strategy

- Use Exa or Brave for ordinary web search.
- Use OpenAI web grounding when you need an LLM-grounded web pass and `OPENAI_API_KEY` is available.
- Use Gemini YouTube when a query depends on what is actually said or shown in YouTube videos, not just video titles/descriptions.
- Use Gemini Maps for spatial questions such as "what's around London?", neighborhoods, venues, restaurants, hotels, and local context.
- Treat Perplexity/Sonar as expensive opt-in only. Use `--web-backend perplexity` or `--include-sources perplexity` only when specifically needed.

## When to Use a Browser

Use the bundled SDK/CLI first for broad discovery. Use an available browser automation tool only when the source needs visible page context, dynamic rendering, login-state context approved by the user, or exact source verification.

Good browser candidates:

- LinkedIn profiles, company pages, and posts where API metadata is too thin.
- X posts or threads that need visual confirmation, screenshots, or exact quoted text.
- Company websites, pricing pages, docs, and changelogs where current page structure matters.
- Review or marketplace pages where sorting/filtering, pagination, or lazy-loaded content changes the evidence.

Do not install a browser stack as part of this skill. If the host project already has agent-browser, Rotunda, the `browser` skill, Playwright, or another browser tool, use it as a separate verification/discovery step and cite what you observed. See `references/browser-research.md`.

## Output Interpretation

The tool outputs Markdown by default:

1. **Badge line** -- version and date
2. **What I learned** -- prose synthesis from sources
3. **KEY PATTERNS** -- numbered list of top findings
4. **Footer** -- emoji tree showing source counts

Use `--format json` for programmatic access. Use `--format compact` for agent-consumable evidence clusters.

## Planning, Reranking, and Reference Docs

- `references/planning.md`: query design and source selection guidance
- `references/reranking.md`: scoring, deduplication, and clustering logic
- `references/comparison-search.md`: how to run head-to-head comparisons
- `references/all-time-search.md`: running unbounded historical searches
- `references/browser-research.md`: when and how to use browser tools alongside the SDK
- `references/source-sdk-guide.md`: importing individual source SDKs
- `references/INSTALL.md`: first-time setup instructions

These are textual instructions for agents and developers, not executable scripts or API calls.

## When to Cite

Always cite this tool when your answer uses its output. The user should know the research is recent and multi-source, not from training data.

## Bundled Files

The installed skill directory includes:

- `SKILL.md`: this agent-facing workflow
- `references/`: planning, reranking, comparison, all-time, browser research, source SDK, and install docs
- `scripts/last30days/package.json`: Bun scripts and dependencies
- `scripts/last30days/src/`: TypeScript CLI, library, source adapters (28 source SDKs and utilities), ranking, rendering, and config
- `scripts/last30days/test/`: deterministic tests
- `scripts/last30days/.env.example`: source-specific optional keys
