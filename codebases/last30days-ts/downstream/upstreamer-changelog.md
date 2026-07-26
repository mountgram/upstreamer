# Upstreamer Changelog

## July 2026 Sync 3 (Incremental)

Upstream advanced from v3.16.0 to v3.18.0 with a redesigned discovery protocol: host-judged three-command discovery replaces the engine's LLM-based topic judging with a workflow where the agent model names topics, filters junk, scores worthiness, and writes content angles. The engine now runs deterministic heuristics only, with no LLM calls for topic naming or angle generation. Also added same-story deduplication in discovery results, a new `discovery_handoff` module for protocol state management between legs, and a configurable deep-tier enrichment budget. A new shared log module was added for engine diagnostic output.

The TypeScript downstream is unaffected by the discovery protocol changes — these are Python-engine orchestration features and the downstream's source SDKs and adapters remain stable. No source adapter behavior changed upstream in this window.

- No downstream source adapter changes needed; upstream source adapters were unchanged.
- All deterministic tests pass (68/68). Typecheck passes. Mechanical verification passes.
- Live evals skipped in CI due to missing API credentials; eval runner correctly reports missing keys.
- Qualitative eval returned PASS WITH WARNINGS due to credential-constrained CI environment.
- Upstream version bumped to 3.18.0.

## July 2026 Sync 2 (Incremental)

Upstream HEAD advanced through v3.9.0 to v3.16.0 with major new features: discovery mode (topic-less trending), drill follow-up, corpus for local files, YouTube comments via yt-dlp, Instagram comment enrichment, StockTwits trader sentiment, audience registers, freshness verification, library search/feed, doctor health audit, entity extraction, and Startpage web search fallback. The TypeScript downstream already had StockTwits from a prior run; this sync delivered YouTube/Instagram comment enrichment, a corpus source SDK, schema type updates with source outcomes and discovery types, and live eval improvements.

- Added **YouTube comment enrichment** via yt-dlp for the top N videos by engagement. Comments are fetched keyless through yt-dlp's write-comments extractor, sorted by top, and attached as `top_comments` in item metadata. A clean yt-dlp "no comments" result does not waste any API credit.
- Added **Instagram comment enrichment** via ScrapeCreators media info endpoint for the top posts by engagement. Comments include author, text, and like count, attached as `top_comments` in item metadata.
- Added **Corpus** source SDK for keyless local document search over registered directories. Scans `.md` and `.txt` files, computes token-overlap relevance, and returns typed `SourceItem` results with `local_only` metadata. Configurable via `CORPUS_DIRECTORIES` environment variable. Gated behind explicit directory registration — never scans without the user's knowledge.
- Updated **schema types** with `SourceOutcome` (per-source run state tracking), `FreshnessVerdict`, `LibraryContext`, `DiscoveryTopic`, `DiscoveryReport`, and `CorpusScanResult`. The `Report` interface now includes optional `source_status`, `freshness_verdicts`, `library_context`, and `drill_of` fields.
- Added **source outcome tracking** to the orchestrator: every source adapter now records its run state (ok, no-results, error, rate-limited, etc.) with item counts and optional diagnostic detail. Source failures remain isolated and do not break sibling adapters.
- Updated **public SDK exports**: `searchCorpus` and `corpusAvailable` are now importable from the SDK alongside the new schema types.
- Expanded the **intent-aware source selection** to include corpus in the always-available pool, enabling mixed-keyed-and-keyless corpus-augmented research runs.
- All deterministic tests pass (68/68). Typecheck passes. Mechanical verification passes (50/50 checks). Live evals demonstrate working all-time search and JSON output. Optional keyed-source evals produce results when API keys are available.

## July 2026 Sync (Incremental)

Upstream HEAD advanced to include arXiv, Techmeme, Trustpilot, and LinkedIn sources; Reddit free-discovery and arctic-shift improvements; renderer-aware citations fix; LinkedIn ScrapeCreators integration; and infrastructure/non-portable changes (plugin packaging, CI, Codex auth pruning, cookie extraction). The downstream already had arXiv, Techmeme, Trustpilot, and LinkedIn adapters from prior runs. This sync delivered contract-compliance fixes and a new xiaohongshu adapter.

- Added **Xiaohongshu** (RED) source adapter via the `xpzouying/xiaohongshu-mcp` REST API. Supports Chinese count suffixes (万/亿), engagement-weighted relevance scoring, and login-status precheck. Requires `XIAOHONGSHU_API_URL` or `APIFY_API_TOKEN`. Accessible as `searchXiaohongshu()` via SDK import.
- Updated **X/Twitter** source to use both `x_search` and `web_search` tools in the xAI/Grok Responses API, enabling broader web grounding alongside X post search as required by the contract.
- Fixed a **CLI bug** where `--timeframe all` was ignored when an explicit `--lookback` wasn't passed. Now all-time search correctly activates the SDK's 3650-day default, producing results spanning the full window rather than only 30 days.
- Added **all-time search eval** to the live eval suite, verifying that `--timeframe all` produces a 3650-day date span with real cited results.
- Added **deterministic tests** for the xAI/X adapter covering JSON parsing, date normalization, output text extraction, status ID extraction, and keyless-behavior.
- Fixed **Perplexity source label** in rendered output from generic "Web" to "Perplexity" so users can distinguish Perplexity-sourced results from other web search providers.
- All live evals pass: web search (Exa), JSON output, all-time search, X/Twitter (xAI), and Brave produce well-structured cited results. Perplexity/Sonar remains an expensive opt-in source; its eval warns when the underlying provider returns no inspectable items.

## July 2026 Sync (Full)

Upstream added arXiv (research papers), Techmeme (tech news headlines), Trustpilot (brand sentiment) as default-on CLI-gated sources, plus LinkedIn (post search + article enrichment) as a ScrapeCreators-backed social adapter. The engine also received CJK tokenization, permission preflight, and many individual source-adapter improvements.

Upstream added arXiv (research papers), Techmeme (tech news headlines), Trustpilot (brand sentiment) as default-on CLI-gated sources, plus LinkedIn (post search + article enrichment) as a ScrapeCreators-backed social adapter. The engine also received CJK tokenization, permission preflight, and many individual source-adapter improvements.

- Added **arXiv** source adapter via `arxiv-pp-cli` for research paper search with relevance sort and 365-day recency window. Accessible as `searchArxiv()` via SDK import.
- Added **Techmeme** source adapter via `techmeme-pp-cli` for current tech news headlines with one-time-per-run cache sync.
- Added **Trustpilot** source adapter via `trustpilot-pp-cli` for brand reputation and sentiment. Gated on brand-shaped topics (domain tokens or short capitalized proper nouns); configurable with `LAST30DAYS_TRUSTPILOT_NO_BROWSER` for headless/CI mode.
- Added **LinkedIn** source adapter via ScrapeCreators API for public LinkedIn post search. Person topics with a matching author also enrich results with LinkedIn Pulse articles; use the new browser-research guidance as a companion step when LinkedIn identity, visible profile context, exact post text, or public page verification matters.
- Added reference docs for `comparison-search.md`, `all-time-search.md`, `browser-research.md`, and `source-sdk-guide.md` in the installed skill references directory, making planning, comparison, all-time, optional browser verification, and SDK import guidance available as frontmatter-formatted markdown.
- Added **OpenAI Web** source adapter for Responses API web-search grounding, preferred over Perplexity/Sonar for LLM-grounded web search when `OPENAI_API_KEY` is available.
- Added **Gemini YouTube** and **Gemini Maps** source adapters. Gemini YouTube combines `yt-dlp` discovery with Gemini video understanding; Gemini Maps handles spatial/place questions such as "what's around London?" through Maps grounding.
- Updated `.env.example` with Trustpilot opt-out variable, OpenAI/Gemini keys, CLI binary path notes for printing-press-library tools, and LinkedIn under ScrapeCreators. Setup docs now call out explicitly loading a repo-root `.env` before running commands from the installed skill directory.
- Updated source quality weights in ranking to match downstream source priorities: arXiv 0.90, Techmeme 0.85, Trustpilot 0.78, LinkedIn 0.72, OpenAI Web 0.86, Gemini YouTube/Maps 0.82, and Perplexity/Sonar downweighted to 0.72 because it is expensive opt-in.
- Expanded source coverage across web search, OpenAI Web, Serper, Parallel, Reddit, Hacker News, GitHub, Polymarket, X/Grok, YouTube, Gemini YouTube, Gemini Maps, Perplexity, TikTok, Instagram, Threads, Pinterest, LinkedIn, Bluesky, Truth Social, Digg, arXiv, Techmeme, Trustpilot, Health, Jobs, Weather, and keyless web fetch support.
- Reoriented the installed skill around source access first: agents now get a source map for web/news, social/community, jobs, stocks/markets, weather, maps, video, health, research, and browser-backed dynamic pages before reaching for the combined brief workflow.
- Added a keyless Weather source backed by Open-Meteo, with direct CLI/SDK access for current conditions and short forecasts.
- Clarified that ranking, reranking, clustering, parsing, and Markdown synthesis are optional processing layers over fetched evidence rather than the only way to use the skill.

## June 2026 Sync

Upstream introduced a major wave of features across health classification, hiring signals analysis, keyless web fetch, CJK tokenization, source health probes, and many individual source-adapter improvements alongside infrastructure-only additions (MCP Go server, plugin packaging changes, CI expansions). The TypeScript downstream preserved the portable adapter behavior and dropped infrastructure-only changes per the rewrite contract.

- Added Hiring Signals analysis: the `--hiring-signals` flag with `--job-board` fetches public job postings from Greenhouse, Lever, and Ashby ATS APIs. It classifies hiring themes (enterprise readiness, go-to-market, AI/ML, infrastructure, product expansion, data/analytics), detects strategic/seniority roles, and infers company size from posting volume. Results appear in a dedicated section in both Markdown and compact output.
- Added Health source adapter backed by the MedlinePlus/NIH public API, usable without any API key. Health results flow through the same ranking and deduplication pipeline as other sources.
- Added keyless web fetch utility (`sources/web_fetch_keyless.ts`) that fetches URL content as markdown via the free Jina Reader API, available for adapters that need to enrich results with page content.
- Added `jobs` source for opt-in public job board searches via the `--hiring-signals` CLI flag. Jobs bypass date-windowing (open postings are current regardless of post date) and are deduplicated by exact URL only.
- Updated source quality weights to include Health (0.55) and Jobs (0.72) matching upstream signal quality calibration.
- Upstream introduced keyless web search, hiring signals engine, health classification, CJK tokenization, source health probes, HTML publishing, permission preflight, MCP server, and expanded CI workflows. The TypeScript downstream preserves the portable adapter behavior (hiring signals, health, keyless web fetch utility, improved error isolation) and drops infrastructure-only additions (MCP Go server, Python plugin packaging, CI changes, HTML publish, browser-cookie auth paths, and DuckDuckGo-based keyless web search per contract).
