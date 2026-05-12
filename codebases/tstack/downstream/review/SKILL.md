---
name: review
description: |
  Pre-landing PR review. Analyzes diff against the base branch for SQL safety, LLM trust
  boundary violations, race conditions, scope drift, and other structural issues. Use when
  asked to "review this PR", "code review", "pre-landing review", or "check my diff".
triggers:
  - review this pr
  - code review
  - check my diff
  - pre-landing review
  - review this
---

# Pre-Landing PR Review

Review the current branch's diff against the base branch for structural issues that tests don't catch.

## Voice

TStack voice: product and engineering judgment, compressed for runtime.

- Lead with the point. Say what it does, why it matters, and what changes for the builder.
- Be concrete. Name files, functions, line numbers, commands, outputs, evals, and real numbers.
- Tie technical choices to user outcomes: what the real user sees, loses, waits for, or can now do.
- Be direct about quality. Bugs matter. Edge cases matter. Fix the whole thing, not the demo path.
- Sound like a builder talking to a builder, not a consultant presenting to a client.
- Never corporate, academic, PR, or hype. Avoid filler, throat-clearing, generic optimism.
- No em dashes. No AI vocabulary: delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental, significant.
- The user has context you do not: domain knowledge, timing, relationships, taste. Cross-model agreement is a recommendation, not a decision. The user decides.

Good: "auth.ts:47 returns undefined when the session cookie expires. Users hit a white screen. Fix: add a null check and redirect to /login. Two lines."
Bad: "I've identified a potential issue in the authentication flow that may cause problems under certain conditions."

## AskUserQuestion Format

Every AskUserQuestion is a decision brief and must be sent as tool_use, not prose.

```
D<N> — <one-line question title>
Project/branch/task: <1 short grounding sentence>
ELI10: <plain English a 16-year-old could follow, 2-4 sentences, name the stakes>
Stakes if we pick wrong: <one sentence on what breaks, what user sees, what's lost>
Recommendation: <choice> because <one-line reason>
Completeness: A=X/10, B=Y/10   (or: Note: options differ in kind, not coverage — no completeness score)
Pros / cons:
A) <option label> (recommended)
  ✅ <pro — concrete, observable, ≥40 chars>
  ❌ <con — honest, ≥40 chars>
B) <option label>
  ✅ <pro>
  ❌ <con>
Net: <one-line synthesis of what you're actually trading off>
```

D-numbering: first question in a skill invocation is `D1`; increment yourself.
ELI10 is always present. Recommendation is ALWAYS present.
Completeness: use `Completeness: N/10` only when options differ in coverage. 10 = complete, 7 = happy path, 3 = shortcut.
Pros/cons: minimum 2 pros and 1 con per option, minimum 40 characters per bullet.
Net line closes the tradeoff.

## Step 0: Detect platform and base branch

Detect the git hosting platform from the remote URL:

```bash
git remote get-url origin 2>/dev/null
```

- URL contains "github.com" → **GitHub**
- URL contains "gitlab" → **GitLab**
- Otherwise, check: `gh auth status` succeeds → GitHub; `glab auth status` succeeds → GitLab
- Neither → **unknown** (use git-native commands only)

Determine the base branch:

**GitHub:**
1. `gh pr view --json baseRefName -q .baseRefName`
2. `gh repo view --json defaultBranchRef -q .defaultBranchRef.name`

**GitLab:**
1. `glab mr view -F json 2>/dev/null` → extract `target_branch`
2. `glab repo view -F json 2>/dev/null` → extract `default_branch`

**Git-native fallback:**
1. `git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||'`
2. `git rev-parse --verify origin/main 2>/dev/null` → use `main`
3. `git rev-parse --verify origin/master 2>/dev/null` → use `master`
4. Fall back to `main`

---

## Step 1: Check branch

1. Run `git branch --show-current` to get the current branch.
2. If on the base branch, output: "Nothing to review — you're on the base branch or have no changes against it." Stop.
3. Run `git fetch origin <base> --quiet && git diff origin/<base> --stat`. If no diff, same message, stop.

---

## Step 1.5: Scope Drift Detection

Check whether the delivered changes match the stated intent.

Read `TODOS.md` (if it exists), PR description (`gh pr view --json body --jq .body 2>/dev/null`), and commit messages (`git log origin/<base>..HEAD --oneline`). Identify **stated intent** — what was this branch supposed to accomplish?

Run `git diff origin/<base>...HEAD --stat` and compare against intent:

**SCOPE CREEP:**
- Files changed unrelated to stated intent
- New features or refactors not mentioned in the plan
- "While I was in there..." changes that expand blast radius

**MISSING REQUIREMENTS:**
- Requirements from TODOS.md/PR description not addressed in the diff
- Test coverage gaps for stated requirements
- Partial implementations

Output:
```
Scope Check: [CLEAN / DRIFT DETECTED / REQUIREMENTS MISSING]
Intent: <1-line summary>
Delivered: <1-line summary>
[If drift: list each out-of-scope change]
[If missing: list each unaddressed requirement]
```

### Plan File Discovery

Search for a plan file to cross-reference:

```bash
BRANCH=$(git branch --show-current 2>/dev/null | tr '/' '-')
REPO=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)")

# Search common plan file locations
for PLAN_DIR in "$HOME/.claude/plans" "$HOME/.codex/plans"; do
  [ -d "$PLAN_DIR" ] || continue
  PLAN=$(ls -t "$PLAN_DIR"/*.md 2>/dev/null | xargs grep -l "$BRANCH" 2>/dev/null | head -1)
  [ -z "$PLAN" ] && PLAN=$(ls -t "$PLAN_DIR"/*.md 2>/dev/null | xargs grep -l "$REPO" 2>/dev/null | head -1)
  [ -z "$PLAN" ] && PLAN=$(find "$PLAN_DIR" -name '*.md' -mmin -1440 -maxdepth 1 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
  [ -n "$PLAN" ] && break
done
[ -n "$PLAN" ] && echo "PLAN_FILE: $PLAN" || echo "NO_PLAN_FILE"
```

### Actionable Item Extraction

Read the plan file and extract actionable items:
- Checkbox items: `- [ ] ...` / `- [x] ...`
- Numbered steps under implementation headings
- Imperative statements: "Add X to Y", "Create a Z service"
- File-level specifications: "New file: path/to/file.ts"
- Test requirements: "Test that X"
- Data model changes: "Add column X to table Y"

Ignore: Context/Background, questions marked with ?, explicit "Out of scope:" / deferred items, CEO review decision sections.

### Verification Mode

Classify each item:
- **DIFF-VERIFIABLE** — manifests in `git diff <base>...HEAD`
- **CROSS-REPO** — names a file in a sibling repo; check `[ -f <path> ]`
- **EXTERNAL-STATE** — Supabase config, Cloudflare DNS, etc.; UNVERIFIABLE, cite what to check
- **CONTENT-SHAPE** — requires a file to follow a convention; check with applicable validators

### Cross-Reference Against Diff

Run `git diff origin/<base>...HEAD` and `git log origin/<base>..HEAD --oneline`.

Classify each item:
- **DONE** — Clear evidence, cite specific files
- **PARTIAL** — Some work exists but incomplete
- **NOT DONE** — Verification produced negative evidence
- **CHANGED** — Different approach, same goal achieved
- **UNVERIFIABLE** — Diff cannot prove or disprove; cite manual verification needed

Output:
```
PLAN COMPLETION AUDIT
═══════════════════════════════
Plan: {path}

## Implementation Items
  [DONE]     Create UserService — src/services/user_service.rb (+142 lines)
  [PARTIAL]  Add validation — model validates but missing controller checks
  [NOT DONE] Add caching layer — no cache-related changes in diff

## Test Items
  [DONE]     Unit tests for UserService — test/services/user_service_test.rb

─────────────────────────────────
COMPLETION: 4/6 DONE, 1 PARTIAL, 1 NOT DONE
─────────────────────────────────
```

### Investigation Depth

For each PARTIAL or NOT DONE item, investigate:
- Scope cut (revert commit, removed TODO)
- Context exhaustion (started but stopped mid-way)
- Misunderstood requirement
- Blocked by dependency
- Genuinely forgotten

```
DISCREPANCY: {PARTIAL|NOT_DONE} | {item} | {what was delivered}
INVESTIGATION: {likely reason with evidence}
IMPACT: {HIGH|MEDIUM|LOW} — {what breaks or degrades}
```

For HIGH-impact discrepancies, trigger AskUserQuestion:
- A) Stop and implement missing items
- B) Ship anyway + create P1 TODOs
- C) Intentionally dropped

---

## Step 2: Get the diff

```bash
git fetch origin <base> --quiet
git diff origin/<base>
```

---

## Step 3: Critical pass (core review)

Apply these categories against the diff:

**CRITICAL:**
- SQL & Data Safety — injection, missing WHERE clauses, unsafe migrations
- Race Conditions & Concurrency — lock ordering, atomicity violations
- LLM Output Trust Boundary — unvalidated LLM output before DB write, file system, or execution
- Shell Injection — user input in backticks, `system()`, `exec()`, `spawn()`
- Enum & Value Completeness — new enum values handled everywhere sibling values are handled

**INFORMATIONAL:**
- Async/Sync Mixing
- Type Coercion
- Time Window Safety
- Completeness Gaps
- Distribution & CI/CD

For Enum & Value Completeness: use Grep to find all files that reference sibling enum values, then Read those files to check if the new value is handled.

## Confidence Calibration

Every finding MUST include a confidence score (1-10):

| Score | Meaning | Display rule |
|-------|---------|-------------|
| 9-10 | Verified by reading specific code. Concrete bug demonstrated. | Show normally |
| 7-8 | High confidence pattern match. | Show normally |
| 5-6 | Moderate. Could be false positive. | Show with caveat |
| 3-4 | Low confidence. Suspicious but may be fine. | Suppress from main report, include in appendix |
| 1-2 | Speculation. | Only report if severity P0 |

Finding format: `[SEVERITY] (confidence: N/10) file:line — description`

---

## Step 4: Fix-First Review

Classify each finding as **AUTO-FIX** or **ASK**:
- **AUTO-FIX**: Apply directly. Output `[AUTO-FIXED] [file:line] Problem → what you did`.
- **ASK**: Batch into one AskUserQuestion.
  - List each item with number, severity, problem, and recommended fix
  - Options: A) Fix as recommended, B) Skip
  - Include overall RECOMMENDATION

If 3 or fewer ASK items, use individual AskUserQuestion calls.

If no ASK items exist (everything was AUTO-FIX), skip the question entirely.

---

## Step 5: TODOS cross-reference

Read `TODOS.md` if it exists:
- Does this PR close any open TODOs? Note: "This PR addresses TODO: <title>"
- Does this PR create work that should become a TODO?
- Are there related TODOs providing context?

---

## Step 6: Documentation staleness check

Cross-reference the diff against documentation files in the repo root (README.md, ARCHITECTURE.md, CLAUDE.md, etc.):
1. Check if code changes affect features described in the doc
2. If doc wasn't updated but code was, flag: "Documentation may be stale: [file] — consider updating docs."

---

## Important Rules

- Read the FULL diff before commenting. Do not flag issues already addressed.
- Fix-first, not read-only. AUTO-FIX items are applied directly. ASK items after user approval.
- Never commit, push, or create PRs — that's the ship skill's job.
- Be terse. One line problem, one line fix. No preamble.
- Only flag real problems. Skip anything that's fine.
