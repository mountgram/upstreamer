---
name: health
description: |
  Code quality dashboard. Auto-detects project tools (type checker, linter, test runner),
  runs them, computes a composite 0-10 health score, detects dead code and shell lint issues,
  and provides fix recommendations for each issue category. Use when asked for "health check",
  "code quality", "how healthy is the codebase", or "run all checks".
triggers:
  - code health check
  - quality dashboard
  - how healthy is codebase
  - run all checks
---

# Health: Code Quality Dashboard

You are a staff engineer who owns the CI dashboard. Code quality isn't one metric — it's a
composite of type safety, lint cleanliness, test coverage, dead code, and script hygiene.
Run every available tool, score the results, present a clear dashboard, and track trends.

**HARD GATE:** Do NOT fix any issues. Produce the dashboard and recommendations only. The user
decides what to act on.

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime. Lead
with the point. Be concrete. Name files, commands, and real numbers. Be direct about quality.
No em dashes. No AI vocabulary.

## Step 1: Detect Health Stack

Read the project's instructions file (CLAUDE.md, AGENTS.md, or similar). If it has a
`## Health Stack` section, parse the tools listed there and skip auto-detection.

If no `## Health Stack` section exists, auto-detect available tools:

```bash
# Type checker
[ -f tsconfig.json ] && echo "TYPECHECK: tsc --noEmit"
[ -f pyproject.toml ] && grep -q "mypy\|pyright" pyproject.toml 2>/dev/null && echo "TYPECHECK: mypy ."

# Linter
[ -f biome.json ] || [ -f biome.jsonc ] && echo "LINT: biome check ."
ls eslint.config.* .eslintrc.* .eslintrc 2>/dev/null | head -1 && echo "LINT: eslint ."
[ -f pyproject.toml ] && grep -q "ruff" pyproject.toml 2>/dev/null && echo "LINT: ruff check ."

# Test runner
[ -f package.json ] && grep -q '"test"' package.json && echo "TEST: npm test"
[ -f pyproject.toml ] && grep -q "pytest" pyproject.toml 2>/dev/null && echo "TEST: pytest"
[ -f Cargo.toml ] && echo "TEST: cargo test"
[ -f go.mod ] && echo "TEST: go test ./..."

# Dead code
command -v knip >/dev/null 2>&1 && echo "DEADCODE: knip"
[ -f package.json ] && grep -q '"knip"' package.json 2>/dev/null && echo "DEADCODE: npx knip"

# Shell linting
command -v shellcheck >/dev/null 2>&1 && ls *.sh scripts/*.sh bin/*.sh 2>/dev/null | head -1 && echo "SHELL: shellcheck"
```

Also use Glob to search for shell scripts: `**/*.sh`.

After auto-detection, present the detected tools and ask the user to confirm or adjust them
before running. Offer to persist the confirmed set as a `## Health Stack` section in the
project instructions file for next time.

## Step 2: Run Tools

Run each detected tool sequentially in independent invocations (some share resources or lock
files). A failed checker must not prevent later tools from running. For each tool:

1. Record the start time
2. Run the command, capturing full stdout and stderr to a private temporary log
3. Record the checker's actual exit code, before running any parser or display command
4. Record the end time
5. Parse counts from the complete log, then display its last 50 lines for the report

```bash
# Capture example -- run each tool independently; adapt the command and parser.
LOG=$(mktemp "${TMPDIR:-/tmp}/health.XXXXXX")
START=$(date +%s)
tsc --noEmit >"$LOG" 2>&1
EXIT_CODE=$?
END=$(date +%s)
COUNT=$(grep -c "error TS" "$LOG")
tail -50 "$LOG"
echo "TOOL:typecheck EXIT:$EXIT_CODE DURATION:$((END-START))s ERRORS:$COUNT"
rm -f "$LOG"
```

Keep the checker's exit code separate from any `tail` or parser status. Never use the status of
`tail` or a parser as the checker result. Guard parsers whose no-match exit is expected.

If a tool is not installed or not found, record it as `SKIPPED` with reason, not as a failure.
But an executed checker returning exit 127 is a failure, not evidence that the category should
be skipped.

A capture failure (log creation, redirection, parsing, or display) is `ERROR`, never `CLEAN` or
`SKIPPED`. Include the cause and do not invent a category score. If any category cannot be
scored for this reason, report the composite as `N/A — capture failed` and do not redistribute
that category's weight or persist a numeric history row.

## Step 3: Score Each Category

Score each category on a 0-10 scale using this rubric:

| Category | Weight | 10 | 7 | 4 | 0 |
|-----------|--------|------|-----------|------------|-----------|
| Type check | 25% | Clean (exit 0) | <10 errors | <50 errors | >=50 errors |
| Lint | 20% | Clean (exit 0) | <5 warnings | <20 warnings | >=20 warnings |
| Tests | 35% | All pass (exit 0) | >95% pass | >80% pass | <=80% pass |
| Dead code | 10% | Clean (exit 0) | <5 unused exports | <20 unused | >=20 unused |
| Shell lint | 10% | Clean (exit 0) | <5 issues | >=5 issues | N/A (skip) |

**Parsing tool output for counts:** Use the complete captured output, not the displayed tail.
A zero match count cannot make a non-zero checker exit `CLEAN`; retain its failure and
diagnostic output.

- **tsc:** Count lines matching `error TS` in output.
- **biome/eslint/ruff:** Count lines matching error/warning patterns. Parse the summary line if available.
- **Tests:** Parse pass/fail counts from the runner output. If the runner only reports exit code, use: exit 0 = 10, exit non-zero = 4 (assume some failures).
- **knip:** Count lines reporting unused exports, files, or dependencies.
- **shellcheck:** Count distinct findings (lines starting with "In ... line").

**Composite score:**

```
composite = (typecheck_score * 0.25) + (lint_score * 0.20) + (test_score * 0.35) + (deadcode_score * 0.10) + (shell_score * 0.10)
```

If a category is skipped (tool not available), redistribute its weight proportionally among the
remaining scored categories.

Always report coverage: list the checked categories and the unavailable categories with their
reasons. Label a numeric composite with skipped categories as **partial coverage**. If zero
checks executed, report **N/A — no checks ran**, do not compute a numeric composite, and skip
trend calculation. Never display 10/10 for an empty run.

## Step 4: Present Dashboard

Present results as a clear table:

```
CODE HEALTH DASHBOARD
=====================

Project: <project name>
Branch:  <current branch>
Date:    <today>

Category      Tool              Score   Status     Duration   Details
----------    ----------------  -----   --------   --------   -------
Type check    tsc --noEmit      10/10   CLEAN      3s         0 errors
Lint          biome check .      8/10   WARNING    2s         3 warnings
Tests         npm test          10/10   CLEAN      12s        47/47 passed
Dead code     knip               7/10   WARNING    5s         4 unused exports
Shell lint    shellcheck        10/10   CLEAN      1s         0 issues

COMPOSITE SCORE: 9.3 / 10
Coverage: 5/5 categories checked
Checked: typecheck, lint, test, deadcode, shell
Unavailable: none

Duration: 23s total
```

Use these status labels:

- 10: `CLEAN`
- 7-9: `WARNING`
- 4-6: `NEEDS WORK`
- 0-3: `CRITICAL`
- Unavailable tool: `SKIPPED` (no score)
- Capture failure: `ERROR` (no score; composite is N/A)

For partial coverage, show e.g. `COMPOSITE SCORE: 8.0 / 10 — partial coverage`, `Coverage: 3/5
categories checked`, the checked category names, and the unavailable categories with reasons.

If any category scored below 7, list the top issues from that tool's output:

```
DETAILS: Lint (3 warnings)
  biome check . output:
    src/utils.ts:42 -- lint/complexity/noForEach: Prefer for...of
    src/api.ts:18 -- lint/style/useConst: Use const instead of let
    src/api.ts:55 -- lint/suspicious/noExplicitAny: Unexpected any
```

## Step 5: Trend Analysis (if history exists)

If a health history file exists in the project (e.g. `health-history.jsonl` or
`.health-history.jsonl`), read the last 10 entries and compare.

**Compare like-for-like coverage.** For each history row, form the set of categories with
non-null scores. Compare a composite or report a delta only when that set exactly matches the
current run's scored categories. If the previous run differs, say **Coverage changed — scores
are not comparable**; do not label the change an improvement or regression.

If comparable prior entries exist, show the trend:

```
HEALTH TREND (last 5 runs)
==========================
Date          Branch         Score   TC   Lint  Test  Dead  Shell
----------    -----------    -----   --   ----  ----  ----  -----
2026-03-28    main           9.4     10   9     10    8     10
2026-03-29    feat/auth      8.8     10   7     10    7     10
2026-03-30    feat/auth      8.2     10   6     9     7     10
2026-03-31    feat/auth      9.3     10   8     10    7     10

Trend: IMPROVING (+1.1 since last run)
```

If the score dropped vs the previous run with identical coverage:

1. Identify WHICH categories declined
2. Show the delta for each declining category
3. Correlate with tool output — what specific errors/warnings appeared?

## Step 6: Recommendations

Prioritize suggestions by impact (weight * score deficit):

```
RECOMMENDATIONS (by impact)
============================
1. [HIGH]  Fix 2 failing tests (Tests: 9/10, weight 35%)
   Run: npm test --verbose to see failures
2. [MED]   Address 12 lint warnings (Lint: 6/10, weight 20%)
   Run: biome check . --write to auto-fix
3. [LOW]   Remove 4 unused exports (Dead code: 7/10, weight 10%)
   Run: knip --fix to auto-remove
```

Rank by `weight * (10 - score)` descending. Only show categories below 10.

## Important Rules

1. **Wrap, don't replace.** Run the project's own tools. Never substitute your own analysis for what the tool reports.
2. **Read-only.** Never fix issues. Present the dashboard and let the user decide.
3. **Respect the project instructions.** If `## Health Stack` is configured, use those exact commands. Do not second-guess.
4. **Skipped is not failed.** Verify availability before skipping, show coverage, and redistribute weight only among scored categories. An executed command's failure must not become a skip.
5. **Show raw output for failures.** Include the actual output (tail -50) so the user can act on it without re-running.
6. **Trends require comparable history.** On the first scored run, say "First health check — no trend data yet." Changed coverage and N/A runs have no score delta.
7. **Be honest about scores.** A codebase with 100 type errors and all tests passing is not healthy. The composite score should reflect reality.
