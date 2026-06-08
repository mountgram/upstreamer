# Upstreamer Changelog

## Latest Sync

- Added a Digg source adapter so the TypeScript package represents another upstream-supported no-key/local-tool source.
- Strengthened Reddit coverage with JSON search, RSS fallback, subreddit targeting, deduplication, engagement ordering, and lightweight comment enrichment.
- Expanded GitHub search behavior and CLI/library wiring so person- or repository-focused research works better from TypeScript.
- Updated setup/docs/tests for the new optional source behavior while preserving the no-key baseline and source-scoped configuration model.
- Kept upstream plugin packaging, Python runtime code, historical docs, and removed auth/session mechanisms out of the downstream because they do not fit the TypeScript CLI/library contract.
