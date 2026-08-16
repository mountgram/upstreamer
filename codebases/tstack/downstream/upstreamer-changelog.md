# Upstreamer Changelog

## Latest Sync

- `ship` gained an App Store release path. When the repo is an Apple app (`.xcodeproj`/`.xcworkspace`/Swift package) and the ask is store distribution, ship now routes to a fastlane adapter (`produce`/`cert`/`sigh`/`gym`/`pilot`/`deliver`/`frameit`) with a two-permitted-interactions model, release preflight, store-assets handling, idempotent archive-and-upload, and an ordered upload-auth escalation. Also added a GitHub REST fallback for PR-body edits when `gh pr edit` hits the GraphQL deprecation.
- `codex` review mode now enforces a fail-closed gate: non-zero exit, empty output, P0/P1 findings, and untagged output all fail; PASS is only reachable via a completed, tagged, P2-only review. The skill now documents that scope flags (`--base`/`--commit`/`--uncommitted`) are mutually exclusive with the prompt argument, pins the review sandbox read-only, and handles `-m` flag translation and HTTP 400 model-not-supported recovery. Worked `Recommendation:` examples added per mode.
- `qa` test-framework detection was rewritten around evidence, not guesses: read CLAUDE.md/TESTING.md first, treat ecosystem markers as evidence for the command you offer, detect existing tests via `git ls-files` and Rust in-source `#[test]`, and recognize that absent config files are not evidence of no tests. A compact bootstrap flow (research → select → install → first tests → verify → CI → TESTING.md → CLAUDE.md → commit) now covers genuinely untested projects.
- `land-and-deploy` gained a squash/rebase merge readback guard: treat a `MERGED` state with a non-null merge commit as authoritative rather than requiring the PR head SHA to be an ancestor of the base branch.
- `plan-design-review` and `plan-eng-review` scope gates now auto-select the active plan in plan mode and honor an explicitly user-named target, without weakening the hard-STOP gate otherwise.
- `autoplan` now skips each loaded review skill's scope gate (its intake already fixes the target) and documents that subagent calls must pass `run_in_background: false` explicitly.

## Earlier

- `ios-qa` refreshed to match the `// @Snapshotable` generator marker workflow and the current DebugBridge wiring pattern; failure-modes table updated.
- `ios-clean` restored the 3-phase Inventory / Remove / Verify model and the current `// @Snapshotable` marker format.
- `ios-sync` remains dropped: its core workflow depends on a codegen binary specific to the upstream toolchain.
