# Upstreamer Changelog

## Latest Sync

- Fixed the X/Grok adapter: xAI `x_search` results are returned through the final `output_text`, not top-level `tool_results`, so the adapter now requests and parses strict JSON posts.
- Removed DuckDuckGo from the downstream and made Exa the preferred reliable web-search path, with Brave as an alternative/fallback when `BRAVE_API_KEY` is present.
- Improved live eval behavior: baseline Exa web-search evals are separated from optional keyed-source evals, optional keyed-source failures report as warnings, zero-item outputs fail eval, and compact evidence includes dates.
- Tuned Exa-backed planning and relevance pruning so TypeScript compiler evals use stronger source fallbacks and drop off-topic items that only match incidental date/version terms.
- Fixed `.env` parsing so quoted optional API keys, including `GROK_API_KEY`, are passed to adapters without surrounding quote characters.
- Added a Digg source adapter so the TypeScript package represents another upstream-supported no-key/local-tool source.
- Strengthened Reddit coverage with JSON search, RSS fallback, subreddit targeting, deduplication, engagement ordering, and lightweight comment enrichment.
- Expanded GitHub search behavior and CLI/library wiring so person- or repository-focused research works better from TypeScript.
- Updated setup/docs/tests for the new optional source behavior while preserving the no-key baseline and source-scoped configuration model.
- Kept upstream plugin packaging, Python runtime code, historical docs, and removed auth/session mechanisms out of the downstream because they do not fit the TypeScript CLI/library contract.
