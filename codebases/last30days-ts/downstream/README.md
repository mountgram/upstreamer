# Last30Days TS

Last30Days TS is a Node.js TypeScript CLI and library for researching recent public signals about a topic. It searches available sources, ranks evidence by freshness and engagement, groups near-duplicate stories, and renders a concise Markdown or JSON brief.

This project is derived from `mvanhorn/last30days-skill` and rewritten in TypeScript. It keeps the recent-research behavior while replacing the upstream plugin and Python runtime with source-scoped adapters.

## Install

```bash
npm install
npm run build
```

During development:

```bash
npm test
npm run check
npm run eval:offline
npm run eval
```

## CLI

Zero-key baseline using DuckDuckGo plus public sources when reachable:

```bash
npx last30days "AI coding agents" --limit 8
```

Run with Exa enabled as an additive web source:

```bash
EXA_API_KEY=exa_... npx last30days "AI coding agents" --format markdown --debug
```

Save a Markdown brief:

```bash
npx last30days "Open source agents" --save --output-dir ./briefs
```

Useful flags are `--lookback-days`, `--limit`, `--format markdown|json`, `--output-dir`, `--save`, `--debug`, and `--web-backend`. Adapters decide their own availability from environment variables and local tools instead of requiring users to select every source up front.

## Library

```ts
import { research, renderBrief } from "last30days-ts";

const brief = await research({ topic: "AI coding agents", lookbackDays: 30 });
console.log(await renderBrief(brief, "markdown"));
```

## Source Matrix

| Source | Configuration | Notes |
| --- | --- | --- |
| DuckDuckGo | none | Default no-key web search baseline. |
| Reddit | none | Uses public Reddit JSON search when available. |
| Hacker News | none | Uses public Algolia HN search. |
| GitHub | `GITHUB_TOKEN` optional | Unauthenticated by default; token raises rate limits. |
| Polymarket | none | Uses public market search. |
| YouTube | `yt-dlp` on `PATH` | Optional local binary dependency; skipped with a warning when missing. |
| Exa | `EXA_API_KEY` | Optional additive web search source. |
| Brave | `BRAVE_API_KEY` | Optional web search source. |
| Serper | `SERPER_API_KEY` | Optional web search source. |
| Parallel | `PARALLEL_API_KEY` | Optional grounded search source. |
| Perplexity | `OPENROUTER_API_KEY` | Optional Sonar-backed grounded web source only. |
| X / Twitter | `AUTH_TOKEN`/`CT0` or `XAI_API_KEY`/`GROK_API_KEY` | Source-scoped optional adapter. |
| TikTok, Instagram, Threads, Pinterest, Xiaohongshu | `SCRAPECREATORS_API_KEY` | Optional ScrapeCreators-backed adapters. |
| Bluesky | none | Uses the public AT Protocol search endpoint. |
| Truth Social | `TRUTHSOCIAL_TOKEN` or `SCRAPECREATORS_API_KEY` | Optional source-scoped adapter. |
| Digg | `digg-pp-cli` on `PATH` | Optional command-backed source. |

## Environment Variables

`EXA_API_KEY` enables Exa web search only.

`BRAVE_API_KEY` enables Brave Search only.

`SERPER_API_KEY` enables Serper web search only.

`PARALLEL_API_KEY` enables Parallel search only.

`GITHUB_TOKEN` raises GitHub API limits only.

`SCRAPECREATORS_API_KEY` enables retained ScrapeCreators-backed social adapters.

`OPENROUTER_API_KEY` enables the Perplexity/Sonar adapter only.

`AUTH_TOKEN` and `CT0` enable cookie-backed X/Twitter search paths only.

`XAI_API_KEY` and `GROK_API_KEY` enable retained X/xAI search paths only.

`BSKY_HANDLE` and `BSKY_APP_PASSWORD` are reserved for future authenticated Bluesky paths; the current Bluesky search adapter uses the public endpoint.

`TRUTHSOCIAL_TOKEN` enables Truth Social only when using a direct Truth Social path.

`APIFY_API_TOKEN` is reserved for retained Apify-backed adapters.

`LAST30DAYS_DIR` changes the default output directory.

No key is globally required. Missing optional keys skip only the adapter that needs them, and a failure in one optional adapter does not fail the whole run unless every useful source fails.

## Setup

Direct environment variables are the simplest setup:

```bash
export EXA_API_KEY=exa_...
export GITHUB_TOKEN=github_pat_...
```

For local keyed evals, copy the committed example file and fill only the source-specific keys you want to test:

```bash
cp .env.example .env
```

`.env.example` lists every supported optional key with empty values. Filling it improves live eval coverage, but no key is globally required.

The optional helper reports current adapter availability and can write a local env file from already-exported variables:

```bash
npx last30days-setup
npx last30days-setup --write-env
```

Baseline research does not require this helper.

## Planning And Reranking

Planning and reranking guidance lives in textual skills under `skills/planning.md` and `skills/reranking.md`. They are instructions for an agent or maintainer, not scripts and not model-provider API calls.

## Evals

`npm run eval:offline` runs a deterministic no-network smoke eval and writes `eval-output/offline/brief.md`, `brief.json`, `status.json`, `command.json`, and `judgment.md`.

`npm run eval` runs a live zero-key baseline topic through the available adapters and writes the same files under `eval-output/live/`. Keyed adapters run only when their source-scoped environment variables are present; missing keys are recorded as skipped instead of failing the whole eval.

## YouTube

The YouTube adapter uses the same `yt-dlp` binary approach as upstream Last30Days. If `yt-dlp` is not installed, Last30Days TS skips YouTube and reports the missing optional dependency instead of failing the whole research run.

## Deferred Behavior

Some upstream paths are intentionally simplified. Hosted plugin packaging, mandatory setup flows, executable model planning, provider upsell copy, browser-cookie extraction helpers, and vendored X/Twitter JavaScript clients are not part of this TypeScript rewrite. Optional social adapters are either implemented through source-scoped APIs or report a source-specific failure instead of returning fabricated evidence.
