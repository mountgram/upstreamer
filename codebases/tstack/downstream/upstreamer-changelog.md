# Upstreamer Changelog

## Latest Sync

- Refreshed most skills against a large upstream wave that reorganized skill content into portable workflow sections. Downstream skills were rewritten in place to fold the new portable material into their existing TStack voice.
- `spec` gained the quality-gate and filing mechanics as a generic workflow: issue dedupe via `gh issue list`, a manual secrets/PII re-scan before filing to a public issue, an optional second-model executability score via `codex exec`, and a file → local archive → optional agent spawn sequence with a dirty-worktree gate.
- `review` and `ship` gained new sections: adversarial second-model review, multi-specialist "review army" coordination, plan-completion gates, test-coverage audit, and an Apple App Store/TestFlight release path.
- `autoplan` now documents the full review pipeline ordering (eng review runs last), the six auto-decide principles, CEO step 0 premise/leverage/dream-state exercises, and the expanded final approval gate.
- `cso` expanded to cover LLM/agentic and skill-supply-chain attack surfaces, OWASP Top 10:2025 and ASVS oracles, webhooks/API/OAuth, and an evidence rubric with severity/confidence/evidence as separate judgments.
- `land-and-deploy` gained a first-run dry-run validation, an expanded readiness gate with review-staleness checks, and merge-method/merge-queue/staging-first handling.
- `codex` now spells out fail-closed gate semantics (exit code / empty output / critical / untagged / pass) and per-mode reasoning-effort guidance.
- `qa` and `qa-only` gained framework-specific guidance, an issue taxonomy, a weighted health rubric, and test-framework bootstrap steps; `canary` gained console-error and broken-link evidence tiers and pending→confirmed alert semantics.
- `office-hours` gained Phase 2A/2B startup-diagnostic vs builder-brainstorm structure and richer pushback/anti-sycophancy guidance.
- `design-consultation`, `design-html`, `design-shotgun`, and `design-review` gained anti-slop doctrine, standard-CSS "text that reflows correctly" guidance, and fuller checklists while continuing to omit external design binaries.
- `health`, `investigate`, `document-release`, `setup-deploy`, `careful`, and `freeze` gained smaller refinements: capture-failure handling, sanitize-before-search, `git merge-base` resolution, detection-is-a-hint platform confirmation, a hard-deny tier for catastrophic destructive commands, and fail-closed boundary logic.
- `freeze`/`guard`/`unfreeze` boundary state file path is now consistent, so the boundary pair interoperates regardless of `TMPDIR`.
- `hackernews-frontpage` README description corrected to reflect its primary structured-JSON extraction task.
- `ios-qa` now notes that the DebugBridge package and Mac-side daemon are a protocol supplied by the app-under-test toolchain, not shipped by TStack.
- `ios-sync` remains dropped: its workflow still depends on a codegen binary specific to the upstream toolchain.
- All 36 skills remain pure markdown with no helper scripts, binaries, usage tracking, or upstream branding.

## Prior Sync

- Initial markdown-only conversion of the upstream skill collection into 36 single-file skills, with `ios-sync` dropped as codegen-dependent and three contract-backed reductions (design-html, design-shotgun, spec) noted for external binary dependencies.
