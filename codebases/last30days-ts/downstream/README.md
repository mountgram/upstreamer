# Last30Days TS

Research what people actually say about any topic in the last 30 days. Searches Reddit, Hacker News, X/Twitter, YouTube, TikTok, GitHub, Polymarket, and the web — scores by engagement, and produces a concise brief. TypeScript rewrite of [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill).

## Install

```bash
npm install -g mountgram/last30days-ts
# or run directly:
npx last30days "your topic"
```

## Quick Start

No configuration needed for basic use:

```bash
# Research any topic (uses DuckDuckGo + no-key public sources)
npx last30days "React Server Components"
npx last30days "AI agent frameworks"
npx last30days "NVIDIA earnings"
```

## CLI Usage

```
last30days <topic> [options]

Options:
  --lookback <days>     Days to look back (default: 30)
  --depth <level>       quick, medium, or deep (default: medium)
  --format <type>       markdown, json, or compact (default: markdown)
  --output <dir>        Output directory (default: ./output)
  --debug               Enable debug output
  --x-handle <handle>   X/Twitter handle for person search
  --subreddits <list>   Comma-separated subreddits
  --github-user <user>  GitHub username for person search
  --github-repos <list> Comma-separated owner/repo
```

Check source availability:

```bash
npx last30days setup
```

## Sources

### Free (no key required)

| Source | Method |
|--------|--------|
| DuckDuckGo | Public web search |
| Reddit | Public JSON API |
| Hacker News | Algolia public API |
| GitHub | Unauthenticated API (60 req/hr) |
| Polymarket | Public API |

### Optional (key unlocks more)

| Source | Key | Method |
|--------|-----|--------|
| Exa | `EXA_API_KEY` | Semantic web search |
| Brave | `BRAVE_API_KEY` | Web search (2000 free/month) |
| Serper | `SERPER_API_KEY` | Google search |
| Parallel | `PARALLEL_API_KEY` | AI-powered search |
| X/Twitter | `XAI_API_KEY` or `GROK_API_KEY` | xAI Grok API |
| Perplexity | `OPENROUTER_API_KEY` | Grounded search via OpenRouter |
| TikTok | `SCRAPECREATORS_API_KEY` | ScrapeCreators API |
| Instagram | `SCRAPECREATORS_API_KEY` | ScrapeCreators API |
| Threads | `SCRAPECREATORS_API_KEY` | ScrapeCreators API |
| Pinterest | `SCRAPECREATORS_API_KEY` | ScrapeCreators API |
| Bluesky | `BSKY_HANDLE` + `BSKY_APP_PASSWORD` | AT Protocol |
| Truth Social | `TRUTHSOCIAL_TOKEN` | API |

## Configuration

All sources are independently optional. The tool works out of the box with DuckDuckGo and public APIs.

### Environment Variables

Copy `.env.example` to `.env` and fill in keys for the sources you want:

```bash
cp .env.example .env
# Edit .env with your keys
```

Or export them directly:

```bash
export EXA_API_KEY=your-key
export XAI_API_KEY=your-key
npx last30days "topic"
```

See `.env.example` for the complete list of supported variables.

### Setup Helper

Run the setup command to see which sources are available:

```bash
npx last30days setup
```

This prints a table showing which sources are configured and how to enable others.

### YouTube

YouTube search uses the same `yt-dlp` binary approach as upstream Last30Days. Install with:

```bash
brew install yt-dlp
```

If `yt-dlp` is not installed, YouTube is skipped with a warning — the rest of the run continues.

### Planning and Reranking

Planning guidance for effective research queries lives in `skills/planning.md`. Reranking and scoring logic is documented in `skills/reranking.md`. Both are textual reference files for agents and developers — no API keys or model calls are involved.

## Agent Skill

This repository includes an installable agent skill at `skills/last30days/SKILL.md`. Install it in any Agent Skills host:

```bash
npx skills add mountgram/last30days-ts -g
```

The skill teaches agents when and how to invoke the `last30days` CLI from within a project that has this package installed.

## Output Formats

- **markdown** (default) — Human-readable brief with badge, prose synthesis, key patterns, and emoji footer
- **json** — Machine-readable full report with all candidates, clusters, and metadata
- **compact** — Agent-consumable format with evidence clusters, stats, and pass-through footer

## Development

```bash
# Install dependencies
npm install

# Run type checking
npm run typecheck

# Build
npm run build

# Run tests
npm test

# Run live evals
npm run eval
```

### Evals

Live evals test source adapters against real endpoints:

```bash
npm run eval          # All available evals (skips missing keys)
npm run eval:offline  # Smoke tests without network
```

Eval artifacts are written to `eval-output/` (git-ignored). Each eval produces:
- Raw JSON/Markdown output
- Adapter status and warnings
- A judgment file assessing output quality

## License

MIT — derived from [mvanhorn/last30days-skill](https://github.com/mvanhorn/last30days-skill), rewritten in TypeScript.
