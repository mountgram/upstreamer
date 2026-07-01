# Last30Days TS Internet Search SDK Conversion Eval

Run this eval after mechanical verification passes. Use a fresh review context or subagent so the evaluator is not biased by the converter's own reasoning.

## Goal

Judge whether the generated Last30Days TS downstream is a useful TypeScript internet-search SDK and CLI that preserves the upstream promise: public-signal research across multiple optional sources, source-aware ranking, citations, and concise briefs without all-or-nothing setup. The downstream may default to recent research, but it must also support all-time searches and direct source SDK imports.

This is not a shell-script check. It is a product and behavior eval for a busy engineer deciding whether the conversion is good enough to ship.

## Inputs

- Contract: `codebases/last30days-ts/upstreamer.md`
- Downstream: `codebases/last30days-ts/downstream/`
- Upstream checkout: `tmp/upstreamer/last30days-ts/upstream/`
- Upstream README: `tmp/upstreamer/last30days-ts/upstream/README.md`
- Upstream skill: `tmp/upstreamer/last30days-ts/upstream/skills/last30days/SKILL.md`
- Downstream eval runner: `codebases/last30days-ts/downstream/eval/run.ts`
- Downstream eval artifacts: `codebases/last30days-ts/downstream/eval-output/` when present

## Review Method

1. Read the contract first, then the upstream README and upstream skill.
2. Inspect the downstream README, `skills/last30days/SKILL.md`, bundled source SDKs, CLI/library API, tests, evals, and frontmatter-formatted support docs under `skills/last30days/references/`.
3. Prefer actual commands and generated artifacts when available: from `skills/last30days/scripts/last30days/`, run `bun install`, `bun run typecheck`, `bun run test`, `bun run build`; run live evals with `bunx tsx ../../../../eval/run.ts`; inspect files under `eval-output/` at the downstream root.
4. If commands were already run in the conversion log, inspect their artifacts instead of rerunning expensive live evals unless the artifacts are missing or stale.
5. Judge whether the downstream would help a user find interesting things on the internet without hidden credentials or Python/plugin setup, both for recent topics and all-time/reference topics.

## Required Qualities

The downstream should satisfy these product-level requirements:

- Exa-backed web search works or Brave-backed web search works as a fallback, credibly demonstrated through eval artifacts.
- Optional keyed sources are source-scoped. Missing keys skip only their adapters and do not break the whole run.
- Source coverage reflects the upstream surface where practical, with explicit deferrals where a source cannot be reasonably ported.
- The TypeScript library API is usable without shelling out and exposes structured results.
- Every retained source is presented as a usable TypeScript source SDK with typed options/results, source availability/status behavior, tests, and either public exports or documented import paths.
- The CLI and SDK support `timeframe: "all"` or `--timeframe all` and do not claim all results are from the last 30 days when all-time search is selected.
- The CLI output is concise, cited, recent, and readable.
- All-time output is concise, cited, timeframe-accurate, and readable.
- JSON output is available for programmatic use.
- Ranking combines freshness, relevance, engagement, source quality, and deduplication enough to avoid low-signal dumps.
- The README and installable skill explain that installing the skill brings the bundled Bun/TypeScript implementation, source SDKs, how to run it from the installed skill directory, how to import it, how to configure optional sources, and how to interpret warnings. Maintainer live evals stay outside the installed skill.
- `SKILL.md` and every `references/*.md` file has YAML frontmatter with a useful description. References include practical docs for install/setup, planning, reranking, comparison search, all-time search, and source SDK usage.
- Browser research guidance is present as frontmatter-formatted markdown. It explains when to use available browser automation for dynamic or identity-sensitive sources such as LinkedIn, X pages, company pages, review sites, and source verification, while making clear that browser tools are optional companions and not bundled dependencies.
- OpenAI web grounding and Gemini YouTube/Maps grounding are documented as optional source SDKs. Perplexity/Sonar is documented and implemented as expensive opt-in, not a default source merely because `OPENROUTER_API_KEY` exists.
- Setup docs explain repo-root `.env` handling for installed skill commands, and the SDK docs encourage one-off TypeScript/JavaScript scripts for custom parsing and output shaping.
- Python runtime, plugin packaging, logged-in Twitter/session-cookie auth, and provider upsell flows stay removed.
- Live eval outputs are inspected for actual usefulness, not treated as passing just because a command exited successfully.

## Failure Conditions

Return `FAIL` if any of these are true:

- The downstream compiles but cannot demonstrate a useful Exa-backed or Brave-backed web search run.
- A missing optional key or local tool can fail the whole pipeline instead of skipping its adapter.
- The README or skill implies a global required API key.
- The package is only a CLI script and does not expose usable SDK imports for orchestration and retained sources.
- All-time search is absent, ignored, or still described as "last 30 days" in outputs.
- Source adapters are stubs that return placeholders rather than real or testable source items.
- `SKILL.md` or reference markdown lacks frontmatter, or expected references such as comparison search, all-time search, and source SDK guidance are missing.
- Browser-research guidance is absent, implies a required browser dependency, or encourages bypassing access controls/paywalls/private content.
- Perplexity/Sonar is included by default, presented as the preferred grounded web path, or lacks cost/opt-in warnings.
- OpenAI/Gemini source guidance disappears despite the contract requiring those source-specific SDKs.
- Setup docs omit repo-root `.env` handling or discourage one-off SDK scripts for custom parsing.
- Citations, dates, or source metadata are missing enough that output cannot be trusted.
- Eval artifacts show generic, stale, uncited, duplicate-heavy, or fabricated-looking results.
- The installed skill lacks the bundled TypeScript source, package metadata, tests, install reference, or `.env.example` needed to run independently.
- Python files, Python packaging, plugin packaging, or removed Twitter cookie/session auth reappear.
- The downstream claims support for a source but the implementation is absent and no explicit deferral explains why.

Optional keyed-source failures are warnings, not automatic failures, when the failure is isolated to that adapter, the Exa/Brave web-search baseline still works, and the output clearly reports the unavailable source. This includes missing, expired, invalid, or rate-limited credentials for X/Grok, OpenRouter/Perplexity, Serper, Parallel, ScrapeCreators, Bluesky, or similar optional adapters.

Return `PASS WITH WARNINGS` when the downstream is useful but some optional source coverage, live-provider eval, or output quality is limited by missing credentials, invalid credentials, rate limits, or external service behavior.

Return `FAIL` for keyed paths only when an optional-source failure breaks the whole run, is hidden from the user, contaminates unrelated sources, or the README/eval claims the keyed path passed when it did not.

Return `PASS` only when the Exa-backed or Brave-backed web search path, all-time search behavior, importable SDK behavior, browser-research guidance, OpenAI/Gemini provider strategy, Perplexity/Sonar cost controls, frontmatter references, and representative optional-source behavior are useful, documented, and consistent with the contract.

## High-Risk Areas

Review these closely:

- `skills/last30days/scripts/last30days/package.json`, `src/index.ts`, and `src/cli.ts`: package exports, orchestration, source availability, failure isolation, timeframe/all-time handling, JSON/Markdown output, and library API shape.
- `skills/last30days/scripts/last30days/src/sources/`: adapters should be independently importable optional source SDKs and should not contain placeholder-only behavior for claimed support.
- `skills/last30days/scripts/last30days/src/sources/x.ts`: X/Twitter support must use xAI/Grok-style API keys only, must use `x_search` and `web_search` as Responses API tools where appropriate, and must not mention or depend on logged-in Twitter cookies, `AUTH_TOKEN`, or `CT0`.
- `skills/last30days/scripts/last30days/src/sources/openai_web.ts`, `gemini_youtube.ts`, `gemini_maps.ts`, and `perplexity.ts`: OpenAI/Gemini should be optional source SDKs; Perplexity/Sonar should be opt-in only and clearly documented as expensive.
- `skills/last30days/scripts/last30days/src/sources/reddit.ts`, `github.ts`, `digg.ts`, `youtube.ts`, and web-search adapters: these should preserve meaningful upstream source behavior where practical.
- `skills/last30days/SKILL.md`: should teach another agent when to use the tool, run `bun install`, run bundled command examples, understand source warnings, run eval commands, and cite output.
- `skills/last30days/references/*.md`: should have YAML frontmatter and practical references for install/setup, planning, reranking, comparison search, all-time search, browser research, and source SDK usage.
- `README.md` and `skills/last30days/.env.example`: should make Exa/Brave web search setup obvious and keep other keys optional and source-scoped.
- `eval/run.ts` and root `eval-output/`: should prove the tool produces recent and all-time cited, source-diverse, non-placeholder output without bundling eval code or artifacts into the installed skill.

## Output Format

Return:

```markdown
# Last30Days TS Eval Result: PASS | PASS WITH WARNINGS | FAIL

## Summary

- [At-a-glance judgment for a busy engineer]

## Findings

1. [Severity] [area] [problem]
Evidence: [downstream path, upstream path, command output, or eval artifact]
Why it matters: [user-visible behavior or contract risk]
Required fix: [specific downstream/contract change]

## Sampled Areas

- `area`: PASS | WARNING | FAIL - [one-line reason]

## Eval Artifacts Reviewed

- [artifact or command reviewed]

## Recommendation

- Accept the conversion, accept with follow-up, or block state update.
```
