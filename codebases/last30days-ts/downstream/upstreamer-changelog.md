# Upstreamer Changelog

## June 2026 Sync

Upstream introduced a major wave of features across health classification, hiring signals analysis, keyless web fetch, CJK tokenization, source health probes, and many individual source-adapter improvements alongside infrastructure-only additions (MCP Go server, plugin packaging changes, CI expansions). The TypeScript downstream preserved the portable adapter behavior and dropped infrastructure-only changes per the rewrite contract.

- Added Hiring Signals analysis: the `--hiring-signals` flag with `--job-board` fetches public job postings from Greenhouse, Lever, and Ashby ATS APIs. It classifies hiring themes (enterprise readiness, go-to-market, AI/ML, infrastructure, product expansion, data/analytics), detects strategic/seniority roles, and infers company size from posting volume. Results appear in a dedicated section in both Markdown and compact output.
- Added Health source adapter backed by the MedlinePlus/NIH public API, usable without any API key. Health results flow through the same ranking and deduplication pipeline as other sources.
- Added keyless web fetch utility (`sources/web_fetch_keyless.ts`) that fetches URL content as markdown via the free Jina Reader API, available for adapters that need to enrich results with page content.
- Added `jobs` source for opt-in public job board searches via the `--hiring-signals` CLI flag. Jobs bypass date-windowing (open postings are current regardless of post date) and are deduplicated by exact URL only.
- Updated source quality weights to include Health (0.55) and Jobs (0.72) matching upstream signal quality calibration.
- Upstream introduced keyless web search, hiring signals engine, health classification, CJK tokenization, source health probes, HTML publishing, permission preflight, MCP server, and expanded CI workflows. The TypeScript downstream preserves the portable adapter behavior (hiring signals, health, keyless web fetch utility, improved error isolation) and drops infrastructure-only additions (MCP Go server, Python plugin packaging, CI changes, HTML publish, browser-cookie auth paths, and DuckDuckGo-based keyless web search per contract).

## Previous Sync

- Added Hiring Signals analysis: the `--hiring-signals` flag with `--job-board` fetches public job postings from Greenhouse, Lever, and Ashby ATS APIs. It classifies hiring themes (enterprise readiness, go-to-market, AI/ML, infrastructure, product expansion, data/analytics), detects strategic/seniority roles, and infers company size from posting volume. Results appear in a dedicated section in both Markdown and compact output.
- Added Health source adapter backed by the MedlinePlus/NIH public API, usable without any API key. Health results flow through the same ranking and deduplication pipeline as other sources.
- Added keyless web fetch utility (`sources/web_fetch_keyless.ts`) that fetches URL content as markdown via the free Jina Reader API, available for adapters that need to enrich results with page content.
- Added `jobs` source for opt-in public job board searches via the `--hiring-signals` CLI flag. Jobs bypass date-windowing (open postings are current regardless of post date) and are deduplicated by exact URL only.
- Updated source quality weights to include Health (0.55) and Jobs (0.72) matching upstream signal quality calibration.
- Upstream introduced keyless web search, hiring signals engine, health classification, CJK tokenization, source health probes, HTML publishing, permission preflight, MCP server, and expanded CI workflows. The TypeScript downstream preserves the portable adapter behavior (hiring signals, health, keyless web fetch utility, improved error isolation) and drops infrastructure-only additions (MCP Go server, Python plugin packaging, CI changes, HTML publish, browser-cookie auth paths, and DuckDuckGo-based keyless web search per contract).
