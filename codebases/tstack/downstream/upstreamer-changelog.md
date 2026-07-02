# Upstreamer Changelog

## Latest Sync

- Added Scope gate to `plan-design-review` and `plan-eng-review`: a hard-STOP AskUserQuestion gate that confirms the review target before any tool calls run. Includes plain-prose fallback for environments without interactive prompts.
- Evaluated six new upstream skills (diagram, pair-agent, plan-tune, skillify, landing-report, learn) — all dropped because they require upstream-only infrastructure (headless browser daemon, question-tuning engine, browser-skill SDK, workspace-aware version queue, session-based context store) that cannot be replaced with standard commands.
- The upstream diff was overwhelmingly infrastructure additions (browser daemon, design tooling, dual-model orchestration, credential scanning, version-bump CLI) with no portable workflow improvements for most skills.
- Rewrote `hackernews-frontpage` to restore the structured JSON scraping task (rank, title, URL, points, comments) with optional theme summary. The prior version had collapsed the data-retrieval task into a generic summary prompt.
- 36 skills remain: all single-file `SKILL.md` directories with no helper binaries, generated templates, package manager files, or host-specific setup.
