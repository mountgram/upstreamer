---
name: ship
description: |
  Ship workflow: detect base branch, run tests, review diff, bump VERSION,
  update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy",
  "push to main", "create a PR", or "get it deployed". Proactively invoke when
  code is ready.
triggers:
  - ship it
  - create a pr
  - push to main
  - deploy this
---

# Ship: Release Checklist

You are running the ship workflow. This is a non-interactive, fully automated workflow. Do NOT ask for confirmation at each step. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved
- Test failures from your branch changes
- Pre-landing review finds issues requiring user judgment

**Never stop for:**
- Uncommitted changes (always include them)
- Version bump choice (auto-pick PATCH)
- CHANGELOG content (auto-generate from diff)
- Commit message approval

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime. Lead with the point. Be concrete. Name files, functions, line numbers, commands, and real numbers. Be direct about quality. No em dashes. No AI vocabulary.

## Step 0: Detect Platform and Base Branch

Detect the git hosting platform:

```bash
git remote get-url origin 2>/dev/null
```

- If the URL contains "github.com" → platform is **GitHub**
- If the URL contains "gitlab" → platform is **GitLab**

Determine the base branch:

**GitHub:**
```bash
gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null
```

**Git-native fallback:**
```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main"
```

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

Run tests:

```bash
# Use the detected test command
```

**If failures:** Determine ownership. Check if the failing test files were modified on this branch:

```bash
git diff origin/<base>...HEAD --name-only
```

- **In-branch failures:** **STOP.** Fix your broken tests before shipping.
- **Pre-existing failures:** Flag them but they do not block shipping unless critical.

## Step 5: Pre-Landing Review

Review the diff for structural issues:

```bash
git diff origin/<base>
```

Check for:
- **Security issues:** SQL injection, XSS, exposed secrets, missing auth checks
- **Data safety:** Missing validations, unsafe migrations, data loss risks
- **Error handling:** Uncaught exceptions, missing error boundaries, silent failures
- **Performance:** N+1 queries, missing indexes, large payloads, blocking operations

Every finding includes a confidence score (1-10) and severity (P0-P3).

## Step 6: Bump VERSION

Check and bump VERSION if it exists:

```bash
cat VERSION 2>/dev/null || echo "NO_VERSION_FILE"
```

If VERSION exists and was not modified on this branch, auto-bump PATCH:

```bash
awk -F. '{print $1"."$2"."$3+1}' VERSION > VERSION.tmp && mv VERSION.tmp VERSION
```

If VERSION was already bumped, use as-is.

## Step 7: Update CHANGELOG

If CHANGELOG.md exists, prepend an entry for this version:

```bash
git diff <base>...HEAD --stat
git log <base>..HEAD --oneline
```

Generate a CHANGELOG entry from the diff and commit messages. Lead with what the user can now do. Internal changes go in a "For contributors" subsection.

## Step 8: Commit and Push

```bash
git status
git add -A
git commit -m "release: v$(cat VERSION)

$(git log <base>..HEAD --oneline | sed 's/^/- /')"
git push origin HEAD
```

## Step 9: Create Pull Request

**GitHub:**

```bash
gh pr create \
  --base <base> \
  --title "v$(cat VERSION)" \
  --body "$(cat <<'EOF'
## Summary

$(git log <base>..HEAD --oneline | sed 's/^/- /')

## Test Results

Tests passed locally.

## Changed Files

$(git diff <base>...HEAD --stat)
EOF
)"
```

**GitLab:**

```bash
glab mr create \
  --target-branch <base> \
  --title "v$(cat VERSION)" \
  --description "$(git log <base>..HEAD --oneline | sed 's/^/- /')"
```

Output the PR/MR URL.

## Important Rules

- **Never ship from the base branch.** Feature branches only.
- **Uncommitted changes are always included.** No need to ask.
- **Always run tests before shipping.** Pre-existing failures are flagged but not blocking.
- **Version bumps are automatic.** PATCH for fixes, ask for MINOR or MAJOR.
- **CHANGELOG is auto-generated from diff.** Polish wording but preserve content.
