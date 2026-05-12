---
name: document-release
description: |
  Post-ship documentation update. Cross-references the diff against documentation files,
  updates README, relevant docs, and CHANGELOG, checks if code changes affect features
  described in docs, and cleans up TODOS.md. Use when asked to "update the docs",
  "sync documentation", or "post-ship docs". Proactively suggest after code is shipped.
triggers:
  - update docs after ship
  - document what changed
  - post-ship docs
  - sync documentation
---

# Document Release: Post-Ship Documentation Update

You are running the document-release workflow. This runs after code is shipped (committed, PR exists) but before the PR merges. Your job: ensure every documentation file in the project is accurate, up to date, and written in a clear, user-forward voice.

You are mostly automated. Make obvious factual updates directly. Stop and ask only for risky or subjective decisions.

**Only stop for:**
- Risky/questionable doc changes (narrative, philosophy, security, removals, large rewrites)
- VERSION bump decision (if not already bumped)
- Cross-doc contradictions that are narrative (not factual)

**Never stop for:**
- Factual corrections clearly from the diff
- Adding items to tables/lists
- Updating paths, counts, version numbers
- Fixing stale cross-references
- CHANGELOG voice polish (minor wording adjustments)
- Marking TODOS complete

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime. Lead with the point. Be concrete. Write like you're explaining to a smart person who hasn't seen the code.

## Step 1: Pre-flight and Diff Analysis

1. Check the current branch. If on the base branch, **abort**: "You're on the base branch. Run from a feature branch."

2. Gather context about what changed:

```bash
git diff <base>...HEAD --stat
git log <base>..HEAD --oneline
git diff <base>...HEAD --name-only
```

3. Discover all documentation files in the repo:

```bash
find . -maxdepth 2 -name "*.md" -not -path "./.git/*" -not -path "./node_modules/*" | sort
```

4. Classify changes into categories:
   - **New features** — new files, new commands, new capabilities
   - **Changed behavior** — modified services, updated APIs, config changes
   - **Removed functionality** — deleted files, removed commands
   - **Infrastructure** — build system, test infrastructure, CI

## Step 2: Per-File Documentation Audit

Read each documentation file and cross-reference it against the diff. Use these generic heuristics:

**README.md:**
- Does it describe all features and capabilities visible in the diff?
- Are install/setup instructions consistent with the changes?
- Are examples, demos, and usage descriptions still valid?
- Are troubleshooting steps still accurate?

**ARCHITECTURE.md:**
- Do ASCII diagrams and component descriptions match the current code?
- Are design decisions and "why" explanations still accurate?
- Be conservative — only update things clearly contradicted by the diff.

**CONTRIBUTING.md — New contributor smoke test:**
- Walk through the setup instructions as if you are a brand new contributor.
- Are the listed commands accurate? Would each step succeed?
- Do test tier descriptions match the current test infrastructure?
- Flag anything that would fail or confuse a first-time contributor.

**CLAUDE.md / project instructions:**
- Does the project structure section match the actual file tree?
- Are listed commands and scripts accurate?
- Do build/test instructions match what's in the project configuration?

**Any other .md files:**
- Read the file, determine its purpose and audience.
- Cross-reference against the diff to check if it contradicts anything.

For each file, classify needed updates:
- **Auto-update** — Factual corrections clearly warranted by the diff
- **Ask user** — Narrative changes, section removal, security model changes, large rewrites (>10 lines)

## Step 3: Apply Auto-Updates

Make all clear, factual updates directly. For each file modified, output what specifically changed — not just "Updated README.md" but "README.md: added /new-command to commands table, updated count from 9 to 10."

**Never auto-update:**
- README introduction or project positioning
- ARCHITECTURE philosophy or design rationale
- Security model descriptions
- Do not remove entire sections from any document

## Step 4: Ask About Risky/Questionable Changes

For each risky or questionable update, present:
- Context: which doc file, what we're reviewing
- The specific documentation decision
- Recommendation with one-line reason
- Options including "Skip — leave as-is"

## Step 5: CHANGELOG Voice Polish

**CRITICAL — NEVER CLOBBER CHANGELOG ENTRIES.** This step polishes voice. It does NOT rewrite, replace, or regenerate CHANGELOG content.

**Rules:**
1. Read the entire CHANGELOG.md first. Understand what is already there.
2. Only modify wording within existing entries. Never delete, reorder, or replace entries.
3. Never regenerate a CHANGELOG entry from scratch.
4. If an entry looks wrong or incomplete, ask — do not silently fix it.

**If CHANGELOG was modified in this branch**, review the entry for voice:
- Would a user reading each bullet think "oh nice, I want to try that"? If not, rewrite wording.
- Lead with what the user can now do — not implementation details.
- "You can now..." not "Refactored the..."
- Internal/contributor changes belong in a "For contributors" subsection.

## Step 6: Cross-Doc Consistency and Discoverability Check

1. Does README's feature list match what CLAUDE.md describes?
2. Does ARCHITECTURE's component list match CONTRIBUTING's project structure?
3. Does CHANGELOG's latest version match the VERSION file?
4. **Discoverability:** Is every documentation file reachable from README.md or CLAUDE.md? Every doc should be discoverable from one of the two entry-point files.
5. Flag any contradictions between documents. Auto-fix clear factual inconsistencies. Ask about narrative contradictions.

## Step 7: TODOS.md Cleanup

If TODOS.md does not exist, skip this step.

1. **Completed items not yet marked:** Cross-reference the diff against open TODO items. If a TODO is clearly completed, move it to the Completed section with version and date. Be conservative — only mark items with clear evidence in the diff.

2. **Items needing description updates:** If a TODO references files or components that were significantly changed, its description may be stale. Ask whether to update, complete, or leave as-is.

3. **New deferred work:** Check the diff for `TODO`, `FIXME`, `HACK`, and `XXX` comments. For each representing meaningful deferred work, ask whether it should be captured in TODOS.md.

## Step 8: VERSION Bump

**CRITICAL — NEVER BUMP VERSION WITHOUT ASKING.**

1. Check if VERSION was already modified on this branch:

```bash
git diff <base>...HEAD -- VERSION
```

2. If VERSION was NOT bumped, ask with recommendation to skip (docs-only changes rarely warrant a version bump).

3. If VERSION was already bumped, verify it covers the full scope of changes. If significant changes are uncovered, ask whether to bump again.

## Step 9: Commit and Output

**Empty check first:**

```bash
git status
```

If no documentation files were modified, output "All documentation is up to date." and exit.

**Commit:**

```bash
git add <specific doc files>
git commit -m "docs: update project documentation for v$(cat VERSION)"
git push origin HEAD
```

### PR/MR body update

Update the PR body with a `## Documentation` section listing each file modified and what specifically changed.

```bash
gh pr view --json body -q .body > /tmp/pr-body-$$.md
# Append or replace ## Documentation section
gh pr edit --body-file /tmp/pr-body-$$.md
rm /tmp/pr-body-$$.md
```

### Structured doc health summary

```
Documentation health:
  README.md       [status] ([details])
  ARCHITECTURE.md [status] ([details])
  CONTRIBUTING.md [status] ([details])
  CHANGELOG.md    [status] ([details])
  TODOS.md        [status] ([details])
  VERSION         [status] ([details])
```

Where status is one of: Updated, Current, Voice polished, Not bumped, Already bumped, Skipped.

## Important Rules

- **Read before editing.** Always read the full content of a file before modifying it.
- **Never clobber CHANGELOG.** Polish wording only. Never delete, replace, or regenerate entries.
- **Never bump VERSION silently.** Always ask.
- **Be explicit about what changed.** Every edit gets a one-line summary.
- **Generic heuristics, not project-specific.** The audit checks work on any repo.
- **Discoverability matters.** Every doc file should be reachable from README or CLAUDE.md.
- **Voice: clear, user-forward.** Write like you're explaining to a smart person who hasn't seen the code.
