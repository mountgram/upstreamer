---
upstream: mvanhorn/last30days-skill
downstream: mountgram/last30days-ts
model: deepseek/deepseek-v4-pro
---

# Last30Days TS Rewrite Rules

Last30Days TS is a **self-contained installable agent skill with a bundled Bun/TypeScript research CLI** derived from `mvanhorn/last30days-skill`. It keeps the upstream idea - search recent public signals across the full upstream source set, rank them by freshness and engagement, and produce a concise brief - but packages the implementation inside the installed skill instead of requiring a separate npm package or global CLI.

This conversion should produce a fresh downstream repository, not a lightly edited copy of the upstream tree. Use the upstream project as source material for behavior and tests, then write an idiomatic TypeScript project with a simpler provider model.

The conversion is not complete when the code merely compiles. The agent doing the conversion must inspect the upstream behavior claims, port the implementation, write deterministic tests and live evals, execute the available evals, inspect the full generated output, and judge whether the downstream is actually useful in the way the upstream README makes it seem.

## Assumptions

- Local codebase name: `last30days-ts`.
- Downstream repo identity: `mountgram/last30days-ts`.
- The downstream is a Node.js TypeScript package, not a Python package and not a Claude/OpenClaw plugin bundle.
- The downstream must be installable as a skill with `npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream --skill last30days`. Installing the skill must bring the agent instructions, TypeScript source, package metadata, tests, `.env.example`, install reference, and planning/reranking references together in `skills/last30days/`. Live evals must stay outside the installed skill at `downstream/eval/`. Do not require a separate global npm package.
- The downstream should preserve the upstream source surface where practical, but each source must be independently optional at runtime.

## Philosophy

**Recent research, simple sources.**

- TypeScript first: source files should be `.ts`, built with Node's current TypeScript ecosystem.
- Sources are plug-ins: each source owns its own config and availability check.
- A global setup helper may exist, but it must be optional and should only collect environment variables for source-specific keys.
- API keys are optional source capabilities, not prerequisites for the whole tool or the higher-level orchestration.
- Web search must use reliable web APIs: prefer Exa via `EXA_API_KEY`, and support Brave via `BRAVE_API_KEY` as an alternative/fallback. Do not include DuckDuckGo; its unofficial scraping path is too unreliable for this downstream.
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

- A bundled `last30days` Bun script that accepts a topic and searches recent results from inside the installed skill directory.
- A library API that can be called from tests and other TypeScript code without shelling out.
- A normalized evidence item shape with source, title, URL, body/snippet, author/container, published date, engagement, and relevance metadata.
- A query plan shape with one or more subqueries and per-source selection.
- Planning, usage, and reranking guidance from upstream, rewritten as textual skill instructions rather than executable planner/reranker scripts.
- An installable primary skill at `skills/last30days/SKILL.md` that teaches agents how to install dependencies with Bun and use the bundled CLI/library from the installed skill directory.
- Date-window handling for the last 30 days, plus an explicit lookback option.
- Engagement-aware ranking and source-aware deduplication.
- Simple clustering or grouping for near-duplicate stories when the same story appears in multiple sources.
- Markdown output as the default human-readable format.
- JSON output for programmatic use.
- A concise README with install, configuration, source availability, and examples.
- A concise `upstreamer-changelog.md` with user-facing release-note style bullets describing upstream-driven downstream changes.
- A committed `.env.example` listing every supported optional key with empty values and comments that map each key to the adapter it unlocks.
- A committed `.gitignore` that ignores generated/local artifacts including `node_modules/`, `dist/`, `eval-output/`, and `.env`.
- The upstream MIT license.

## Sources to Implement

Port the upstream source surface into TypeScript adapters. The orchestrator should attempt the useful available sources for a topic, but no top-level pipeline path should require credentials for every source.

### Required Sources

- `exa` - preferred reliable web search enabled by `EXA_API_KEY`.
- `brave` - alternative/fallback web search enabled by `BRAVE_API_KEY`.

### Upstream Sources to Preserve

Create TypeScript source adapters for these upstream concepts where the upstream behavior can be reasonably represented:

- `reddit` - public Reddit JSON or other no-key public access where available.
- `hackernews` - public HN/Algolia APIs.
- `github` - unauthenticated GitHub API by default, optional `GITHUB_TOKEN` for higher rate limits.
- `polymarket` - public API where the upstream implementation can be carried over cleanly.
- `youtube` - required adapter using the same `yt-dlp` binary approach as upstream Last30Days for YouTube search/transcripts. If `yt-dlp` is missing, skip YouTube with a clear optional-dependency warning rather than failing the whole run.
- `x` - optional X/Twitter source backed only by the xAI/Grok API using `XAI_API_KEY` or `GROK_API_KEY`. Use the modern xAI model `grok-4.3` for this adapter unless the user explicitly selects a newer model. Implement X search from the official xAI docs at `https://docs.x.ai/developers/tools/x-search`: use the tool named `x_search`; do not invent or pass `search_parameters`. xAI's Responses API does not return top-level `tool_results`; parse the final `output_text` as strict JSON and use `usage.server_side_tool_usage_details.x_search_calls` only as diagnostics. The transformed downstream output must not include logged-in Twitter, browser cookies, session auth, cookie extraction, `AUTH_TOKEN`, or `CT0` in code, docs, `.env.example`, tests, evals, or user-facing reports.
- `tiktok`, `instagram`, `threads`, `pinterest`, `bluesky`, `truthsocial`, `xiaohongshu`, and `digg` - preserve as optional adapters when the upstream source has a clear API or command dependency.
- `brave`, `serper`, `parallel`, `perplexity`, and other grounded web/provider search paths - keep as optional web/search adapters, not as planner/model-provider requirements.

### Source Availability Rules

- Do not add a user-facing `--sources` selection flag as the primary interface.
- The default run should use a topic-aware set of available adapters.
- Missing optional keys or local tools should skip only the unavailable adapter, with a clear warning in debug/status output.
- A failure in one optional source must not fail the whole research run unless every useful source failed.
- The same run must be able to mix Exa-backed web search with no-key public sources such as Reddit, Hacker News, GitHub, Polymarket, YouTube, and Digg.
- If an internal source allowlist is needed for tests or debugging, keep it an internal/config-level mechanism rather than the main CLI contract.

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
- X/Twitter search through xAI/Grok API keys only. Do not preserve or document upstream's logged-in Twitter/cookie/session auth paths in the transformed codebase.
- Bluesky, Truth Social, TikTok, Instagram, Threads, Pinterest, Xiaohongshu, and XQuik auth flows where the upstream adapter can be ported cleanly

Drop or simplify these upstream paths when they only support model planning, packaging, provider upsell, or mandatory onboarding rather than source retrieval:

- OpenAI, Gemini, and xAI model provider routing for planning/reranking when it makes retrieval orchestration depend on model-provider keys
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
│       │   ├── planning.md
│       │   ├── reranking.md
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

The installable skill directory is the product. `npx skills add ... --skill last30days` must install the agent workflow and all runnable TypeScript sources together.

## What to Adapt

Adapt these upstream behaviors, not necessarily their exact implementations:

- CLI flags from `last30days.py` into a Bun-run TypeScript CLI inside `skills/last30days/scripts/last30days/src/`. Keep only flags that matter for the simplified downstream: topic, lookback days, depth/limit, output format, output directory, debug/status output, and web backend if needed.
- The upstream setup wizard into a TypeScript setup command or script that writes optional environment variables and reports adapter availability without pressuring the user through one preferred signup path.
- The upstream setup wizard into a TypeScript setup command or script that writes optional environment variables and reports adapter availability without pressuring the user through one preferred signup path. The setup helper may read from `.env` if a lightweight dependency is already justified, but direct environment variables and `.env.example` must remain clear enough to use without the helper.
- `schema.py` dataclasses into TypeScript interfaces or zod-style schemas. Prefer plain TypeScript interfaces unless validation is needed.
- Pipeline orchestration into a small async source runner that discovers available adapters and executes useful sources concurrently.
- Ranking into deterministic TypeScript functions that combine freshness, engagement, source quality, and text relevance.
- Upstream planning and reranking prompt logic into textual references inside the installed skill directory: `skills/last30days/references/planning.md` and `skills/last30days/references/reranking.md`. These files should instruct an agent how to form subqueries, choose useful source emphasis, judge relevance, and resolve ties. They should not call model APIs, require provider keys, or be implemented as scripts.
- The upstream user-facing Last30Days behavior into `skills/last30days/SKILL.md`. This skill must be useful after installing it into another project: it should explain triggers, Bun setup, bundled CLI invocation, source availability, `.env.example`, eval commands, output interpretation, and when to cite/run the tool before answering.
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
- Install and use source-specific packages where appropriate for APIs such as Exa, YouTube/`yt-dlp` wrapping, Reddit, GitHub, HN, OpenRouter/Perplexity, Brave, Serper, Parallel, ScrapeCreators, Bluesky/AT Protocol, or social/search providers.
- Prefer `exa-js` or the current official Exa SDK for Exa. Prefer the official OpenAI SDK for OpenRouter-compatible providers such as Perplexity/Sonar and xAI/Grok when the provider exposes an OpenAI-compatible API. For xAI/Grok, use `openai` with `baseURL: "https://api.x.ai/v1"` and `client.responses.create({ model: "grok-4.3", tools: [{ type: "x_search" }], ... })` unless the user explicitly selects a newer model. Follow `https://docs.x.ai/developers/tools/x-search`; the tool name is `x_search`, the adapter must not use a `search_parameters` field, and it must not look for top-level `tool_results`. Request strict JSON in the prompt and parse posts from `output_text`. Use `@ai-sdk/xai` with `ai` only if the downstream genuinely needs Vercel AI SDK abstractions; do not add it just to satisfy a dependency checklist.
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
- These tests must run without paid credentials or network access whenever practical.

### Live Evals

Add an eval suite under `eval/` or `test/eval/` that can run against live connections when credentials and local tools are available.

The eval suite must:

- Execute the built CLI or public library API on real research topics, not only mocked adapters.
- Include at least one Exa-backed web search eval that exercises the baseline search path.
- Document that copying `.env.example` to `.env` and filling source-specific keys enables stronger keyed eval coverage.
- Include keyed evals for available providers such as Exa, OpenRouter/Perplexity, Brave, Serper, Parallel, ScrapeCreators, GitHub token, Bluesky, or other configured source adapters. Skip a keyed eval with a clear reason when its env vars are absent; do not fail the whole suite for missing optional credentials.
- Use live model/provider connections only where they unlock a source adapter or a dedicated eval judge. Do not reintroduce model-provider keys as requirements for ordinary retrieval orchestration.
- Write full eval artifacts to an ignored output directory such as `eval-output/`: raw JSON brief, rendered Markdown brief, adapter status, warnings, and the exact command/options used.
- Include an agent-readable judgment file for each eval run that records whether the output is useful, recent, cited, source-diverse, non-fabricated, and consistent with the upstream README's promise.
- Keep live evals outside the installed skill directory at `downstream/eval/run.ts`. They are upstreamer/release QA, not customer-installed skill source.

The converting agent must run every eval that can run in the current environment. If optional credentials are unavailable, it must run the Exa-backed baseline eval when `EXA_API_KEY` is present and document skipped optional keyed evals. After running evals, inspect the full Markdown/JSON outputs, not just pass/fail status, and make a concrete quality judgment in the final report.

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
- `npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream --skill last30days` install command.
- A clear statement that installing the skill brings the Bun/TypeScript source, tests, package metadata, install reference, and docs with it, while maintainer live evals live outside the installed skill.
- Bun setup and usage commands from inside the installed skill directory.
- CLI examples using `bun run last30days -- ...`, including Exa-backed web search usage and a run that mixes Exa with available public/social adapters.
- A source matrix showing which sources need keys.
- The exact supported environment variables.
- A `.env.example` section explaining how to copy the installed skill's env example to `.env` for local evals without making any key globally required.
- A setup section explaining both direct environment-variable configuration and the optional setup helper.
- A note that planning and reranking guidance lives inside the installable skill directory, not provider-backed scripts.
- A section explaining that `skills/last30days/SKILL.md` is the installable agent-facing skill and that the skill directory is self-contained.
- A note that YouTube uses the same `yt-dlp` binary approach as upstream Last30Days.
- A short note that the project is derived from `mvanhorn/last30days-skill` and rewritten in TypeScript.

## Verification

Before finishing a conversion run, verify:

- The downstream output has `package.json`, `tsconfig.json`, `src/`, and `README.md`.
- The downstream output has `README.md`, `LICENSE`, `upstreamer-changelog.md`, and `skills/last30days/`.
- `skills/last30days/` has `SKILL.md`, `references/INSTALL.md`, `references/planning.md`, `references/reranking.md`, and `scripts/last30days/`.
- `skills/last30days/scripts/last30days/` has `package.json`, `bun.lock`, `tsconfig.json`, `.env.example`, `.gitignore`, `src/`, and `test/`.
- `downstream/eval/run.ts` exists and is not inside `skills/last30days/`.
- The installed skill's `.env.example` documents all supported optional keys without real secrets.
- The downstream root `.gitignore` ignores root `eval-output/`. The installed skill script package `.gitignore` ignores `node_modules/`, `dist/`, `output/`, and `.env`.
- The downstream output contains no `AUTH_TOKEN`, `CT0`, logged-in Twitter, cookie-based Twitter, or session-token X/Twitter setup in code, docs, env examples, tests, evals, generated artifacts, or reports.
- There are no Python source or packaging files.
- There is at least one TypeScript file under `skills/last30days/scripts/last30days/src/`.
- Exa is documented and implemented as the preferred reliable web search source.
- Brave is documented and implemented as an alternative/fallback reliable web search source.
- `EXA_API_KEY` controls only the Exa web search source.
- DuckDuckGo is not present in runtime code, README, skills, tests, or package dependencies.
- The README does not present any required primary API key.
- The orchestration can mix no-key and keyed sources in one run without requiring every source.
- YouTube is implemented through `yt-dlp` as an optional local binary dependency for that source.
- The setup helper is optional and environment-variable based.
- Planning and reranking are represented as textual files inside `skills/last30days/`, not scripts or model-provider API calls.
- `skills/last30days/SKILL.md` exists, is agent-facing, references `references/INSTALL.md`, and gives practical instructions for running `bun install`, `bun run setup`, and `bun run last30days -- ...` from `scripts/last30days/`.
- `upstreamer-changelog.md` exists and describes user-facing downstream changes without commit hashes, `.upstreamer/state.yaml`, verifier internals, or sync bookkeeping.
- Optional upstream sources are represented as adapters or explicitly documented as intentionally deferred with a reason.
- TypeScript checks and tests pass if dependencies can be installed in the environment.
- `skills/last30days/scripts/last30days/package.json` includes maintained SDK dependencies for provider-backed adapters where appropriate. The xAI/Grok X adapter may reuse the `openai` SDK against `https://api.x.ai/v1` instead of adding extra AI SDK dependencies.
- Hard-coded model identifiers are current for May 18 2026. The xAI/Grok X adapter uses `grok-4.3` with the `x_search` tool unless explicitly overridden by the user. The OpenRouter/Perplexity adapter should use `perplexity/sonar-pro` unless the user explicitly selects a newer model.
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
- Verification commands run and results.
- Eval commands run, skipped evals with reasons, artifact locations, and the agent's judgment of output quality.
- Qualitative eval result and `codebases/last30days-ts/.upstreamer/eval-report.md` path.
- SDKs/packages chosen for source adapters, plus any notable direct-HTTP choices and why they are acceptable.
- Summary added to `upstreamer-changelog.md`.
- Any remaining uncertainty or behavior intentionally simplified from upstream.
