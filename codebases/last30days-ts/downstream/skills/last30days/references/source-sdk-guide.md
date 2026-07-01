---
title: Source SDK Guide
description: How to import and use individual source SDKs from Last30Days TS without the orchestrator
---

# Source SDK Guide

Every retained source in Last30Days TS is importable as a standalone TypeScript SDK. You can use individual sources directly in your own TypeScript code without running the orchestrator or CLI.

## Importing Individual Source SDKs

Each source adapter lives under `sources/<name>.ts` and exports a search function. Import them directly:

```typescript
import { searchExa } from "last30days-skill/sources/exa";
import { searchHackerNews } from "last30days-skill/sources/hackernews";
import { searchReddit } from "last30days-skill/sources/reddit";
```

## Public SDK Exports

The package entrypoint exports both the orchestrated API and source-specific functions:

```typescript
import { runResearch, searchInternet, getConfig } from "last30days-skill";
```

`searchInternet()` is the orchestrated multi-source runner. It discovers available adapters based on configured keys and binary availability, then runs them concurrently.

## Source SDK Contract

Every source SDK follows this contract:

```typescript
async function searchSource(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,          // "quick" | "medium" | "deep"
  config: Config,         // optional, source-specific
  options?: RunOptions    // optional, for person-mode etc.
): Promise<SourceItem[]>
```

On failure (missing key, unavailable binary, API error), each source returns an empty array rather than throwing. This keeps a single source failure from breaking the entire run.

## Source SDK Examples

### Exa Web Search

```typescript
import { searchExa } from "last30days-skill/sources/exa";
import { getConfig } from "last30days-skill";

const config = getConfig();
const items = await searchExa("React Server Components", "2026-06-01", "2026-07-01", "medium", config);

for (const item of items) {
  console.log(`- ${item.title} (${item.url})`);
}
```

### Hacker News (no-key public source)

```typescript
import { searchHackerNews } from "last30days-skill/sources/hackernews";

const items = await searchHackerNews("Claude Code", "2026-06-01", "2026-07-01", "medium");

for (const item of items) {
  console.log(`- [${item.engagement.points}pts] ${item.title}`);
}
```

### Reddit (no-key public source)

```typescript
import { searchReddit } from "last30days-skill/sources/reddit";

const items = await searchReddit("OpenAI GPT-5", "2026-06-01", "2026-07-01", "medium", ["machinelearning", "OpenAI"]);

for (const item of items) {
  console.log(`- r/${item.container}: ${item.title} (${item.engagement.score}pts, ${item.engagement.num_comments} comments)`);
}
```

### GitHub (public, optional token)

```typescript
import { searchGitHub } from "last30days-skill/sources/github";
import { getConfig } from "last30days-skill";

const config = getConfig();
const items = await searchGitHub("last30days", "2026-06-01", "2026-07-01", "medium", config);

for (const item of items) {
  console.log(`- ${item.title} (${item.metadata.language}, ${item.engagement.stars} stars)`);
}
```

### X/Grok (requires XAI_API_KEY)

```typescript
import { searchX } from "last30days-skill/sources/x";
import { getConfig } from "last30days-skill";

const config = getConfig();
if (config.xaiApiKey) {
  const items = await searchX("OpenClaw agent", "2026-06-01", "2026-07-01", "medium", config);
  console.log(`Found ${items.length} X posts`);
}
```

### OpenAI Web Grounding (requires OPENAI_API_KEY)

Use this when you want an LLM-grounded web pass. Prefer it over Perplexity/Sonar unless you explicitly need Sonar.

```typescript
import { searchOpenAIWeb } from "last30days-skill/sources/openai_web";
import { getConfig } from "last30days-skill";

const config = getConfig();
const items = await searchOpenAIWeb("what changed in browser agents this month", "2026-06-01", "2026-07-01", "medium", config);

for (const item of items) {
  console.log(`- ${item.title}: ${item.url}`);
}
```

### Gemini YouTube Understanding (requires GEMINI_API_KEY and yt-dlp)

Use this when the answer depends on what is said or shown in videos, not just video titles.

```typescript
import { searchGeminiYouTube } from "last30days-skill/sources/gemini_youtube";
import { getConfig } from "last30days-skill";

const config = getConfig();
const items = await searchGeminiYouTube("best UGC ad editing breakdown videos", "2026-01-01", "2026-07-01", "medium", config);

for (const item of items) {
  console.log(`- ${item.title}: ${item.snippet}`);
}
```

### Gemini Maps Grounding (requires GEMINI_API_KEY)

Use this for spatial/place questions such as "what's around London?" or venue/neighborhood research.

```typescript
import { searchGeminiMaps } from "last30days-skill/sources/gemini_maps";
import { getConfig } from "last30days-skill";

const config = getConfig();
const items = await searchGeminiMaps("interesting AI meetup venues around London", "", "", "medium", config);

for (const item of items) {
  console.log(`- ${item.title}: ${item.body}`);
}
```

### YouTube (requires yt-dlp binary)

```typescript
import { searchYouTube } from "last30days-skill/sources/youtube";

const items = await searchYouTube("React Server Components tutorial", "2026-06-01", "2026-07-01", "medium");

for (const item of items) {
  console.log(`- ${item.title} (${item.engagement.views} views)`);
}
```

### Polymarket (public API)

```typescript
import { searchPolymarket } from "last30days-skill/sources/polymarket";

const items = await searchPolymarket("Will OpenAI release GPT-5", "2026-01-01", "2026-07-01", "medium");

for (const item of items) {
  console.log(`- ${item.title}: ${item.metadata.outcomePrices?.join(" / ")}`);
}
```

## Availability Checking

Skipped adapters report their status clearly. Check source availability before importing:

```typescript
import { getConfig } from "last30days-skill";

const config = getConfig();
const available: string[] = [];

// Always available
available.push("reddit", "hackernews", "polymarket", "github", "health");

// Key-based
if (config.exaApiKey) available.push("exa");
if (config.braveApiKey) available.push("brave");
if (config.xaiApiKey) available.push("x");
if (config.scrapecreatorsApiKey) available.push("tiktok", "instagram", "threads", "linkedin");

console.log("Available sources:", available.join(", "));
```

## Direct Source CLI

Each source can also be run via the CLI for debugging:

```bash
bun run src/cli.ts -- source exa "React Server Components"
bun run src/cli.ts -- source hackernews "Claude Code"
bun run src/cli.ts -- source reddit "OpenAI"
```

This calls the source SDK directly without the orchestrator, useful for testing a single adapter.

## One-Off Analysis Scripts

Writing a small JavaScript or TypeScript file is a good way to use this skill for bespoke research. Use this when you need custom parsing, grouping, filtering, joins across sources, or a project-specific output format.

Good uses:

- Run three related searches and merge/dedupe the links.
- Pull JSON output and convert it into a source manifest.
- Search YouTube with `gemini_youtube`, then extract only claims with supporting URLs.
- Search spatial questions with `gemini_maps`, then format place candidates into a table.
- Parse `items_by_source` differently than the default Markdown renderer.

Keep these scripts close to the research task, run them with Bun, and avoid committing temporary outputs unless they are intentional artifacts.
