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

**Read the project's CLAUDE.md (and TESTING.md if present) FIRST.** If it documents a test command, the project already told you: no detection, no bootstrap. Use that command in the fix loop.

**Otherwise gather markers. Every marker below is EVIDENCE for the question you ask — never a command to run blind.** A marker tells you which ecosystem you're in and which command to OFFER. It does not tell you the command works. Do not execute a candidate test command to "check" it: a probe on a project that never had that runner fails loudly and teaches you nothing, and installing a second framework over a working one is worse.

```bash
setopt +o nomatch 2>/dev/null || true  # zsh compat
# Definitive ecosystem markers (presence = ecosystem, NOT a command to run)
[ -f manage.py ] && echo "RUNTIME:python FRAMEWORK:django MARKER:manage.py"
{ [ -f pyproject.toml ] || [ -f pytest.ini ] || [ -f tox.ini ] || [ -f setup.cfg ] || [ -f requirements.txt ]; } && echo "RUNTIME:python"
{ [ -f Gemfile ] || [ -f Rakefile ] || [ -f .rspec ]; } && echo "RUNTIME:ruby"
[ -f package.json ] && echo "RUNTIME:node"
[ -f go.mod ] && echo "RUNTIME:go"
[ -f Cargo.toml ] && echo "RUNTIME:rust"
[ -f composer.json ] && echo "RUNTIME:php"
[ -f mix.exs ] && echo "RUNTIME:elixir"
[ -f pom.xml ] && echo "RUNTIME:jvm BUILD:maven"
{ [ -f build.gradle ] || [ -f build.gradle.kts ]; } && echo "RUNTIME:jvm BUILD:gradle"
# Existing test evidence — config files, declared scripts, AND test files.
# A project with real tests and no config file is the common miss.
ls jest.config.* vitest.config.* playwright.config.* .rspec pytest.ini tox.ini phpunit.xml* 2>/dev/null
[ -f package.json ] && grep -q '"test"[[:space:]]*:' package.json && echo "SCRIPT:package.json test"
[ -f Makefile ] && grep -qE '^(test|check):' Makefile && echo "TARGET:make test"
[ -f pyproject.toml ] && grep -q "pytest" pyproject.toml && echo "CONFIG:pyproject pytest"
git ls-files | grep -cE '(^|/)(tests?|spec|__tests__)/|(^|/)tests?\.py$|(^|/)test_[^/]+\.py$|_test\.(go|py|rb|ts|js|exs)$|\.(test|spec)\.[jt]sx?$|_spec\.rb$|Test\.(java|kt)$' | sed 's/^/TESTFILES:/'
# Rust keeps unit tests inside src/, so file names alone miss them
[ -f Cargo.toml ] && git grep -lF '#[test]' -- 'src' >/dev/null 2>&1 && echo "TESTS:rust in-source"
```

Map the markers to the command you will OFFER — never to one you run on a guess:

| Marker | Ecosystem | Candidate command to offer |
|--------|-----------|----------------------------|
| `manage.py` | Django | `python manage.py test` (or `pytest` when pytest-django is in the deps) |
| `pytest.ini` / `tox.ini` / pytest in `pyproject.toml` / `test_*.py` | Python | `pytest` |
| `go.mod` (+ any `*_test.go`) | Go | `go test ./...` |
| `Cargo.toml` | Rust | `cargo test` |
| `pom.xml` | JVM (Maven) | `mvn test` |
| `build.gradle` / `build.gradle.kts` | JVM (Gradle) | `./gradlew test` |
| `Gemfile` / `Rakefile` / `.rspec` | Ruby | `bundle exec rspec`, `bin/rails test`, or `rake test` |
| `mix.exs` | Elixir | `mix test` |
| `composer.json` | PHP | `composer test` or `./vendor/bin/phpunit` |
| `package.json` with a `test` script | Node | that script, run with the package manager the lockfile names |
| `Makefile` with a `test:` target | any | `make test` |

**If ANY existing-test evidence appears** (a config file, a declared test script or make target, a nonzero `TESTFILES:` count, or `TESTS:rust in-source`): the project has tests. **Do NOT bootstrap.** Print "Existing tests detected: {the evidence}." Then get the command the same way the fix loop does — CLAUDE.md/TESTING.md if documented, otherwise AskUserQuestion offering the candidates from the table above plus "Other". When the ecosystem ships a runner (Django, Go, Rust, Elixir, Maven/Gradle), that runner is the candidate — never install a second framework beside a working one. Read 2-3 existing test files to learn conventions (naming, imports, assertion style, setup patterns). Store conventions as prose context for use in the regression-test step.

Absent config files and absent `tests/` directories are NOT evidence of "no tests": Django keeps tests in `<app>/tests.py`, Go in `*_test.go` beside the source, Rust in `#[test]` blocks inside `src/`. A green `python manage.py test` with no `pytest.ini` is a tested project, not a bootstrap candidate.

**If NO ecosystem marker matched:** Use AskUserQuestion: "I couldn't detect your project's language. What runtime are you using?" Options: A) Node.js/TypeScript B) Ruby/Rails C) Python D) Go E) Rust F) PHP G) Elixir H) This project doesn't need tests. If the runtime isn't listed, offer "Other" and take the runtime plus the test command as free text. If the user picks H, skip test bootstrap and continue without tests.

**If an ecosystem matched but there is no existing-test evidence at all — bootstrap:**

### B2. Research best practices

Use WebSearch for current best practices: `"[runtime] best test framework 2025 2026"`, `"[framework A] vs [framework B] comparison"`. If WebSearch is unavailable, use this built-in table:

| Runtime | Primary recommendation | Alternative |
|---------|----------------------|-------------|
| Ruby/Rails | minitest + fixtures + capybara | rspec + factory_bot + shoulda-matchers |
| Node.js | vitest + @testing-library | jest + @testing-library |
| Next.js | vitest + @testing-library/react + playwright | jest + cypress |
| Python | pytest + pytest-cov | unittest |
| Django | pytest + pytest-django | Django's built-in `manage.py test` (unittest) |
| Go | stdlib testing + testify | stdlib only |
| JVM (Maven/Gradle) | JUnit 5 + AssertJ | JUnit 5 only |
| Rust | cargo test (built-in) + mockall | — |
| PHP | phpunit + mockery | pest |
| Elixir | ExUnit (built-in) + ex_machina | — |

### B3. Framework selection

Use AskUserQuestion: "I detected this is a [Runtime/Framework] project with no test framework. Here are the options: A) [Primary] — [rationale + packages]. B) [Alternative] — [rationale + packages]. C) Skip — don't set up testing right now. RECOMMENDATION: A because [reason based on project context]."

If the user picks C, write a `.no-test-bootstrap` marker and continue without tests ("delete `.no-test-bootstrap` and re-run to change your mind"). If multiple runtimes detected (monorepo), ask which to set up first, with an option to do both sequentially.

### B4. Install and configure

Install the chosen packages (npm/bun/gem/pip/etc.), create a minimal config file, create the test directory structure, and create one example test that exercises real project code to verify setup works. If install fails, debug once; if still failing, revert with `git checkout -- package.json package-lock.json` (or the runtime equivalent), warn the user, and continue without tests.

### B4.5. First real tests

Generate 3-5 real tests for existing code:

1. Find recently changed files: `git log --since=30.days --name-only --format="" | sort | uniq -c | sort -rn | head -10`
2. Prioritize by risk: error handlers > business logic with conditionals > API endpoints > pure functions
3. Write tests that assert real behavior. Never `expect(x).toBeDefined()` — test what the code DOES.
4. Run each test. Passes → keep. Fails → fix once. Still fails → delete silently.
5. Generate at least 1, cap at 5.

Never import secrets, API keys, or credentials in test files. Use environment variables or test fixtures.

### B5. Verify

Run the full suite with the chosen command. If tests fail, debug once; if still failing, revert all bootstrap changes and warn the user.

### B5.5. CI/CD pipeline

Check the CI provider (`ls -d .github/`, `ls .gitlab-ci.yml .circleci/`). If GitHub Actions (or no CI detected), create `.github/workflows/test.yml` with an appropriate setup action, the verified test command, and push + pull_request triggers. If a non-GitHub CI is detected, skip CI generation with a note: "Detected {provider} — add a test step to your existing pipeline manually."

### B6. Create TESTING.md

If TESTING.md exists, update/append rather than overwrite. Write: philosophy ("tests let you move fast and ship with confidence"), framework name and version, how to run tests (the verified command), test layers (unit/integration/smoke/e2e), and conventions (naming, assertion style, setup/teardown).

### B7. Update CLAUDE.md

If CLAUDE.md already has a `## Testing` section, skip. Otherwise append one: run command and test directory, a reference to TESTING.md, and expectations — write a test for new functions, a regression test for every bug fix, tests for both branches of every conditional, and never commit code that fails existing tests.

### B8. Commit

Stage all bootstrap files (config, test directory, TESTING.md, CLAUDE.md, CI workflow if created) and commit: `git commit -m "chore: bootstrap test framework ({framework name})"`.

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
