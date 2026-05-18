---
upstream: mvanhorn/last30days-skill
downstream: mountgram/last30days-ts
---

# Last30Days TS Rewrite Rules

Last30Days TS is a **small TypeScript research CLI and library** derived from `mvanhorn/last30days-skill`. It keeps the upstream idea - search recent public signals across the full upstream source set, rank them by freshness and engagement, and produce a concise brief - but rewrites the implementation from Python into TypeScript and removes the tightly coupled orchestration that makes broad source coverage feel like an all-or-nothing setup.

This conversion should produce a fresh downstream repository, not a lightly edited copy of the upstream tree. Use the upstream project as source material for behavior and tests, then write an idiomatic TypeScript project with a simpler provider model.

The conversion is not complete when the code merely compiles. The agent doing the conversion must inspect the upstream behavior claims, port the implementation, write deterministic tests and live evals, execute the available evals, inspect the full generated output, and judge whether the downstream is actually useful in the way the upstream README makes it seem.

## Assumptions

- Local codebase name: `last30days-ts`.
- Downstream repo identity: `mountgram/last30days-ts`.
- The downstream is a Node.js TypeScript package, not a Python package and not a Claude/OpenClaw plugin bundle.
- The downstream may include skills or command wrappers only if they invoke the TypeScript CLI and do not reintroduce the upstream's python.
- The downstream should preserve the upstream source surface where practical, but each source must be independently optional at runtime.

## Philosophy

**Recent research, simple sources.**

- TypeScript first: source files should be `.ts`, built with Node's current TypeScript ecosystem.
- Sources are plug-ins: each source owns its own config and availability check.
- A global setup helper may exist, but it must be optional and should only collect environment variables for source-specific keys.
- API keys are optional source capabilities, not prerequisites for the whole tool or the higher-level orchestration.
- Web search must support both no-key DuckDuckGo and optional Exa search.
- Keep the data model and output understandable enough for downstream users to extend.
- Prefer real, maintained SDKs for external services when they reduce protocol guessing or make the adapter more faithful. Hand-rolled `fetch` is acceptable for simple public JSON endpoints, but not as a shortcut around well-supported provider clients.

## Source Material to Inspect

Read these upstream areas before writing downstream files:

- `README.md` - public positioning, source list, usage examples, and current behavior claims.
- `skills/last30days/SKILL.md` - command behavior and output contract. Extract the useful product behavior, but do not port the huge prompt contract verbatim.
- `skills/last30days/scripts/*` - command line helpers to get information from sources.
- `tests/` - behavior examples that should be adapted into TypeScript tests where relevant.

After inspecting these files, write a short internal judgment in the final report explaining the upstream promise in plain language: what a successful run should feel like to a user, which sources make it valuable, and what minimum output quality must be demonstrated by evals.

## What to Keep

Keep these concepts, rewritten in TypeScript:

- A `last30days` CLI that accepts a topic and searches recent results.
- A library API that can be called from tests and other TypeScript code without shelling out.
- A normalized evidence item shape with source, title, URL, body/snippet, author/container, published date, engagement, and relevance metadata.
- A query plan shape with one or more subqueries and per-source selection.
- Planning and reranking guidance from upstream, rewritten as textual skill instructions rather than executable planner/reranker scripts.
- Date-window handling for the last 30 days, plus an explicit lookback option.
- Engagement-aware ranking and source-aware deduplication.
- Simple clustering or grouping for near-duplicate stories when the same story appears in multiple sources.
- Markdown output as the default human-readable format.
- JSON output for programmatic use.
- A concise README with install, configuration, source availability, and examples.
- A committed `.env.example` listing every supported optional key with empty values and comments that map each key to the adapter it unlocks.
- The upstream MIT license.

## Sources to Implement

Port the upstream source surface into TypeScript adapters. The orchestrator should attempt the useful available sources for a topic, but no top-level pipeline path should require credentials for every source.

### Required Sources

- `duckduckgo` - default no-key web search. This is the baseline web source and should work without configuration.
- `exa` - optional web search enabled by `EXA_API_KEY`. This is additive beyond DuckDuckGo, not a replacement.

### Upstream Sources to Preserve

Create TypeScript source adapters for these upstream concepts where the upstream behavior can be reasonably represented:

- `reddit` - public Reddit JSON or other no-key public access where available.
- `hackernews` - public HN/Algolia APIs.
- `github` - unauthenticated GitHub API by default, optional `GITHUB_TOKEN` for higher rate limits.
- `polymarket` - public API where the upstream implementation can be carried over cleanly.
- `youtube` - required adapter using the same `yt-dlp` binary approach as upstream Last30Days for YouTube search/transcripts. If `yt-dlp` is missing, skip YouTube with a clear optional-dependency warning rather than failing the whole run.
- `x` - optional X/Twitter source. Keep it source-scoped; do not make X auth part of global setup.
- `tiktok`, `instagram`, `threads`, `pinterest`, `bluesky`, `truthsocial`, `xiaohongshu`, and `digg` - preserve as optional adapters when the upstream source has a clear API or command dependency.
- `brave`, `serper`, `parallel`, `perplexity`, and other grounded web/provider search paths - keep as optional web/search adapters, not as planner/model-provider requirements.

### Source Availability Rules

- Do not add a user-facing `--sources` selection flag as the primary interface.
- The default run should use a topic-aware set of available adapters.
- Missing optional keys or local tools should skip only the unavailable adapter, with a clear warning in debug/status output.
- A failure in one optional source must not fail the whole research run unless every useful source failed.
- The same run must be able to mix keyed and no-key sources, such as DuckDuckGo, Exa, Reddit, and GitHub.
- If an internal source allowlist is needed for tests or debugging, keep it an internal/config-level mechanism rather than the main CLI contract.

## API Key and Setup Simplification

The downstream should have a source-scoped configuration surface. Keys unlock only their own adapters:

```text
EXA_API_KEY       optional, enables Exa web search
BRAVE_API_KEY     optional, enables Brave web search
SERPER_API_KEY    optional, enables Serper web search
PARALLEL_API_KEY  optional, enables Parallel web search
GITHUB_TOKEN      optional, raises GitHub API limits
SCRAPECREATORS_API_KEY optional, enables any retained ScrapeCreators-backed social adapters
OPENROUTER_API_KEY optional, enables retained Perplexity/Sonar adapter only
AUTH_TOKEN/CT0    optional, enables retained X cookie adapter only
XAI_API_KEY/GROK_API_KEY optional, enables retained X/xAI adapter only, not global planning
BSKY_HANDLE/BSKY_APP_PASSWORD optional, enables retained Bluesky adapter only
TRUTHSOCIAL_TOKEN optional, enables retained Truth Social adapter only
APIFY_API_TOKEN   optional, enables retained Apify-backed adapters only
LAST30DAYS_DIR    optional, output/cache directory
```

Keep a global setup script, but make it a thin optional helper. It should read/write a local env file, show which adapters are currently available, and never imply that any key is required for baseline use. Users should also be able to configure everything by exporting environment variables directly.

Create `.env.example` in the downstream root. It must be safe to commit, contain no real credentials, and include every supported optional environment variable from the configuration surface. Group keys by source area so users can copy it to `.env` and selectively fill values before running better live evals. Include brief comments for aliases such as `XAI_API_KEY` and `GROK_API_KEY`.

Do not require a primary API key. Do not make one provider unlock unrelated sources. Do not require model-provider keys for ordinary retrieval orchestration.

Keep these upstream key and auth paths when they unlock a source adapter, but simplify them into documented environment variables:

- ScrapeCreators-backed social adapters
- Brave Search
- Serper
- Parallel AI
- OpenRouter/Perplexity
- X/Twitter cookies and source-specific auth tokens
- Bluesky, Truth Social, TikTok, Instagram, Threads, Pinterest, Xiaohongshu, and XQuik auth flows where the upstream adapter can be ported cleanly

Drop or simplify these upstream paths when they only support model planning, packaging, provider upsell, or mandatory onboarding rather than source retrieval:

- OpenAI, Gemini, and xAI model provider routing for planning/reranking when it makes retrieval orchestration depend on model-provider keys
- Device-auth flows that force a hosted account when a direct environment variable can work
- Setup copy that says users must configure paid sources before baseline research works
- Any auth path that makes one source's credential look globally required

## TypeScript Architecture

Use a small TypeScript structure similar to this:

```text
codebases/last30days-ts/downstream/
├── README.md
├── .env.example
├── LICENSE
├── package.json
├── tsconfig.json
├── src/
│   ├── cli.ts
│   ├── index.ts
│   ├── config.ts
│   ├── dates.ts
│   ├── ranking.ts
│   ├── render.ts
│   ├── schema.ts
│   └── sources/
│       ├── duckduckgo.ts
│       ├── exa.ts
│       ├── brave.ts
│       ├── github.ts
│       ├── hackernews.ts
│       ├── instagram.ts
│       ├── perplexity.ts
│       ├── polymarket.ts
│       ├── reddit.ts
│       ├── scrapecreators.ts
│       ├── serper.ts
│       ├── tiktok.ts
│       ├── x.ts
│       └── youtube.ts
│   └── setup.ts
├── skills/
│   ├── planning.md
│   └── reranking.md
└── test/
    ├── dates.test.ts
    ├── ranking.test.ts
    └── sources.test.ts
```

This exact tree is not mandatory, but the downstream must be recognizably TypeScript and must keep source adapters separated enough that users can mix and match them.

## What to Adapt

Adapt these upstream behaviors, not necessarily their exact implementations:

- CLI flags from `last30days.py` into a Node CLI. Keep only flags that matter for the simplified downstream: topic, lookback days, depth/limit, output format, output directory, debug/status output, and web backend if needed.
- The upstream setup wizard into a TypeScript setup command or script that writes optional environment variables and reports adapter availability without pressuring the user through one preferred signup path.
- The upstream setup wizard into a TypeScript setup command or script that writes optional environment variables and reports adapter availability without pressuring the user through one preferred signup path. The setup helper may read from `.env` if a lightweight dependency is already justified, but direct environment variables and `.env.example` must remain clear enough to use without the helper.
- `schema.py` dataclasses into TypeScript interfaces or zod-style schemas. Prefer plain TypeScript interfaces unless validation is needed.
- Pipeline orchestration into a small async source runner that discovers available adapters and executes useful sources concurrently.
- Ranking into deterministic TypeScript functions that combine freshness, engagement, source quality, and text relevance.
- Upstream planning and reranking prompt logic into textual skills, such as `skills/planning.md` and `skills/reranking.md`. These files should instruct an agent how to form subqueries, choose useful source emphasis, judge relevance, and resolve ties. They should not call model APIs, require provider keys, or be implemented as scripts.
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
- ScrapeCreators device auth, PAT auth, browser-cookie extraction, telemetry-like nudges, and provider upsell copy. Keep simple source-specific configuration and a global env setup helper when an adapter needs it.
- Vendored JavaScript X/Twitter client code.
- Media assets unrelated to the TypeScript CLI.

## Dependency Rules

- Keep runtime dependencies small. Prefer built-in `fetch` on supported Node versions.
- Use official SDKs or well-maintained npm packages when they make an adapter safer, clearer, or more complete than hand-rolled HTTP calls. This is a positive requirement, not an optional nice-to-have.
- Install and use source-specific packages where appropriate for APIs such as DuckDuckGo search, Exa, YouTube/`yt-dlp` wrapping, Reddit, GitHub, HN, OpenRouter/Perplexity, Brave, Serper, Parallel, ScrapeCreators, Bluesky/AT Protocol, or social/search providers.
- Prefer `exa-js` or the current official Exa SDK for Exa. Prefer the official OpenAI SDK for OpenRouter-compatible chat/completions providers such as Perplexity/Sonar unless a more direct maintained provider SDK exists. Use the Vercel AI SDK only when the downstream genuinely needs model-provider abstraction or streaming/generation ergonomics; do not add it just to satisfy a dependency checklist.
- If an official SDK exists but the adapter uses `fetch`, explicitly justify that choice in the final report, for example because the endpoint is a simple unauthenticated public JSON API or the SDK is unmaintained/incompatible.
- Do not add a framework.
- Avoid heavy scraping dependencies unless a required source cannot be implemented safely without one.
- Do not vendor upstream dependencies. Prefer normal npm package dependencies over copied code.
- Include a generated lockfile only when the chosen package manager expects one and it helps reproducible tests/builds.
- Prefer a simple test runner such as `vitest` or Node's built-in test runner.

## Test And Eval Requirements

Create both ordinary tests and full eval tests.

### Deterministic Tests

- Port relevant upstream behavior tests into TypeScript unit/integration tests.
- Cover date-window handling, ranking, deduplication, rendering, source availability, optional-key behavior, and at least one mocked source run.
- These tests must run without paid credentials or network access whenever practical.

### Live Evals

Add an eval suite under `eval/` or `test/eval/` that can run against live connections when credentials and local tools are available.

The eval suite must:

- Execute the built CLI or public library API on real research topics, not only mocked adapters.
- Include at least one zero-key eval that exercises the no-key baseline sources.
- Document that copying `.env.example` to `.env` and filling source-specific keys enables stronger keyed eval coverage.
- Include keyed evals for available providers such as Exa, OpenRouter/Perplexity, Brave, Serper, Parallel, ScrapeCreators, GitHub token, Bluesky, or other configured source adapters. Skip a keyed eval with a clear reason when its env vars are absent; do not fail the whole suite for missing optional credentials.
- Use live model/provider connections only where they unlock a source adapter or a dedicated eval judge. Do not reintroduce model-provider keys as requirements for ordinary retrieval orchestration.
- Write full eval artifacts to an ignored output directory such as `eval-output/`: raw JSON brief, rendered Markdown brief, adapter status, warnings, and the exact command/options used.
- Include an agent-readable judgment file for each eval run that records whether the output is useful, recent, cited, source-diverse, non-fabricated, and consistent with the upstream README's promise.
- Make eval commands explicit in `package.json`, for example `npm run eval` for available live evals and `npm run eval:offline` for non-network smoke evals if useful.

The converting agent must run every eval that can run in the current environment. If credentials are unavailable, it must still run the zero-key eval and document skipped keyed evals. After running evals, inspect the full Markdown/JSON outputs, not just pass/fail status, and make a concrete quality judgment in the final report.

### Eval Judgment Criteria

For each full eval output, judge:

- Does the brief answer the requested topic with recent evidence from the requested lookback window?
- Are citations inspectable and attached to concrete source items?
- Are optional source failures isolated rather than breaking the whole run?
- Does ranking surface high-signal items instead of generic SEO or placeholder entries?
- Are duplicates grouped or suppressed enough that the brief is readable?
- Is the output useful enough that a user would recognize the value described by upstream `README.md`?

If the answer is no, improve the implementation and rerun the eval before claiming success. If a limitation remains, document it clearly as a remaining uncertainty rather than hiding behind passing unit tests.

## README Requirements

The downstream README must include:

- What Last30Days TS does in one paragraph.
- Install and local development commands.
- CLI examples, including zero-key DuckDuckGo-backed usage and a run where Exa is additionally available.
- A source matrix showing which sources need keys.
- The exact supported environment variables.
- A `.env.example` section explaining how to copy it to `.env` for local evals without making any key globally required.
- A setup section explaining both direct environment-variable configuration and the optional setup helper.
- A note that planning and reranking guidance lives in textual skills, not provider-backed scripts.
- A note that YouTube uses the same `yt-dlp` binary approach as upstream Last30Days.
- A short note that the project is derived from `mvanhorn/last30days-skill` and rewritten in TypeScript.

## Verification

Before finishing a conversion run, verify:

- The downstream output has `package.json`, `tsconfig.json`, `src/`, and `README.md`.
- The downstream output has `.env.example`, and it documents all supported optional keys without real secrets.
- There are no Python source or packaging files.
- There is at least one TypeScript file under `src/`.
- DuckDuckGo and Exa are both documented and implemented as web search sources.
- `EXA_API_KEY` is optional and only controls the Exa source.
- The README does not present any required primary API key.
- The orchestration can mix no-key and keyed sources in one run without requiring every source.
- YouTube is implemented through `yt-dlp` as an optional local binary dependency for that source.
- The setup helper is optional and environment-variable based.
- Planning and reranking are represented as textual skill/instruction files, not scripts or model-provider API calls.
- Optional upstream sources are represented as adapters or explicitly documented as intentionally deferred with a reason.
- TypeScript checks and tests pass if dependencies can be installed in the environment.
- `package.json` includes maintained SDK dependencies for provider-backed adapters where appropriate, or the final report justifies why a direct `fetch` implementation is safer for a given source.
- Live eval tests exist, can skip missing optional credentials cleanly, and write full output artifacts for agent review.
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
grep -RInE 'duckduckgo|DuckDuckGo|EXA_API_KEY|Exa' <downstream-dir>
grep -RInE 'yt-dlp|ytdlp' <downstream-dir>
```

Review every model-provider grep hit before finishing. It is acceptable for a key to appear when it unlocks one optional adapter; it is a violation if the README, setup helper, or orchestration makes that key globally required. Fix real violations and rerun verification until it passes.

## Final Report

Return:

- Output location.
- Upstream commit processed.
- Summary of the TypeScript project shape.
- Sources implemented, adapted, and intentionally deferred.
- API keys supported and what each unlocks.
- Verification commands run and results.
- Eval commands run, skipped evals with reasons, artifact locations, and the agent's judgment of output quality.
- SDKs/packages chosen for source adapters, plus any notable direct-HTTP choices and why they are acceptable.
- Any remaining uncertainty or behavior intentionally simplified from upstream.
