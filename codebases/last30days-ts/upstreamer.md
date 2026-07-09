---
upstream: mvanhorn/last30days-skill
downstream: mountgram/last30days-ts
schedule: "0 */6 * * *"
model: deepseek/deepseek-v4-pro
---

# Internet Search SDK Skill Rewrite Rules

Last30Days TS is a **self-contained installable agent skill with a bundled Bun/TypeScript world-reading source SDK** derived from `mvanhorn/last30days-skill`. It keeps the upstream insight - agents need current public signals from many places - but changes the downstream product from "ask one CLI what happened recently" into "choose the right source for the question, fetch raw evidence, then optionally process it."

This conversion should produce a fresh downstream repository, not a lightly edited copy of the upstream tree. Use the upstream project as source material for behavior, source coverage, and tests, then write an idiomatic TypeScript project where every retained source can be used three ways: through a shared TypeScript import, through the orchestrated library API, and through the bundled CLI.

The conversion is not complete when the code merely compiles. The agent doing the conversion must inspect the upstream behavior claims, port the implementation, write deterministic tests and live evals, execute the available evals, inspect the full generated output, and judge whether the downstream is actually useful in the way the upstream README makes it seem.

## Assumptions

- Local codebase name: `last30days-ts`.
- Downstream repo identity: `mountgram/last30days-ts`.
- The downstream is a Node.js TypeScript SDK package, not a Python package and not a Claude/OpenClaw plugin bundle.
- The downstream must be installable as a skill with `npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream --skill last30days`. Installing the skill must bring the agent instructions, TypeScript source, package metadata, tests, `.env.example`, install reference, and planning/reranking references together in `skills/last30days/`. Live evals must stay outside the installed skill at `downstream/eval/`. Do not require a separate global npm package.
- The downstream should preserve the upstream source surface where practical, but each source must be independently optional at runtime.
- The `last30days` name may remain for install compatibility, but the generated product must not be limited to a 30-day window. Recency is an option, not the identity of the SDK.

## Philosophy

**World-reading source SDKs, raw evidence first, optional processing.**

- TypeScript first: source files should be `.ts`, built with Node's current TypeScript ecosystem.
- Sources are SDKs: each source owns its own config, availability check, search input type, result normalization, errors, and tests. A developer or agent should be able to import and run an individual source without invoking the orchestrator or CLI.
- Source choice is the core workflow: the skill should teach agents why to use each source category. Examples: use Exa/Brave/OpenAI/Serper/Parallel for web search; Ashby/Greenhouse/Lever jobs for hiring and company strategy; StockTwits/Polymarket for markets and predictions; Open-Meteo/weather for local conditions; Gemini Maps for places; YouTube/Gemini YouTube for video knowledge; browser tools for LinkedIn, Instagram, and other dynamic pages when the API path is thin.
- Orchestration is a convenience layer: the top-level library and CLI combine source SDKs, but must not hide source-specific APIs behind one monolithic "last 30 days" script.
- Ranking, parsing, comparison, clustering, and reranking are optional processing steps over fetched evidence. Keep them available, but document them as separate from source access so agents can request raw JSON or direct SDK results when synthesis would get in the way.
- A global setup helper may exist, but it must be optional and should only collect environment variables for source-specific keys.
- API keys are optional source capabilities, not prerequisites for the whole tool or the higher-level orchestration.
- Web search must use reliable web APIs: prefer Exa via `EXA_API_KEY`, and support Brave via `BRAVE_API_KEY` as an alternative/fallback. Do not include DuckDuckGo; its unofficial scraping path is too unreliable for this downstream.
- LLM-grounded web search should prefer OpenAI web search grounding via `OPENAI_API_KEY` when a model-grounded web answer is useful. Keep Perplexity/Sonar via OpenRouter as an explicit opt-in only because Sonar is expensive; do not include Sonar in default source discovery just because `OPENROUTER_API_KEY` exists.
- Gemini is a high-value enrichment provider, not a generic planner dependency. Use `GEMINI_API_KEY` for source-specific SDKs: YouTube video understanding over `yt-dlp`-discovered URLs, and Google Maps grounding for spatial/place questions such as "what's around London?".
- Keep the data model and output understandable enough for downstream users to extend.
- Prefer real, maintained SDKs for external services when they reduce protocol guessing or make the adapter more faithful. Hand-rolled `fetch` is acceptable for simple public JSON endpoints, but not as a shortcut around well-supported provider clients.
- Date filtering must be explicit and optional. Default to a useful recent search window when the user asks for recent/current research, but support all-time searches through `--timeframe all`, `timeframe: "all"`, or equivalent SDK options.
- Skill and reference markdown are product surfaces. `SKILL.md` and every file under `skills/last30days/references/` must have clear YAML frontmatter, concise descriptions, and focused workflows such as source selection, raw source access, comparison search, all-time search, planning, optional reranking, and install/setup.
- Browser-capable research is part of the skill's judgment layer, not a bundled dependency. The downstream should teach agents when to use an available browser automation skill/tool such as agent-browser, Rotunda, or the host agent's native browser for dynamic or login-sensitive sites like LinkedIn, without installing or requiring those tools.
- Setup docs must warn that commands usually run from inside the installed skill directory. If the host project's keys live in a repo-root `.env`, agents should explicitly source/export those variables before `cd scripts/last30days`, or copy only the needed keys into the skill package `.env`. Do not print secret values.

## Source Material to Inspect

Read these upstream areas before writing downstream files:

- `README.md` - public positioning, source list, usage examples, and current behavior claims.
- `skills/last30days/SKILL.md` - command behavior and output contract. Extract the useful product behavior, but do not port the huge prompt contract verbatim.
- `skills/last30days/scripts/*` - command line helpers to get information from sources.
- `tests/` - behavior examples that should be adapted into TypeScript tests where relevant.

After inspecting these files, write a short internal judgment in the final report explaining the upstream promise in plain language: what a successful run should feel like to a user, which sources make it valuable, and what minimum output quality must be demonstrated by evals.

## What to Keep

Keep these concepts, rewritten in TypeScript:

- A bundled `last30days` Bun script that accepts a topic and searches recent results from inside the installed skill directory.
- A library API that can be called from tests and other TypeScript code without shelling out, including `searchInternet()` for orchestrated multi-source search and per-source exports such as `searchExa()`, `searchHackerNews()`, `searchGithub()`, `searchX()`, and other retained source functions.
- A source SDK contract shared by every retained source: typed search options, typed normalized results, a source-specific availability/status helper, isolated error reporting, deterministic tests, and runnable examples through both import and CLI paths.
- A normalized evidence item shape with source, title, URL, body/snippet, author/container, published date, engagement, and relevance metadata.
- A query plan shape with one or more subqueries and per-source selection.
- A source map in the agent-facing docs that explains which source to use for common real-world needs: web/news, social/community, jobs/company strategy, stocks/markets/predictions, weather/local conditions, places/maps, health, academic/research, code/developer signals, video, and dynamic browser-only pages.
- Planning, usage, comparison-search, all-time-search, source-selection, browser-research, raw source access, and reranking guidance from upstream, rewritten as textual skill/reference instructions rather than executable planner/reranker scripts.
- An installable primary skill at `skills/last30days/SKILL.md` that teaches agents how to install dependencies with Bun and use the bundled CLI/library from the installed skill directory.
- Date-window handling for recent research, plus explicit all-time search. The CLI and SDK must support both bounded lookbacks such as 7/30/90 days and unbounded search via `--timeframe all` or `timeframe: "all"`.
- Engagement-aware ranking and source-aware deduplication.
- Simple clustering or grouping for near-duplicate stories when the same story appears in multiple sources.
- Markdown output as the default human-readable format, with output headers that reflect the selected timeframe instead of always saying "last 30 days".
- JSON output for programmatic use.
- A concise README with install, configuration, source availability, and examples.
- A concise `upstreamer-changelog.md` with user-facing release-note style bullets describing upstream-driven downstream changes.
- A committed `.env.example` listing every supported optional key with empty values and comments that map each key to the adapter it unlocks.
- A committed `.gitignore` that ignores generated/local artifacts including `node_modules/`, `dist/`, `eval-output/`, and `.env`.
- The upstream MIT license.

## Sources to Implement

Port the upstream source surface into TypeScript adapters. The orchestrator should attempt the useful available sources for a topic, but no top-level pipeline path should require credentials for every source.

### Required Source SDKs

- `exa` - preferred reliable web search enabled by `EXA_API_KEY`. Must be importable as a standalone TypeScript search SDK.
- `brave` - alternative/fallback web search enabled by `BRAVE_API_KEY`. Must be importable as a standalone TypeScript search SDK.

### Upstream Sources to Preserve

Create TypeScript source adapters for these upstream concepts where the upstream behavior can be reasonably represented:

- `reddit` - public Reddit JSON or other no-key public access where available.
- `hackernews` - public HN/Algolia APIs.
- `github` - unauthenticated GitHub API by default, optional `GITHUB_TOKEN` for higher rate limits.
- `polymarket` - public API where the upstream implementation can be carried over cleanly.
- `youtube` - required adapter using the same `yt-dlp` binary approach as upstream Last30Days for YouTube search/transcripts. If `yt-dlp` is missing, skip YouTube with a clear optional-dependency warning rather than failing the whole run.
- `gemini_youtube` - optional Gemini enrichment source enabled by `GEMINI_API_KEY`. It should combine `yt-dlp` discovery with Gemini video understanding so agents can ask questions and pull knowledge from YouTube videos, not only list video metadata. Run it for video-shaped topics or explicit source selection, not for every query.
- `gemini_maps` - optional Gemini Google Maps grounding source enabled by `GEMINI_API_KEY`. It should handle spatial/place questions such as "what's around London?", neighborhoods, venues, restaurants, hotels, and local context. Run it for spatial-shaped topics or explicit source selection, not for every query.
- `weather` - keyless weather/local conditions source backed by a maintained public API such as Open-Meteo. It should handle weather-shaped queries, location extraction, current conditions, short forecasts, and direct CLI/SDK use without any API key.
- `openai_web` - optional OpenAI Responses API web-search-grounded source enabled by `OPENAI_API_KEY`. Prefer this over Perplexity/Sonar for model-grounded web search when the user has OpenAI configured.
- `x` - optional X/Twitter source backed only by the xAI/Grok API using `XAI_API_KEY` or `GROK_API_KEY`. Use the modern xAI model `grok-4.3` for this adapter unless the user explicitly selects a newer model. Implement X and web grounding through xAI inference tools, not the older interface: call `client.responses.create(...)` with `tools` that include `{ type: "x_search" }` for X posts and `{ type: "web_search" }` when the query needs broader web grounding. Do not invent or pass legacy `search_parameters`, do not look for top-level `tool_results`, and do not use chat-completions-era tool plumbing. Request strict JSON in the prompt, parse posts and web evidence from final `output_text`, and use `usage.server_side_tool_usage_details.x_search_calls` and `web_search_calls` only as diagnostics when present. The transformed downstream output must not include logged-in Twitter, browser cookies, session auth, cookie extraction, `AUTH_TOKEN`, or `CT0` in code, docs, `.env.example`, tests, evals, or user-facing reports.
- `tiktok`, `instagram`, `threads`, `pinterest`, `bluesky`, `truthsocial`, `xiaohongshu`, and `digg` - preserve as optional adapters when the upstream source has a clear API or command dependency.
- `brave`, `serper`, `parallel`, `openai_web`, `perplexity`, and other grounded web/provider search paths - keep as optional web/search adapters, not as planner/model-provider requirements. Perplexity/Sonar must be opt-in only because of cost.

### Source SDK and Availability Rules

- Do not add a user-facing `--sources` selection flag as the primary interface.
- The default run should use a topic-aware set of available adapters.
- Each source must expose a direct TypeScript function/class that can be imported independently of the orchestrator. The source SDK should accept a query, timeframe/all-time option, limit, and source-specific knobs only when useful.
- Each source must be runnable from the CLI either through the orchestrated search path or a documented source/debug command such as `bun run last30days -- source exa "query"`; do not require developers to reverse-engineer test files to try one adapter.
- Missing optional keys or local tools should skip only the unavailable adapter, with a clear warning in debug/status output.
- A failure in one optional source must not fail the whole research run unless every useful source failed.
- The same run must be able to mix Exa-backed web search with no-key public sources such as Reddit, Hacker News, GitHub, Polymarket, YouTube, and Digg.
- If an internal source allowlist is needed for tests or debugging, keep it an internal/config-level mechanism rather than the main CLI contract.
- The source SDKs should work for general internet discovery, not only for "what happened in the last 30 days" briefs.
- Direct source access must be documented as a first-class path. The CLI may keep `source <name> <query>` for debugging, but the docs should present it as useful raw source access, not only as a maintainer diagnostic.

## API Key and Setup Simplification

The downstream should have a source-scoped configuration surface. Keys unlock only their own adapters:

```text
EXA_API_KEY       preferred for reliable Exa web search
BRAVE_API_KEY     optional, enables Brave web search
SERPER_API_KEY    optional, enables Serper web search
PARALLEL_API_KEY  optional, enables Parallel web search
GITHUB_TOKEN      optional, raises GitHub API limits
SCRAPECREATORS_API_KEY optional, enables any retained ScrapeCreators-backed social adapters
OPENROUTER_API_KEY optional, enables retained Perplexity/Sonar adapter only
XAI_API_KEY/GROK_API_KEY optional, enables retained X/Twitter search through xAI/Grok only, not global planning
BSKY_HANDLE/BSKY_APP_PASSWORD optional, enables retained Bluesky adapter only
TRUTHSOCIAL_TOKEN optional, enables retained Truth Social adapter only
APIFY_API_TOKEN   optional, enables retained Apify-backed adapters only
LAST30DAYS_DIR    optional, output/cache directory
```

Keep a global setup script, but make it a thin optional helper. It should read/write a local env file, show which adapters are currently available, and never imply that any key is required for baseline use. Users should also be able to configure everything by exporting environment variables directly.

Create `.env.example` in `skills/last30days/scripts/last30days/`. It must be safe to commit, contain no real credentials, and include every supported optional environment variable from the configuration surface. Group keys by source area so users can copy it to `.env` and selectively fill values before running better searches or local maintainer evals. Include brief comments for aliases such as `XAI_API_KEY` and `GROK_API_KEY`.

Do not require a primary API key. Do not make one provider unlock unrelated sources. Do not require model-provider keys for ordinary retrieval orchestration.

Keep these upstream key and auth paths when they unlock a source adapter, but simplify them into documented environment variables:

- ScrapeCreators-backed social adapters
- Brave Search
- Serper
- Parallel AI
- OpenRouter/Perplexity
- OpenAI web search grounding
- Gemini YouTube understanding and Google Maps grounding
- X/Twitter search through xAI/Grok API keys only. Do not preserve or document upstream's logged-in Twitter/cookie/session auth paths in the transformed codebase.
- Bluesky, Truth Social, TikTok, Instagram, Threads, Pinterest, Xiaohongshu, and XQuik auth flows where the upstream adapter can be ported cleanly

Drop or simplify these upstream paths when they only support model planning, packaging, provider upsell, or mandatory onboarding rather than source retrieval:

- OpenAI, Gemini, and xAI model provider routing for planning/reranking when it makes retrieval orchestration depend on model-provider keys. Source-specific adapters for OpenAI web grounding, xAI X search, and Gemini YouTube/Maps grounding are allowed.
- Logged-in Twitter, browser-cookie, `AUTH_TOKEN`, `CT0`, or session-token X/Twitter retrieval. X/Twitter support must go through the xAI/Grok API path only, and the transformed downstream output must not mention these removed X auth mechanisms except in this rewrite contract.
- Device-auth flows that force a hosted account when a direct environment variable can work
- Setup copy that says users must configure paid sources before baseline research works
- Any auth path that makes one source's credential look globally required

## TypeScript Architecture

Use a small TypeScript structure similar to this:

```text
codebases/last30days-ts/downstream/
├── README.md
├── upstreamer-changelog.md
├── LICENSE
├── .gitignore
├── eval/
│   └── run.ts
├── skills/
│   └── last30days/
│       ├── SKILL.md
│       ├── references/
│       │   ├── all-time-search.md
│       │   ├── browser-research.md
│       │   ├── comparison-search.md
│       │   ├── planning.md
│       │   ├── reranking.md
│       │   ├── source-sdk-guide.md
│       │   └── INSTALL.md
│       ├── scripts/
│       │   └── last30days/
│       │       ├── package.json
│       │       ├── bun.lock
│       │       ├── tsconfig.json
│       │       ├── vitest.config.ts
│       │       ├── .env.example
│       │       ├── .gitignore
│       │       ├── LICENSE
│       │       ├── src/
│       │       └── test/
```

The installable skill directory is the product. `npx skills add ... --skill last30days` must install the agent workflow, reference docs, and all runnable TypeScript SDK sources together.

The TypeScript package under `skills/last30days/scripts/last30days/` must be usable as both a CLI and an importable SDK:

```text
src/
├── index.ts              # public SDK exports
├── cli.ts                # CLI only
├── sources/
│   ├── exa.ts            # standalone source SDK
│   ├── brave.ts
│   ├── x.ts
│   └── ...
└── ...
```

`package.json` should expose the public SDK entrypoint and source entrypoints through `exports` when practical, for example `.` and `./sources/exa`. Keep the CLI runnable through Bun scripts. Do not make downstream developers import private implementation paths.

## What to Adapt

Adapt these upstream behaviors, not necessarily their exact implementations:

- CLI flags from `last30days.py` into a Bun-run TypeScript CLI inside `skills/last30days/scripts/last30days/src/`. Keep only flags that matter for the simplified downstream: topic, timeframe (`all`, `recent`, or lookback days), lookback days, depth/limit, output format, output directory, debug/status output, source/debug execution when useful, and web backend if needed.
- The upstream setup wizard into a TypeScript setup command or script that writes optional environment variables and reports adapter availability without pressuring the user through one preferred signup path.
- The upstream setup wizard into a TypeScript setup command or script that writes optional environment variables and reports adapter availability without pressuring the user through one preferred signup path. The setup helper may read from `.env` if a lightweight dependency is already justified, but direct environment variables and `.env.example` must remain clear enough to use without the helper.
- `schema.py` dataclasses into TypeScript interfaces or zod-style schemas. Prefer plain TypeScript interfaces unless validation is needed. Include public SDK types for `SearchTimeframe`, `SourceSearchOptions`, `EvidenceItem`, `SourceStatus`, `SourceSearchResult`, and the orchestrated search result.
- Pipeline orchestration into a small async source runner that discovers available adapters and executes useful sources concurrently. This runner should call the same exported source SDK functions that external users import.
- Ranking into deterministic TypeScript functions that combine freshness, engagement, source quality, and text relevance.
- Upstream planning and reranking prompt logic into textual references inside the installed skill directory. At minimum include `skills/last30days/references/INSTALL.md`, `planning.md`, `reranking.md`, `comparison-search.md`, `all-time-search.md`, `browser-research.md`, and `source-sdk-guide.md`. These files should instruct an agent or developer how to form subqueries, choose useful source emphasis, search all-time versus recent windows, run comparison searches, decide when browser automation is appropriate, import individual source SDKs, judge relevance, and resolve ties. They should not call model APIs, require provider keys, or be implemented as scripts.
- Browser research guidance into `skills/last30days/references/browser-research.md`. This must explain that browser automation is optional and external, useful for pages that are dynamic, rate-limited, personalized, require visible UI context, or need exact source verification. It should name examples such as LinkedIn profiles/posts, X pages that need visual verification, public company pages, review sites, and search-result pages where APIs are insufficient. It must explicitly say not to install agent-browser, Rotunda, Playwright, or other browser stacks as part of this skill; use them only when the host environment already provides them or the user asks for that workflow.
- The upstream user-facing Last30Days behavior into `skills/last30days/SKILL.md`, but adapt it around source access rather than a single recent-brief workflow. This skill must be useful after installing it into another project: it should explain triggers, Bun setup, bundled CLI invocation, direct source commands, source availability, `.env.example`, eval commands, output interpretation, browser companions, optional processing/reranking, and when to cite/run the tool before answering.
- `SKILL.md` and `references/INSTALL.md` must explicitly mention repo-root `.env` handling because installed skill commands may execute from `.agents/skills/last30days/scripts/last30days/` instead of the host repo root. Include a safe `set -a; source .env; set +a` example and warn not to print secrets.
- `SKILL.md`, `references/INSTALL.md`, and `references/source-sdk-guide.md` should encourage writing small one-off TypeScript/JavaScript scripts for custom parsing, source joins, output shaping, source manifests, and bespoke research workflows. These scripts should import the bundled SDK and run with Bun from `scripts/last30days/`; generated scratch outputs should stay out of commits unless intentionally retained.
- Markdown rendering into a compact, citation-preserving output. Avoid the upstream's very large prompt-law contract.
- Tests into a TypeScript test suite using the repository's chosen test runner.

## What to Remove Entirely

Remove these upstream areas from the downstream output:

- All Python files and Python packaging: `.py`, `pyproject.toml`, `uv.lock`, `requirements.txt`, `__pycache__/`.
- `skills/last30days/scripts/` as Python runtime code.
- The large upstream `SKILL.md` prompt contract, canonical-path self-checks, and marketplace/plugin cache logic.
- Executable planning/reranking scripts that call model providers. Preserve the useful judgment criteria as textual skills instead.
- `.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/`, `gemini-extension.json`, `hooks/`, and platform packaging.
- `.github/` workflows and upstream release automation.
- `fixtures/`, `docs/test-results/`, launch-copy docs, release notes, and planning docs unless a small fixture is needed for tests.
- ScrapeCreators device auth, PAT auth, browser-cookie extraction, logged-in Twitter/session auth, telemetry-like nudges, and provider upsell copy. Keep simple source-specific configuration and a global env setup helper when an adapter needs it. The downstream output must not include removed X auth names or cookie/session Twitter setup text.
- Vendored JavaScript X/Twitter client code.
- Media assets unrelated to the TypeScript CLI.

## Dependency Rules

- Keep runtime dependencies small. Prefer built-in `fetch` on supported Node versions.
- Use official SDKs or well-maintained npm packages when they make an adapter safer, clearer, or more complete than hand-rolled HTTP calls. This is a positive requirement, not an optional nice-to-have.
- Install and use source-specific packages where appropriate for APIs such as Exa, YouTube/`yt-dlp` wrapping, Reddit, GitHub, HN, OpenAI web search grounding, Gemini YouTube/Maps grounding, OpenRouter/Perplexity, Brave, Serper, Parallel, ScrapeCreators, Bluesky/AT Protocol, or social/search providers.
- Prefer `exa-js` or the current official Exa SDK for Exa. Use the official OpenAI SDK for OpenAI web search grounding through the Responses API with the current web-search tool (for example `web_search_preview` or its successor). Prefer the official OpenAI SDK for OpenRouter-compatible providers such as Perplexity/Sonar and xAI/Grok when the provider exposes an OpenAI-compatible API, but keep Perplexity/Sonar opt-in due to cost. For xAI/Grok, use `openai` with `baseURL: "https://api.x.ai/v1"` and `client.responses.create({ model: "grok-4.3", tools: [{ type: "x_search" }, { type: "web_search" }], ... })` unless the user explicitly selects a newer model. Follow the current xAI tool docs; the adapter must use `x_search` for X posts and `web_search` for broader web grounding, must not use a `search_parameters` field, and must not look for top-level `tool_results`. Request strict JSON in the prompt and parse posts/web evidence from `output_text`. Use Gemini through source-specific REST or official SDK calls for video and maps grounding; do not make Gemini a required planner/reranker key.
- If an official SDK exists but the adapter uses `fetch`, explicitly justify that choice in the final report, for example because the endpoint is a simple unauthenticated public JSON API or the SDK is unmaintained/incompatible.
- Do not add a framework.
- Avoid heavy scraping dependencies unless a required source cannot be implemented safely without one.
- Do not vendor upstream dependencies. Prefer normal npm package dependencies over copied code.
- Include a generated lockfile only when the chosen package manager expects one and it helps reproducible tests/builds.
- Do not commit local install/build/eval artifacts such as `node_modules/`, `dist/`, `eval-output/`, or `output/`. They should be ignored by `.gitignore`.
- Prefer a simple test runner such as `vitest` or Node's built-in test runner.

## Test And Eval Requirements

Create both ordinary tests and full eval tests.

### Deterministic Tests

- Port relevant upstream behavior tests into TypeScript unit/integration tests.
- Cover date-window handling, ranking, deduplication, rendering, source availability, optional-key behavior, and at least one mocked source run.
- Cover all-time timeframe handling separately from bounded recent lookbacks.
- Cover at least two direct source SDK imports, including one keyed web source and one no-key/public source.
- These tests must run without paid credentials or network access whenever practical.

### Live Evals

Add an eval suite under `eval/` or `test/eval/` that can run against live connections when credentials and local tools are available.

The eval suite must:

- Execute the built CLI or public library API on real research topics, not only mocked adapters.
- Include at least one Exa-backed web search eval that exercises the baseline search path.
- Include at least one all-time search eval or artifact that proves results are not forcibly filtered to the last 30 days when `timeframe: "all"` or `--timeframe all` is used.
- Include at least one direct SDK eval/example that imports a source SDK or `searchInternet()` from TypeScript rather than shelling out to the CLI.
- Document that copying `.env.example` to `.env` and filling source-specific keys enables stronger keyed eval coverage.
- Include keyed evals for available providers such as Exa, OpenAI web grounding, Gemini YouTube/Maps grounding, Brave, Serper, Parallel, ScrapeCreators, GitHub token, Bluesky, OpenRouter/Perplexity, or other configured source adapters. Skip a keyed eval with a clear reason when its env vars are absent; do not fail the whole suite for missing optional credentials.
- Use live model/provider connections only where they unlock a source adapter or a dedicated eval judge. Do not reintroduce model-provider keys as requirements for ordinary retrieval orchestration.
- Write full eval artifacts to an ignored output directory such as `eval-output/`: raw JSON brief, rendered Markdown brief, adapter status, warnings, and the exact command/options used.
- Include an agent-readable judgment file for each eval run that records whether the output is useful, recent, cited, source-diverse, non-fabricated, and consistent with the upstream README's promise.
- Keep live evals outside the installed skill directory at `downstream/eval/run.ts`. They are upstreamer/release QA, not customer-installed skill source.

The converting agent must run every eval that can run in the current environment. If optional credentials are unavailable, it must run the Exa-backed baseline eval when `EXA_API_KEY` is present and document skipped optional keyed evals. After running evals, inspect the full Markdown/JSON outputs, not just pass/fail status, and make a concrete quality judgment in the final report.

### Eval Judgment Criteria

For each full eval output, judge:

- Does the brief answer the requested topic with recent evidence from the requested lookback window?
- When all-time search is requested, does the output avoid false "last 30 days" claims and allow older canonical evidence when relevant?
- Are citations inspectable and attached to concrete source items?
- Are optional source failures isolated rather than breaking the whole run?
- Does ranking surface high-signal items instead of generic SEO or placeholder entries?
- Are duplicates grouped or suppressed enough that the brief is readable?
- Is the output useful enough that a user would recognize the value described by upstream `README.md`?

If the answer is no, improve the implementation and rerun the eval before claiming success. If a limitation remains, document it clearly as a remaining uncertainty rather than hiding behind passing unit tests.

## README Requirements

The downstream README must include:

- What Last30Days TS does in one paragraph: a TypeScript internet-search SDK and CLI with a default recent-research workflow, not a tool limited to exactly 30 days.
- `npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream --skill last30days` install command.
- A clear statement that installing the skill brings the Bun/TypeScript source SDKs, tests, package metadata, install reference, and docs with it, while maintainer live evals live outside the installed skill.
- Bun setup and usage commands from inside the installed skill directory.
- CLI examples using `bun run last30days -- ...`, including Exa-backed web search usage, a run that mixes Exa with available public/social adapters, an all-time search example, and a comparison-search example.
- Import examples using the public SDK, including one orchestrated `searchInternet()` example and one direct source SDK example such as `searchExa()` or `searchHackerNews()`.
- A source matrix showing which sources need keys.
- A source-purpose guide showing why an agent would choose each source group, including weather, jobs, stocks/markets, web search, social/community, health, places, video, academic, and browser-only/dynamic sources.
- The exact supported environment variables.
- A `.env.example` section explaining how to copy the installed skill's env example to `.env` for local evals without making any key globally required.
- A setup section explaining both direct environment-variable configuration and the optional setup helper.
- A note that planning, comparison search, all-time search, browser research, source SDK, and reranking guidance lives inside the installable skill directory as frontmatter-formatted markdown, not provider-backed scripts.
- A section explaining that `skills/last30days/SKILL.md` is the installable agent-facing skill and that the skill directory is self-contained.
- A note that YouTube uses the same `yt-dlp` binary approach as upstream Last30Days.
- A short note that the project is derived from `mvanhorn/last30days-skill` and rewritten in TypeScript.

## Verification

Before finishing a conversion run, verify:

- The downstream output has `package.json`, `tsconfig.json`, `src/`, and `README.md`.
- The downstream output has `README.md`, `LICENSE`, `upstreamer-changelog.md`, and `skills/last30days/`.
- `skills/last30days/` has `SKILL.md`, `references/INSTALL.md`, `references/planning.md`, `references/reranking.md`, `references/comparison-search.md`, `references/all-time-search.md`, `references/browser-research.md`, `references/source-sdk-guide.md`, and `scripts/last30days/`.
- `skills/last30days/scripts/last30days/` has `package.json`, `bun.lock`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/`, and `test/`.
- `skills/last30days/SKILL.md` and every `skills/last30days/references/*.md` file begins with YAML frontmatter containing at least `title` or `name`, plus `description`.
- `downstream/eval/run.ts` exists and is not inside `skills/last30days/`.
- The installed skill's `.env.example` documents all supported optional keys without real secrets.
- The downstream root `.gitignore` ignores root `eval-output/`. The installed skill script package `.gitignore` ignores `node_modules/`, `dist/`, `output/`, and `.env`.
- The downstream output contains no `AUTH_TOKEN`, `CT0`, logged-in Twitter, cookie-based Twitter, or session-token X/Twitter setup in code, docs, env examples, tests, evals, generated artifacts, or reports.
- There are no Python source or packaging files.
- There is at least one TypeScript file under `skills/last30days/scripts/last30days/src/`.
- Exa is documented and implemented as the preferred reliable web search source.
- Brave is documented and implemented as an alternative/fallback reliable web search source.
- Weather is documented and implemented as a keyless current/weather forecast source.
- `EXA_API_KEY` controls only the Exa web search source.
- DuckDuckGo is not present in runtime code, README, skills, tests, or package dependencies.
- The README does not present any required primary API key.
- The orchestration can mix no-key and keyed sources in one run without requiring every source.
- The SDK and CLI support all-time search without hard-coding the output to "last 30 days".
- The public TypeScript SDK exports `searchInternet()` and direct source search APIs or documented equivalent source entrypoints.
- YouTube is implemented through `yt-dlp` as an optional local binary dependency for that source.
- The setup helper is optional and environment-variable based.
- Planning, comparison search, all-time search, browser research, source SDK guidance, raw source access guidance, and reranking are represented as textual files inside `skills/last30days/`, not scripts or model-provider API calls.
- Browser research guidance is present and clearly states when to use available browser automation for sources such as LinkedIn without bundling browser dependencies into the skill.
- `skills/last30days/SKILL.md` exists, is agent-facing, references `references/INSTALL.md`, and gives practical instructions for running `bun install`, `bun run setup`, and `bun run last30days -- ...` from `scripts/last30days/`.
- `upstreamer-changelog.md` exists and describes user-facing downstream changes without commit hashes, `.upstreamer/state.yaml`, verifier internals, or sync bookkeeping.
- Optional upstream sources are represented as adapters or explicitly documented as intentionally deferred with a reason.
- TypeScript checks and tests pass if dependencies can be installed in the environment.
- `skills/last30days/scripts/last30days/package.json` includes maintained SDK dependencies for provider-backed adapters where appropriate. The xAI/Grok X adapter may reuse the `openai` SDK against `https://api.x.ai/v1` instead of adding extra AI SDK dependencies.
- Hard-coded model identifiers are current for May 18 2026. The xAI/Grok X adapter uses `grok-4.3` with the `x_search` and `web_search` tools unless explicitly overridden by the user. The OpenAI web adapter should use a current cost-conscious OpenAI model with web-search grounding. The Gemini adapters should use a current cost-conscious Gemini model that supports video understanding and Maps grounding. The OpenRouter/Perplexity adapter may use `perplexity/sonar-pro`, but it must be documented and wired as expensive opt-in only.
- Live eval tests exist, can skip or warn on missing, invalid, or rate-limited optional credentials cleanly, and write full output artifacts for agent review. X/Twitter keyed evals must look only for `XAI_API_KEY` or `GROK_API_KEY`. Optional keyed-source failures should not fail the conversion eval unless they break baseline behavior, are hidden from the user, contaminate unrelated sources, or are falsely reported as passing.
- Live eval docs point users to `.env.example` for enabling stronger keyed evals.
- The converting agent has run all available deterministic tests and live evals, inspected the generated eval artifacts, and judged whether the downstream output is as useful as the upstream README claims.

Run the bundled verifier against the downstream output directory:

```bash
codebases/last30days-ts/.upstreamer/scripts/verify-last30days-ts.sh codebases/last30days-ts/downstream
```

If running checks manually, use these macOS-compatible commands:

```bash
find <downstream-dir> -type f | sort
find <downstream-dir> -type f \( -name '*.py' -o -name 'pyproject.toml' -o -name 'uv.lock' -o -name 'requirements.txt' \)
grep -RInE 'OPENAI_API_KEY|GEMINI_API_KEY|XAI_API_KEY' <downstream-dir> || true
grep -RInE 'AUTH_TOKEN|CT0|logged[- ]in Twitter|cookie[- ]based Twitter|session-token X|Twitter cookies' <downstream-dir> && exit 1 || true
grep -RInE 'EXA_API_KEY|Exa' <downstream-dir>
grep -RInE 'yt-dlp|ytdlp' <downstream-dir>
grep -RInE 'timeframe.*all|--timeframe all|all-time' <downstream-dir>
```

Review every model-provider grep hit before finishing. It is acceptable for a key to appear when it unlocks one optional adapter; it is a violation if the README, setup helper, or orchestration makes that key globally required. Fix real violations and rerun verification until it passes.

After the bundled verifier passes, run the qualitative eval in `codebases/last30days-ts/.upstreamer/eval.md` from a fresh review context. Fix and rerun eval failures before updating sync state. If the eval cannot be made to pass in the current run, write `codebases/last30days-ts/.upstreamer/eval-report.md` as the bankruptcy report and do not update sync state.

## Final Report

Return:

- Output location.
- Upstream commit processed.
- Summary of the TypeScript project shape.
- Sources implemented, adapted, and intentionally deferred.
- API keys supported and what each unlocks.
- Public SDK exports, direct source SDK entrypoints, and CLI examples added.
- Verification commands run and results.
- Eval commands run, skipped evals with reasons, artifact locations, and the agent's judgment of output quality.
- Qualitative eval result and `codebases/last30days-ts/.upstreamer/eval-report.md` path.
- SDKs/packages chosen for source adapters, plus any notable direct-HTTP choices and why they are acceptable.
- Summary added to `upstreamer-changelog.md`.
- Any remaining uncertainty or behavior intentionally simplified from upstream.
