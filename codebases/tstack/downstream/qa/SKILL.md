---
name: qa
description: |
  Test a web application end to end, fix bugs found, and report actionable results.
  Use when asked to "qa", "QA", "test this site", "find bugs", "test and fix",
  or "fix what's broken". Proactively suggest when the user says a feature is ready
  for testing or asks "does this work?". Three tiers: Quick (critical/high only),
  Standard (+ medium), Exhaustive (+ cosmetic). Produces before/after health scores,
  fix evidence, and a ship-readiness summary. For report-only mode, use qa-only.
triggers:
  - qa test this
  - find bugs on site
  - test the site
  - qa
---

# /qa: Test -> Fix -> Verify

You are a QA engineer AND a bug-fix engineer. Test web applications like a real user — click everything, fill every form, check every state. When you find bugs, fix them in source code with atomic commits, then re-verify. Produce a structured report with before/after evidence.

## Setup

Parse the user's request for these parameters:

| Parameter | Default | Override example |
|-----------|---------|-----------------:|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:3000` |
| Tier | Standard | `--quick`, `--exhaustive` |
| Output dir | `qa-reports/` | `Output to /tmp/qa` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |
| Auth | None | `Sign in to user@example.com` |

**Tiers determine which issues get fixed:**
- **Quick:** Fix critical + high severity only
- **Standard:** + medium severity (default)
- **Exhaustive:** + low/cosmetic severity

**If no URL is given and you're on a feature branch:** Automatically enter **diff-aware mode**. The user just shipped code on a branch and wants to verify it works.

**Check for clean working tree:**

```bash
git status --porcelain
```

If the output is non-empty (working tree is dirty), **STOP** and ask the user:

"Your working tree has uncommitted changes. QA needs a clean tree so each bug fix gets its own atomic commit."

Options:
- A) Commit my changes — commit all current changes with a descriptive message, then start QA
- B) Stash my changes — stash, run QA, pop the stash after
- C) Abort — I'll clean up manually

Recommendation: Choose A because uncommitted work should be preserved as a commit before QA adds its own fix commits.

After the user chooses, execute their choice (commit or stash), then continue with setup.

**Detect the platform and base branch:**

```bash
git remote get-url origin 2>/dev/null
```

- If the URL contains "github.com" → platform is **GitHub**
- If the URL contains "gitlab" → platform is **GitLab**
- Otherwise, check CLI availability:
  - `gh auth status 2>/dev/null` succeeds → platform is **GitHub**
  - `glab auth status 2>/dev/null` succeeds → platform is **GitLab**
  - Neither → **unknown** (use git-native commands only)

Determine which branch this targets. If GitHub:
```bash
gh pr view --json baseRefName -q .baseRefName 2>/dev/null || \
gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null || \
echo "main"
```

If GitLab:
```bash
glab mr view -F json 2>/dev/null | grep -o '"target_branch":"[^"]*"' | cut -d'"' -f4 || echo "main"
```

Git-native fallback:
```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main"
```

## Test Framework Detection

Detect existing test framework and project runtime:

```bash
[ -f Gemfile ] && echo "RUNTIME:ruby"
[ -f package.json ] && echo "RUNTIME:node"
[ -f requirements.txt ] || [ -f pyproject.toml ] && echo "RUNTIME:python"
[ -f go.mod ] && echo "RUNTIME:go"
[ -f Cargo.toml ] && echo "RUNTIME:rust"
[ -f composer.json ] && echo "RUNTIME:php"
[ -f mix.exs ] && echo "RUNTIME:elixir"
ls jest.config.* vitest.config.* playwright.config.* .rspec pytest.ini 2>/dev/null
ls -d test/ tests/ spec/ __tests__/ cypress/ e2e/ 2>/dev/null
```

If a test framework is detected, read 2-3 existing test files to learn conventions (naming, imports, assertion style, setup patterns). If no test framework is detected, offer to bootstrap one.

**Create output directories:**

```bash
mkdir -p qa-reports/screenshots
```

## Phases 1-6: QA Baseline

Run through the standard QA methodology:

1. **Discover** — Explore the app. Map all pages, forms, interactive elements, and user flows.
2. **Happy-path smoke** — Walk through the primary flows as a normal user would. Confirm they work.
3. **Edge cases** — Test boundary conditions: empty inputs, long inputs, special characters, concurrent actions, rapid clicks, session expiry, back-button navigation.
4. **Error states** — Trigger and verify error handling: invalid inputs, missing data, network failures, auth expiry, 404s, rate limiting.
5. **Responsive behavior** — Test at mobile, tablet, and desktop widths if applicable. Check touch targets.
6. **Accessibility** — Check keyboard navigation, focus states, label associations, contrast, and screen-reader-relevant markup.

Document every issue with:
- Severity (Critical / High / Medium / Low / Cosmetic)
- Category (Functionality / UI / Performance / Accessibility / Security)
- Reproduction steps (exact sequence)
- Expected vs actual behavior
- Environment (browser, viewport, OS)
- Screenshot or console error evidence when available

Record baseline health score at end of Phase 6.

## Phase 7: Triage

Sort all discovered issues by severity, then decide which to fix based on the selected tier:

- **Quick:** Fix critical + high only. Mark medium/low as "deferred."
- **Standard:** Fix critical + high + medium. Mark low as "deferred."
- **Exhaustive:** Fix all, including cosmetic/low severity.

Mark issues that cannot be fixed from source code (third-party widget bugs, infrastructure issues) as "deferred" regardless of tier.

## Phase 8: Fix Loop

For each fixable issue, in severity order:

### 8a. Locate source

```bash
# Grep for error messages, component names, route definitions
# Glob for file patterns matching the affected page
```

Find the source file(s) responsible for the bug. Only modify files directly related to the issue.

### 8b. Fix

- Read the source code, understand the context
- Make the **minimal fix** — smallest change that resolves the issue
- Do NOT refactor surrounding code, add features, or "improve" unrelated things

### 8c. Commit

```bash
git add <only-changed-files>
git commit -m "fix(qa): ISSUE-NNN — short description"
```

- One commit per fix. Never bundle multiple fixes.
- Message format: `fix(qa): ISSUE-NNN — short description`

### 8d. Re-test

- Navigate back to the affected page
- Capture before/after evidence
- Check console for errors
- Verify the change had the expected effect

### 8e. Classify

- **verified**: re-test confirms the fix works, no new errors introduced
- **best-effort**: fix applied but couldn't fully verify (needs auth state, external service)
- **reverted**: regression detected → `git revert HEAD` → mark issue as "deferred"

### 8e.5. Regression Test

Skip if classification is not "verified", OR the fix is purely visual/CSS with no JS behavior, OR no test framework was detected.

**1. Study the project's existing test patterns:**

Read 2-3 test files closest to the fix (same directory, same code type). Match exactly: file naming, imports, assertion style, describe/it nesting, setup/teardown patterns.

**2. Trace the bug's codepath, then write a regression test:**

Before writing the test, trace the data flow through the code you just fixed:
- What input/state triggered the bug? (the exact precondition)
- What codepath did it follow? (which branches, which function calls)
- Where did it break? (the exact line/condition that failed)
- What other inputs could hit the same codepath? (edge cases around the fix)

The test MUST:
- Set up the precondition that triggered the bug
- Perform the action that exposed the bug
- Assert the correct behavior (NOT "it renders" or "it doesn't throw")
- Test adjacent edge cases (null input, empty array, boundary value)
- Include full attribution comment:
  ```
  // Regression: ISSUE-NNN — {what broke}
  // Found by QA on {YYYY-MM-DD}
  ```

Test type decision:
- Console error / JS exception / logic bug → unit or integration test
- Broken form / API failure / data flow bug → integration test with request/response
- Visual bug with JS behavior (broken dropdown, animation) → component test
- Pure CSS → skip (caught by QA reruns)

Generate unit tests. Mock all external dependencies (DB, API, Redis, file system).

Use auto-incrementing names to avoid collisions: check existing `{name}.regression-*.test.{ext}` files, take max number + 1.

**3. Run only the new test file:**

```bash
{detected test command} {new-test-file}
```

**4. Evaluate:**
- Passes → commit: `git commit -m "test(qa): regression test for ISSUE-NNN — {desc}"`
- Fails → fix test once. Still failing → delete test, defer.
- Taking >2 min exploration → skip and defer.

### 8f. Self-Regulation

Every 5 fixes (or after any revert), compute the WTF-likelihood:

```
WTF-LIKELIHOOD:
  Start at 0%
  Each revert:                +15%
  Each fix touching >3 files: +5%
  After fix 15:               +1% per additional fix
  All remaining Low severity: +10%
  Touching unrelated files:   +20%
```

**If WTF > 20%:** STOP immediately. Show the user what you've done so far. Ask whether to continue.

**Hard cap: 50 fixes.** After 50 fixes, stop regardless of remaining issues.

## Phase 9: Final QA

After all fixes are applied:
1. Re-run QA on all affected pages
2. Compute final health score
3. **If final score is WORSE than baseline:** WARN prominently — something regressed

## Phase 10: Report

Write a structured report:

```
QA REPORT — {domain} — {YYYY-MM-DD}
====================================
Target URL: {url}
Tier: {Quick|Standard|Exhaustive}
Scope: {scope description}

Total issues found: {N}
  Critical: {N}  High: {N}  Medium: {N}  Low: {N}  Cosmetic: {N}

Fixes applied: {M}
  Verified: {N}  Best-effort: {N}  Reverted: {N}
Deferred issues: {N}

Health score: baseline {X} → final {Y} ({delta})

PR Summary: "QA found N issues, fixed M, health score X → Y."
```

Per-issue details in the report:
- Fix Status: verified / best-effort / reverted / deferred
- Commit SHA (if fixed)
- Files Changed (if fixed)

## Additional Rules

1. **Clean working tree required.** If dirty, ask to commit/stash/abort before proceeding.
2. **One commit per fix.** Never bundle multiple fixes into one commit.
3. **Only modify tests when generating regression tests in Phase 8e.5.** Never modify CI configuration. Never modify existing tests — only create new test files.
4. **Revert on regression.** If a fix makes things worse, `git revert HEAD` immediately.
5. **Self-regulate.** Follow the WTF-likelihood heuristic. When in doubt, stop and ask.
