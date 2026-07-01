---
name: ios-fix
description: |
  Diagnose and fix iOS bugs with a tight reproduce, patch, and verify loop.
  Takes a bug report (from ios-qa or manual), reads the source, writes the fix,
  rebuilds, and verifies. Captures pre-bug state as a regression test fixture
  so the bug can never recur silently. Use when asked to "fix this iOS bug",
  "patch the iPhone app", or "auto-fix the iOS issue".
triggers:
  - fix this ios bug
  - patch the iphone app
  - auto-fix the ios issue
---

# iOS Bug Fixer

## Iron Law

**NO FIX WITHOUT A REPRODUCING UNDERSTANDING.** Before editing any source, you MUST confirm you can reproduce the bug and understand the root cause. A fix that lands without a clear reproduction is a fix you'll be re-fixing in three months.

## Phase 1: Reproduce the Bug

1. Read the bug report (from ios-qa or manual description: bug description, expected vs actual behavior, affected screen/component).
2. Read the relevant source files to understand the current behavior.
3. Identify the exact conditions that trigger the bug: what input, what state, what sequence of actions.
4. Document the reproduction path: "To reproduce: 1) ... 2) ... 3) ... Expected: X, Actual: Y".
5. Capture a record of the pre-bug state: file paths, relevant code snippets, expected vs actual.

## Phase 2: Locate Root Cause

Per `investigate`'s Iron Law: no fix without root cause. Read the source, trace from the buggy screen back to the view model, the data flow, and the state mutation. Identify the smallest change that fixes the behavior.

- Grep for error messages, component names, data flows
- Read surrounding code to understand context
- If there are multiple plausible root causes, present options and let the user pick

## Phase 3: Apply Fix

1. Edit source. Keep the diff minimal — smallest change that resolves the issue.
2. Do NOT refactor surrounding code, add features, or "improve" unrelated things.
3. Build and verify:

```bash
xcodebuild -scheme <SchemeName> -destination 'platform=iOS Simulator,name=iPhone 16' build
```

Or for the actual device build command the project uses.

## Phase 4: Verify

1. Re-test the reproduction path from Phase 1.
2. Confirm the bug no longer occurs.
3. Check that no new issues were introduced in the same flow.
4. If the bug persists, the fix didn't work — revert and try again (max 3 iterations before escalating to the user).
5. If the bug is gone, commit:

```bash
git add <only-changed-files>
git commit -m "fix(ios): <bug description> — <root cause in one line>"
```

One commit per fix. Never bundle multiple fixes.

## Phase 5: Add Regression Test

Write a test that:
1. Sets up the pre-bug conditions from Phase 1
2. Exercises the fixed behavior
3. Asserts the expected outcome

The test MUST:
- Match the project's existing test style (naming, imports, assertion patterns)
- Include an attribution comment: `// Regression: {bug description}. Found by ios-qa/fix on {date}.`
- Assert the specific correct behavior, not generic "it works"

Run the test:

```bash
xcodebuild test -scheme <SchemeName> -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:<TestTarget>/<TestCase>/<TestMethod>
```

If the test passes: commit separately — `git commit -m "test(ios): regression test for {bug description}"`

## Failure Modes

| Symptom | Action |
|---|---|
| 3 iterations, bug still present | STOP, report to user with current best hypothesis |
| Can't reproduce the bug | Ask user for exact reproduction steps; don't guess at a fix |
| Build fails | Revert edits; investigate compile error before re-applying fix |
| No test framework available | Note in commit message; regression test skipped |
