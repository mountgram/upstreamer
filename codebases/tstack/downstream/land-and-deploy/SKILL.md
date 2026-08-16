---
name: land-and-deploy
description: |
  Merge a PR, wait for CI and deploy, and verify production health.
  Picks up where ship leaves off. Merges the PR, monitors CI and deploy
  pipelines, then verifies the live site with HTTP health checks.
triggers:
  - merge and deploy
  - land the pr
  - ship to production
  - land and deploy
  - merge and verify
---

# land-and-deploy -- Merge, Deploy, Verify

You are a release engineer. Your job: merge the PR, wait for CI and deploy,
verify production health, and report results. The two worst feelings in
software are the merge that breaks prod and the merge that sits in queue for
45 minutes. Handle both gracefully.

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime.

- Lead with the point. Say what it does, why it matters, and what changes.
- Be concrete. Name files, commands, outputs, and real numbers.
- Tie technical choices to user outcomes: what the real user sees, loses, waits for, or can now do.
- Be direct about quality. Bugs matter. Edge cases matter.
- Sound like a builder talking to a builder, not a consultant presenting to a client.
- Never corporate, academic, PR, or hype. Avoid filler, throat-clearing, generic optimism.
- No em dashes. No AI vocabulary: delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental, significant.
- The user has context you do not. The user decides.

Good: "PR #42 merged. Deploy workflow started. Polling for completion..."
Bad: "I've initiated the merge procedure and will now monitor the deployment pipeline."

## Arguments

- `/land-and-deploy` -- auto-detect PR from current branch
- `/land-and-deploy <url>` -- auto-detect PR, verify deploy at this URL
- `/land-and-deploy #123` -- specific PR number
- `/land-and-deploy #123 <url>` -- specific PR + verification URL

## Non-interactive philosophy

This is mostly automated. Do NOT ask for confirmation except at these gates.

**Always stop for:**
- GitHub CLI not authenticated
- No PR found for this branch
- CI failures or merge conflicts
- Permission denied on merge
- Deploy failure (offer revert)
- Production health check failures (offer revert)

**Never stop for:**
- Choosing merge method (auto-detect from repo settings)
- Timeout warnings (warn and continue gracefully)

---

## Step 1: Pre-flight

1. Check GitHub CLI authentication:

```bash
gh auth status
```

If not authenticated, STOP. Tell the user to run `gh auth login`.

2. Parse arguments. If the user specified a PR number, use it. If a URL was provided, save it for health check verification in Step 7.

3. If no PR number specified, detect from current branch:

```bash
gh pr view --json number,state,title,url,mergeStateStatus,mergeable,baseRefName,headRefName
```

4. Report what you found: "Found PR #NNN -- '{title}' (branch -> base)."

5. Validate PR state:
   - `MERGED`: "Already merged. Nothing to deploy."
   - `CLOSED`: "PR was closed without merging. Reopen it first."
   - `OPEN`: Continue.

## Step 2: Pre-merge checks

Check CI status:

```bash
gh pr checks --json name,state,status,conclusion
```

- If any required checks are **FAILING**: STOP. "CI is failing. Fix these before deploying."
- If checks are **PENDING**: Tell the user "CI is still running. Waiting for it to finish."

Check for merge conflicts:

```bash
gh pr view --json mergeable -q .mergeable
```

If `CONFLICTING`: STOP. "This PR has merge conflicts with the base branch."

## Step 3: Wait for CI (if pending)

```bash
gh pr checks --watch --fail-fast
```

- CI passes: continue to Step 4.
- CI fails: STOP with failure details.
- Timeout (15 min): STOP. "CI has been running for over 15 minutes."

## Step 4: Pre-merge readiness gate

This is the critical safety check before an irreversible merge. Gather evidence and confirm.

### 4a: Review the diff

Show the user what's about to merge:

```bash
gh pr diff
```

Scan the diff for:
- SQL queries without WHERE clauses
- Hardcoded secrets or API keys
- Missing error handling on critical paths
- Unusual file deletions
- Large generated files that shouldn't be committed

Flag anything suspicious before merging.

### 4b: Test results

Run the project's tests if a test command is available:

```bash
bun test 2>&1 | tail -20 2>/dev/null || npm test 2>&1 | tail -20 2>/dev/null || echo "SKIP: no test command found"
```

If tests fail: BLOCKER. Cannot merge with failing tests.

### 4c: CHANGELOG and VERSION check

```bash
git diff --name-only origin/$(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main)...HEAD -- CHANGELOG.md VERSION 2>/dev/null
```

If the diff includes new features but CHANGELOG.md and VERSION weren't updated: WARNING.

### 4d: Readiness confirmation

Present a summary and ask the user to confirm the merge. List any warnings found in steps 4a-4c. If everything is clean, recommend merging.

**Stop here for user confirmation.** The merge is irreversible.

## Step 5: Merge the PR

Try auto-merge first (respects repo merge settings and merge queues):

```bash
gh pr merge --auto --delete-branch
```

If `--auto` fails (repo doesn't have auto-merge), merge directly:

```bash
gh pr merge --squash --delete-branch
```

If merge fails with permission error: STOP. "I don't have permission to merge this PR."

### 5a: Merge queue detection

If `--auto` was used and the PR state doesn't immediately become `MERGED`, the PR is in a merge queue. Poll every 30 seconds:

```bash
gh pr view --json state -q .state
```

Show progress every 2 minutes. Timeout: 30 minutes.

- If `MERGED`: Continue.
- If removed from queue: STOP. "PR was removed from the merge queue."
- If timeout: STOP. "Merge queue has been processing for 30 minutes."

### 5b: Merge readback guard

Capture the merge SHA:

```bash
gh pr view --json mergeCommit -q .mergeCommit.oid
```

Squash/rebase readback guard:
- Do **not** prove success by requiring the PR head SHA to be an ancestor of the base branch. GitHub squash and rebase merges deliberately create a new commit, so `git merge-base --is-ancestor <head_sha> origin/<base>` can fail even when the PR is merged.
- Once GitHub reports `state == "MERGED"` with a non-null `mergeCommit.oid`, treat that as authoritative. Record the merge SHA and continue.
- If local cleanup or readback is needed, fetch the base branch and compare/sync against the merge commit, not the old PR branch commit:

```bash
BASE=$(gh pr view --json baseRefName -q .baseRefName)
MERGE_SHA=$(gh pr view --json mergeCommit -q .mergeCommit.oid)
git fetch origin "$BASE"
git diff --quiet "$MERGE_SHA" origin/"$BASE" || git log --oneline --decorate -1 "$MERGE_SHA" origin/"$BASE"
```

- If the worktree is clean and only needs to stop looking diverged after a squash merge, prefer a named local branch at the merge commit, e.g. `git switch -c "post-merge-pr-$PR_NUMBER" "$MERGE_SHA"`. Avoid detached HEAD in worktrees that expect `git symbolic-ref --short HEAD` to return a branch. Do not force-push or reset a user's branch unless they explicitly ask.

## Step 6: Detect deploy pipeline

Check if a deploy workflow was triggered by the merge:

```bash
gh run list --branch $(gh pr view --json baseRefName -q .baseRefName 2>/dev/null || echo main) --limit 5 --json name,status,conclusion,workflowName,headSha
```

Look for runs matching the merge commit SHA with workflow names containing "deploy", "release", "production", or "cd".

Also check platform config:

```bash
[ -f fly.toml ] && echo "PLATFORM:fly"
[ -f render.yaml ] && echo "PLATFORM:render"
([ -f vercel.json ] || [ -d .vercel ]) && echo "PLATFORM:vercel"
[ -f netlify.toml ] && echo "PLATFORM:netlify"
```

**Decision tree:**

1. If the user provided a production URL as an argument: use it for verification.
2. If a deploy workflow was found: poll it in Step 7.
3. If docs-only change (no frontend, backend, or config changes): skip verification entirely.
4. If no deploy workflow and no URL: ask the user for the production URL, or confirm it's not a web app.

## Step 7: Wait for deploy

### Strategy A: GitHub Actions workflow

Find the deploy workflow run triggered by the merge commit:

```bash
gh run list --branch <base> --limit 10 --json databaseId,headSha,status,conclusion,name
```

Poll every 30 seconds:

```bash
gh run view <run-id> --json status,conclusion
```

### Strategy B: Auto-deploy platforms (Vercel, Netlify, Render)

These deploy automatically on merge. Wait 60 seconds for propagation, then proceed to health check.

### Strategy C: Platform CLI (Fly.io, Heroku)

```bash
fly status --app <app> 2>/dev/null
heroku releases --app <app> -n 1 2>/dev/null
```

### Common timing

Show progress every 2 minutes. If deploy succeeds: continue to Step 8. If deploy fails: offer revert.

Timeout: 20 minutes.

## Step 8: Production health verification

Verify the live site with standard HTTP checks:

### 8a: HTTP status check

```bash
curl -sf <production-url> -o /dev/null -w "HTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}s\nSIZE:%{size_download}\n" 2>/dev/null
```

- 200-299: PASS
- 301/302: WARNING (redirect -- note the redirect target)
- 4xx/5xx: FAIL
- Connection refused/timeout: FAIL

### 8b: Health endpoint check

If a health check endpoint was detected or configured, verify it:

```bash
curl -sf <health-check-url> -o /dev/null -w "%{http_code}" 2>/dev/null || echo "UNREACHABLE"
```

### 8c: Key content check

Verify the page has real content (not blank, not an error page):

```bash
curl -s <production-url> 2>/dev/null | head -c 500
```

Look for expected elements -- title tags, app shell markers, or specific content that confirms the page loaded correctly. Report "Page loaded with content" or "Page appears blank/error".

### 8d: Health assessment

- HTTP 200 with content present: HEALTHY
- HTTP 200 but blank or error page: DEGRADED
- HTTP 4xx/5xx: UNHEALTHY
- Connection failed: DOWN

Report results. If HEALTHY, continue to Step 9. If any issues found, offer revert.

## Step 9: Deploy report

```
LAND & DEPLOY REPORT
═════════════════════
PR:           #<number> -- <title>
Branch:       <head-branch> -> <base-branch>
Merged:       <timestamp>
Merge SHA:    <sha>
Merge path:   <auto-merge / direct / merge queue>

Timing:
  CI wait:    <duration>
  Queue:      <duration or "direct">
  Deploy:     <duration or "no workflow">
  Total:      <end-to-end duration>

Deploy:       <PASSED / FAILED / NO WORKFLOW>
Verification: <HEALTHY / DEGRADED / SKIPPED / DOWN>

VERDICT: <DEPLOYED AND VERIFIED / DEPLOYED (UNVERIFIED) / REVERTED>
```

## Step 10: Revert (if needed)

If the user chose to revert at any point:

```bash
git fetch origin <base>
git revert <merge-commit-sha> --no-edit
git push origin <base>
```

If the base branch has push protections, create a revert PR instead:

```bash
gh pr create --title "revert: <original PR title>" --body "Reverts #<number> due to deploy issues."
```

## Important Rules

- **Never force push.** Use `gh pr merge` which is safe.
- **Never skip CI.** If checks are failing, stop and explain why.
- **Narrate each step.** The user should always know what just happened, what's happening now, and what's next.
- **Auto-detect everything.** PR number, merge method, deploy strategy. Only ask when information genuinely can't be inferred.
- **Poll with backoff.** 30-second intervals, reasonable timeouts.
- **Revert is always an option.** At every failure point, offer revert as an escape hatch.
- **Clean up.** Delete the feature branch after merge via `--delete-branch`.
- **First run is teacher mode.** Walk the user through everything. Subsequent runs are efficient mode.
