---
name: ship
description: |
  Ship workflow: detect + merge base branch, run tests, review diff, bump VERSION,
  update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy",
  "push to main", "merge and push", "create a PR", or "get it deployed".
  Proactively invoke when code is ready.
triggers:
  - ship it
  - create a pr
  - push to main
  - deploy this
  - merge and push
---

# Ship: Release Checklist

You are running the ship workflow. This is a non-interactive, fully automated workflow. Do NOT ask for confirmation at each step. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved
- In-branch test failures
- Pre-landing review finds ASK items requiring user judgment
- MINOR or MAJOR version bump needed (ask)

**Never stop for:**
- Uncommitted changes (always include them)
- Version bump choice (auto-pick PATCH)
- CHANGELOG content (auto-generate from diff)
- Commit message approval

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime. Lead with the point. Be concrete. Name files, functions, line numbers, commands, and real numbers. Be direct about quality. No em dashes. No AI vocabulary.

## Step 0.9: Apple target detection

Shipping to the App Store is not landing a PR. If the repository contains an `.xcodeproj`, `.xcworkspace`, or a Swift package with an app product AND the user's ask is store distribution (App Store, TestFlight, "release my app"), **STOP and follow the Apple release path below** — before the branch gate and any preflight. Store distribution proceeds from whatever branch the user is on (a clean tree on the base branch is the solo developer's normal case, not an error). The branch gate and repository-landing pipeline below apply ONLY to repository-landing asks, including on Apple repos.

## Step 1: Pre-flight

1. Check the current branch. If on the base branch, **abort**: "You're on the base branch. Ship from a feature branch."

2. Gather context:

```bash
git status
git diff <base>...HEAD --stat
git log <base>..HEAD --oneline
```

3. Check for uncommitted changes — always include them, no need to ask.

4. Check for TODOs that would block shipping:

```bash
grep -r "TODO\|FIXME\|HACK" --include="*.ts" --include="*.js" --include="*.rb" --include="*.py" --include="*.go" . | grep -v node_modules | head -20
```

## Step 2: Distribution Pipeline Check

If the diff introduces a new standalone artifact (CLI binary, library package, tool), verify that a distribution pipeline exists:

```bash
git diff origin/<base> --name-only | grep -E '(cmd/.*/main\.go|bin/|Cargo\.toml|setup\.py|package\.json)' | head -5
ls .github/workflows/ 2>/dev/null | grep -iE 'release|publish|dist'
```

If no release pipeline exists and a new artifact was added, flag it.

## Step 3: Merge Base Branch

Fetch and merge the base branch so tests run against the merged state:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

**If there are merge conflicts:** Try to auto-resolve if simple (VERSION, CHANGELOG ordering). If conflicts are complex or ambiguous, **STOP** and show them.

**If already up to date:** Continue silently.

## Step 4: Detect and Run Tests

Detect the test framework:

```bash
[ -f package.json ] && grep -q '"test"' package.json && echo "TEST: npm test"
[ -f pyproject.toml ] && grep -q "pytest" pyproject.toml && echo "TEST: pytest"
[ -f Cargo.toml ] && echo "TEST: cargo test"
[ -f go.mod ] && echo "TEST: go test ./..."
[ -f Gemfile ] && echo "TEST: bundle exec rake test"
```

Run the detected test command. Run independent suites in parallel when possible; record each lane's command, exit code, and a summary so the verification gate (Step 12) can cite fresh evidence.

**If any test fails:** Apply test-failure ownership triage. Check whether the failing test files were modified on this branch:

```bash
git diff origin/<base>...HEAD --name-only
```

- **In-branch failures:** **STOP.** Fix your broken tests before shipping.
- **Pre-existing failures:** Flag them but they do not block shipping unless critical.

**If all pass:** Continue — note the counts briefly.

## Step 5: Eval Suites (conditional)

Evals are mandatory when prompt-related files change. Skip this step entirely if no prompt files are in the diff.

```bash
git diff origin/<base> --name-only
```

Match against prompt-related patterns (prompt builders, generation/scoring services, system prompts, eval infrastructure). If no matches: "No prompt-related files changed — skipping evals." If prompts changed but no eval command is documented, report the missing validation and ask before shipping; never silently treat that as no affected prompts. Run the affected suites with the project's documented eval command. If any eval fails, show the failures and **STOP**. Include eval results in the PR body.

## Step 6: Test Coverage Audit

**Dispatch this step as a subagent** (fresh context) and instruct it:

> Run `git diff <base>...HEAD` and audit whether new/changed code paths have test coverage. Report gaps and a list of missing tests. After analysis, output a single JSON object on the LAST line: `{"coverage_pct":N,"gaps":N,"diagram":"<markdown coverage diagram for the PR body>","tests_added":["path",...]}`. Use null (not zero) for an undetermined percentage.

Parse the LAST line as JSON. Embed `diagram` in the PR body's `## Test Coverage` section. Print a one-line summary: `Coverage: {coverage_pct}%, {gaps} gaps. {tests_added.length} tests added.`

If the subagent fails or returns invalid JSON, fall back to running the audit inline. Partial results are better than none.

## Step 7: Plan Completion Audit

**Dispatch this step as a subagent** (fresh context) and instruct it:

> Run `git diff <base>...HEAD`. Discover a plan file (search `$HOME/.claude/plans`, `$HOME/.codex/plans`, and the repo root for `.md` files matching this branch or repo name), extract its actionable items, and classify each against the diff as DONE / PARTIAL / NOT DONE / CHANGED / UNVERIFIABLE. Do not commit, push, or ask the user. After analysis, output a single JSON object on the LAST line: `{"total_items":N,"done":N,"changed":N,"partial":N,"not_done":N,"unverifiable":N,"summary":"<markdown checklist for the PR body>"}`. No plan or no actionable items means all counts zero with the skip reason in summary.

Parse the LAST line as JSON. Store counts; embed `summary` in the PR body's `## Plan Completion` section.

**Gate logic:** For any `not_done` or `unverifiable` item, AskUserQuestion: A) Stop and implement, B) Ship anyway + create P1 TODOs, C) Intentionally dropped. `partial` items get a PR note, not the gate.

If the subagent fails or returns invalid JSON, run the audit inline. If the inline fallback also fails, surface an explicit AskUserQuestion: "Plan Completion audit could not run ({reason}). (A) Skip audit and ship anyway, (B) Stop and fix." Default to (B) — never silently fail open.

## Step 8: Pre-Landing Review (with specialist dispatch)

Review the diff for structural issues tests don't catch:

```bash
git diff origin/<base>
```

### Confidence calibration

Every finding includes a confidence score (1-10):

| Score | Meaning | Display rule |
|-------|---------|-------------|
| 9-10 | Verified by reading specific code | Show normally |
| 7-8 | High confidence pattern match | Show normally |
| 5-6 | Moderate, could be false positive | Show with caveat |
| 3-4 | Low confidence | Suppress from main report |
| 1-2 | Speculation | Only if severity P0 |

### Checklist pass (two passes)

- **Pass 1 (CRITICAL):** SQL & Data Safety (injection, missing WHERE, unsafe migrations), LLM Output Trust Boundary (unvalidated LLM output before DB write/file/exec), Race Conditions & Concurrency, Shell Injection, Enum & Value Completeness.
- **Pass 2 (INFORMATIONAL):** Async/Sync Mixing, Type Coercion, Time Window Safety, Completeness Gaps, Distribution & CI/CD, Documentation staleness.

### Specialist dispatch (parallel subagents)

For diffs of 50+ lines, dispatch specialist reviewers in parallel (each a fresh-context subagent). Always-on: **testing**, **maintainability**. Conditional: **security** (auth or large backend changes), **performance** (backend/frontend), **data-migration** (migrations), **API contract** (API changes), **design** (frontend changes), **simplification** (100+ lines — hunts unrequested structure, advisory only). For diffs under 50 lines, skip specialists.

Each specialist prompt includes stack context, the specialist's checklist categories, and the instruction to run `DIFF_BASE=$(git merge-base origin/<base> HEAD) && git diff "$DIFF_BASE"` and output findings as JSON per line: `{"severity":"CRITICAL|INFORMATIONAL","confidence":N,"path":"file","line":N,"category":"...","summary":"...","fix":"...","specialist":"name"}`. `NO FINDINGS` if clean.

### Merge and deduplicate

Fingerprint each finding as `path:line:category`. Findings sharing a fingerprint across specialists keep the highest-confidence one, tag it "MULTI-SPECIALIST CONFIRMED", and boost confidence by +1 (cap 10). Compute the PR Quality Score over non-advisory findings: `quality_score = max(0, 10 - (critical_count * 2 + informational_count * 0.5))`. Advisory (simplification) findings are excluded from the score and are ASK-only, never auto-applied.

### Fix-First flow

Classify each finding as **AUTO-FIX** or **ASK**:
- **AUTO-FIX:** apply directly. Output `[AUTO-FIXED] [file:line] Problem → what you did`.
- **ASK:** batch into one AskUserQuestion (list each with number, severity, problem, recommended fix; per-item A) Fix / B) Skip; overall RECOMMENDATION).

After fixes, commit fixed files by name and loop: re-run tests (Step 4) then re-run this review against the updated diff. Repeat until one full pass applies ZERO fixes. Bound at 3 fix cycles; if the 3rd still applies fixes, STOP and report which findings keep reappearing.

## Step 9: Bump VERSION

Check and bump VERSION if it exists:

```bash
cat VERSION 2>/dev/null || echo "NO_VERSION_FILE"
```

If VERSION exists and was not modified on this branch, auto-bump PATCH:

```bash
awk -F. '{print $1"."$2"."$3+1}' VERSION > VERSION.tmp && mv VERSION.tmp VERSION
```

If VERSION was already bumped, use as-is. For MINOR or MAJOR bumps (feature signals, breaking changes, or 500+ line diffs), AskUserQuestion with a recommended level and rationale before bumping.

## Step 10: Update CHANGELOG

If CHANGELOG.md exists, prepend an entry for this version. Enumerate every commit on the branch (`git log <base>..HEAD --oneline`), group them by theme, and write a `## [X.Y.Z.W] - YYYY-MM-DD` entry with `### Added / Changed / Fixed / Removed` sections. Lead with what the user can now do. Internal changes go in a "For contributors" subsection. Cross-check: every commit maps to at least one bullet. Do NOT ask the user to describe changes — infer from the diff.

## Step 11: Commit (bisectable chunks)

Group changes into logical commits — one coherent change each, ordered so dependencies come first (infrastructure → models/services → controllers/views → VERSION+CHANGELOG last). Each commit must be independently valid. Compose messages: `<type>: <summary>`. If the total diff is small (< 50 lines across < 4 files), a single commit is fine.

## Step 12: Verification Gate

**No completion claims without fresh verification evidence.** If ANY code changed after Step 4's test run (fixes from review findings; CHANGELOG edits don't count), re-run the test suite and paste fresh output. If the project has a build step, run it. "Trivial change" is not verification. If tests fail here, STOP and fix.

## Step 13: Push

Idempotency check:

```bash
git fetch origin <branch-name> 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/<branch-name> 2>/dev/null || echo "none")
[ "$LOCAL" = "$REMOTE" ] && echo "ALREADY_PUSHED" || echo "PUSH_NEEDED"
```

If `PUSH_NEEDED`:

```bash
git add -A
git commit -m "release: v$(cat VERSION)" || true
git push -u origin <branch-name>
```

Never force-push.

## Step 14: Documentation Sync (via subagent, before PR creation)

Dispatch a docs-sync subagent (fresh context) before creating the PR. Prompt it to update docs that are now stale relative to the diff (README, ARCHITECTURE, CLAUDE.md, etc.), skip VERSION/CHANGELOG (ship owns both this run), and output a single JSON object on the LAST line: `{"files_updated":["..."],"commit_sha":"...","pushed":true,"documentation_section":"<markdown for PR body>","decisions":[]}`. In this spawned session, auto-choose recommended options at decision gates; never auto-choose a destructive option.

Parse the LAST line. Embed `documentation_section` in the PR body (omit the section if null). A non-null `error` means "doc-sync failed — run /document-release manually after the PR lands" and proceed without the section. Never block ship on a failed docs sync.

## Step 15: Create Pull Request

Idempotency check — does a PR already exist for this branch?

```bash
gh pr view --json url,number,state -q 'if .state == "OPEN" then "PR #\(.number): \(.url)" else "NO_PR" end' 2>/dev/null || echo "NO_PR"
```

Compose the PR body fresh (never reuse a prior run's body):

```
## Summary
<Summarize all substantive changes. Run `git log <base>..HEAD --oneline`; group commits into logical sections. Exclude the VERSION/CHANGELOG metadata commit.>

## Test Results
<Test results from Step 4 / Step 12.>

## Test Coverage
<Coverage diagram from Step 6, or "All new code paths have test coverage.">

## Pre-Landing Review
<Findings from Step 8, or "No issues found.">

## Plan Completion
<Checklist summary from Step 7, or "No plan file detected.">

## Documentation
<Step 14's documentation_section, if any.>

## Changed Files
<git diff <base>...HEAD --stat>
```

Before filing, re-scan the body and title for secrets/PII (this is a public artifact). The title must start with `v$(cat VERSION)`.

**GitHub:**

```bash
gh pr create --base <base> --title "v$(cat VERSION)" --body-file "<body-temp-file>"
```

For an existing PR, update instead: `gh pr edit --body-file "<body-temp-file>" --title "v$(cat VERSION) ..."`.

**GitLab:**

```bash
glab mr create --target-branch <base> --title "v$(cat VERSION)" --description "$(cat <body-temp-file>)"
```

If neither CLI is available, print the branch name, remote URL, and instruct the user to create the PR/MR manually. Output the PR/MR URL.

## Important Rules

- **Never ship from the base branch.** Feature branches only.
- **Uncommitted changes are always included.** No need to ask.
- **Always run tests before shipping.** Pre-existing failures are flagged but not blocking.
- **Never force push.**
- **Version bumps are automatic.** PATCH for fixes, ask for MINOR or MAJOR.
- **CHANGELOG is auto-generated from diff.** Polish wording but preserve content.
- **Split commits for bisectability.** Each commit = one logical change.
- **Never push without fresh verification evidence.** If code changed after Step 4 tests, re-run before pushing.
- **The goal is: user says ship, next thing they see is the review + PR URL + auto-synced docs.**

---

## Apple App Store / TestFlight release

Applies when the ship target is an Apple platform app (an `.xcodeproj` or `.xcworkspace`, or a Swift package with an app product) AND the user asked for store distribution. This path replaces the branch/PR ceremony above: store distribution is its own release path, not repository landing. Never abort an App Store release over branch topology.

One tool runs the entire release: **fastlane** — `produce` (app record and bundle ID), `cert` and `sigh` (signing), `gym` (archive and signed export), `pilot` (TestFlight), `deliver` (metadata, screenshots, Submit for Review), `frameit` (device frames). Install it when missing (`brew install fastlane`) with a one-line announcement, not a question. A Mac is required only for the build legs (archive, signing, binary upload); on a non-macOS host, route exactly those legs through a macOS CI runner executing the same `gym`/`deliver`/`pilot` commands.

### The one authorization moment

Exactly two interactions are permitted. FIRST, up front: confirm the user holds a paid Apple Developer Program membership ($99/year) and authorize the release. Ask free or paid (and the price if paid) inside this same question, once per app ever. Apple sign-in happens here too: `fastlane spaceauth -u <apple-id>`. Keep the printed session token out of the transcript; the cached cookie is the credential fastlane actually uses. Never store, echo, or log the password or token. SECOND, only when preflight finds the icon or screenshots missing: the store-assets question below.

No membership: STOP the App Store path. Offer to walk enrollment at developer.apple.com (a purchase the user completes themselves), and name the free-account ceiling honestly: personal-team installs on the user's own devices only, expiring after 7 days, no TestFlight, no App Store.

### Release preflight

Resolve and verify before archiving:

- **Signing:** development team on the app target; `cert`/`sigh` mint the distribution certificate and App Store profile when none exist.
- **Versioning:** a marketing version users should see, and a build number strictly greater than any build already uploaded for that version.
- **Dependencies:** `xcodebuild -resolvePackageDependencies` succeeds; any CocoaPods/Carthage installs and lockfiles are current.
- **App Store validation blockers:** complete app icon set including the 1024pt marketing icon, launch screen, a usage-description string for every privacy-gated API, required privacy manifests, an export-compliance answer, and a sane deployment target.

### Store assets

Only ask when the icon or screenshots are missing. Offer: app icon generation (a single 1024×1024 that Xcode 15+ derives every size from), marketing screenshots (benefit headlines + simulator captures, exportable headlessly — no API key required), plain frames via `frameit`, or user-supplied files (validate dimensions and move on). Assets already present skip this entirely.

### Archive and upload

1. Archive and export the signed Release build with `gym` (or `xcodebuild archive` directly for custom requirements). Output is an App Store-signed `.ipa`.
2. Upload via `pilot` (TestFlight) or `deliver` (App Store). The upload is an external effect: treat it as idempotent — on ambiguity, inspect App Store Connect for the build before re-uploading. Never re-upload blindly.
3. Credentials are env- or file-level secrets: never argv, never echoed, never committed.
4. Never demand an app-specific password — the web session mints the upload key instead. If minting fails on a fresh session because the signed-in Apple ID is not Admin or Account Holder, only then open the self-service app-specific-password path (the user generates it on any device and enters it into the macOS keychain). Never drive a browser to create credentials.

### Storefront completion

`produce` already created the app record and bundle ID during the run. Apply the pricing settled in the authorization moment through the App Store Connect pricing API (do not route it through fastlane's `price_tier`, which is broken against the current API). `deliver` owns the store listing: description, keywords, localizations, screenshot upload, attaching the uploaded build, and Submit for Review; `pilot` manages TestFlight groups and testers. App Review typically answers within a day or two — report that and close the run; review outcome is not a gate this workflow can hold open. In the SAME closing report, disclose the durable credential the release created, once per run: "This created an App Store Connect API key scoped to this app that persists for future releases; revoke it anytime at App Store Connect → Users and Access → Integrations." A free app needs no browser at any point; the paid-app banking/tax agreement is the only web-only residue, and the user completes it themselves.
