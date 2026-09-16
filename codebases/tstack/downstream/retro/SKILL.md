---
name: retro
description: |
  Run a weekly engineering retrospective that analyzes commit history,
  surfaces collaboration patterns, identifies risks, and produces a
  structured shipping report with per-person praise and growth areas.
triggers:
  - "run retro"
  - "weekly retro"
  - "sprint retrospective"
  - "team retro"
  - "run a retrospective"
  - "retrospective report"
  - "ship review"
---

# Weekly Engineering Retrospective

Run a data-driven weekly retrospective on the current git repository. This
skill analyzes commit history, work patterns, shipping cadence, and
collaboration dynamics, then produces a structured report with per-person
recognition, risk identification, and team-wide metrics.

## Voice

Write like a thoughtful engineering manager who knows the team personally,
celebrates wins with genuine enthusiasm, and frames growth areas as
opportunities rather than failures. Be specific — name names, cite commits,
and ground every observation in data. Avoid generic praise. Call out quiet
contributors who might not be visible in standup. When identifying risks, be
direct but solution-oriented: name the problem, explain why it matters, and
suggest a concrete next step.

- Encouraging but candid, no coddling.
- Specific and concrete — always anchor in actual commits/code.
- Skip generic praise ("great job!") — say exactly what was good and why.
- Frame improvements as leveling up, not criticism.
- Praise should feel like something you'd actually say in a 1:1 — specific, earned, genuine.
- Growth suggestions should feel like investment advice — "this is worth your time because..." not "you failed at...".
- Never compare teammates against each other negatively. Each person's section stands on its own.

## AskUserQuestion Format

Use numbered one-shot questions when you need the team to fill in context
that git history cannot provide. Each question must be answerable
independently. Post them as a single block.

Example:

```
1. What was the team's biggest unplanned work item this week?
   A) Production incident / hotfix
   B) Ad-hoc stakeholder request
   C) Dependency / infra breakage
   D) Other: _______

2. Is there context the commits won't show?
   (free text)
```

## Data Collection

Run these commands to gather the raw data for analysis. Adjust date ranges
to cover the retrospective period (default: last 7 days).

```bash
# Commit log with author, date, and subject for the period
git log --since="7 days ago" --format="%h %an %ad %s" --date=short

# Per-author commit counts
git shortlog --since="7 days ago" -sn

# Per-author diff stats (lines added/removed)
git log --since="7 days ago" --format="%an" --numstat | awk '
  /^[0-9]/ { adds[$NF]+=$1; dels[$NF]+=$2 }
  /^[a-zA-Z]/ && !/^[0-9]/ { author=$0 }
  END { for (a in adds) print adds[a], dels[a], a }
' | sort -rn

# Pull requests created in the period
gh pr list --search "created:>=<start-date>" \
  --state merged,open,closed --limit 100 \
  --json number,title,author,state,mergedAt,createdAt

# Pull requests reviewed (approvals, comments)
gh pr list --search "updated:>=<start-date>" \
  --state merged --limit 100 \
  --json number,title,author,reviews

# Active branches (excluding main/master)
git branch -a --format="%(refname:short) %(authordate:short) %(authorname)" \
  | grep -v 'main\|master' | sort

# Stale branches (no commits in 14+ days)
for branch in $(git branch -a --format="%(refname:short)" \
  | grep -v 'main\|master'); do
  last_commit=$(git log -1 --format="%cd" --date=short "$branch" 2>/dev/null)
  echo "$last_commit $branch"
done | sort

# Commit type mix (conventional commits)
git log --since="7 days ago" --format="%s" | grep -oE '^(feat|fix|refactor|test|chore|docs)' | sort | uniq -c

# Commit time distribution (local time)
git log --since="7 days ago" --format="%ad" --date=format:"%H" | sort | uniq -c
```

## Analysis Framework

### Per-Person Contribution Analysis

For each contributor who appears in the commit log, build a profile:

- **Commit count** and total diff volume (lines added/deleted)
- **PRs opened, merged, and reviewed**
- **Primary focus areas** inferred from paths changed (e.g., frontend, backend, infra, docs)
- **Work pattern:** consistent daily commits vs. bursty, weekend work, time-of-day distribution
- **Collaboration:** who they reviewed, who reviewed them, co-authored commits

### Shipping Streaks

Identify:

- How many days this week had at least one merge to the primary branch?
- Longest streak of consecutive shipping days this period
- Average time from PR open to merge
- PRs that sat unreviewed for more than 24 hours

### Collaboration Graph

Build a matrix showing who worked with whom:

- Co-authored commits
- PR review pairs (author ← reviewer)
- Shared file paths (two authors touching the same file)

## Output

Produce the retrospective in this order, delivering the narrative directly
to the user in the conversation. The only file written is a local JSON
snapshot (optional; keep it out of the conversation).

**Tweetable summary** (first line, before everything else):

```
Week of Mar 1: 47 commits (3 contributors), 3.2k LOC, 38% tests, 12 PRs, peak: 10pm | Streak: 47d
```

### 1. Summary Table

| Metric | Value |
|--------|-------|
| **Features shipped** (from CHANGELOG + merged PR titles) | N |
| Commits | N |
| Contributors | N |
| PRs merged | N |
| Lines added / removed | +N / -N |
| Test LOC ratio | N% |
| Version range | vX → vY |
| Active days | N |
| Detected sessions | N |

Lead with user-visible features, then commit and LOC metrics. Raw LOC is context, not impact.

Then a per-author leaderboard:

```
Contributor         Commits   +/-          Top area
You (name)              32   +2400/-300   browse/
alice                   12   +800/-150    app/services/
bob                      3   +120/-40     tests/
```

Sort by commits descending; the current user always appears first as "You (name)".

### 2. Trends vs Last Retro

If a prior retro exists for the same window, show deltas:

```
                    Last        Now         Delta
Test ratio:         22%    →    41%         ↑19pp
Sessions:           10     →    14          ↑4
Fix ratio:          54%    →    30%         ↓24pp (improving)
Commits:            32     →    47          ↑47%
```

If no prior retro exists, skip and append: "First retro recorded — run again next week to see trends."

### 3. Time & Session Patterns

Narrative interpreting what the team-wide patterns mean: when the most
productive hours are and what drives them, whether sessions are getting
longer or shorter, estimated hours per day of active coding, and whether
team members code at the same time or in shifts. Call out peak hours, dead
zones, bimodal vs. continuous patterns, and late-night clusters (after 10pm).

### 4. Shipping Velocity

Narrative covering commit type mix and what it reveals, PR size
distribution (small <100 / medium 100-500 / large 500-1500 / XL 1500+ LOC),
fix-chain detection, and version bump discipline. Flag if the fix ratio
exceeds 50% — a "ship fast, fix fast" pattern that may indicate review gaps.

### 5. Code Quality Signals

- Test LOC ratio trend
- Hotspot analysis (are the same files churning?)
- Flag files changed 5+ times as churn hotspots

### 6. Test Health

- Total test files and how many changed this period
- Regression test commits (e.g. `test(qa):`, `test: coverage`)
- If test ratio < 20%, flag as a growth area: "100% test coverage is the goal. Tests make vibe coding safe."

### 7. Focus & Highlights

- Focus score: percentage of file changes in the single busiest top-level directory, with interpretation
- **Ship of the week:** the highest-LOC change, its PR number and title, and why it matters

### 8. Shipping Streaks

Team and personal streaks, including broken-streak disclosure.

### 9. Risk Radar

| Risk | Signal | Consequence |
|---|---|---|
| **Bus factor** | One person owns >50% of changed files | Knowledge concentration; single point of failure |
| **Stale branches** | Branches with no commits in 14+ days | Work in progress that may be abandoned or conflict-prone |
| **Unreviewed merges** | PRs merged without approval | Quality risk; bypassed process |
| **Late-night commits** | Pattern of commits after 10 PM | Burnout risk |
| **Large PRs** | PRs with >500 line diffs | Slow review cycle; integration risk |
| **No deployments** | Merges but no production deploys | Delivery pipeline bottleneck |
| **Dependency drift** | Package files modified without lockfile updates | Reproducibility risk |

For each flag raised, provide a concrete, non-judgmental recommendation.

### 10. Collaboration Radar

```
## Top Collaborators
| Pair | Interactions | Type |
|---|---|---|
| Alice — Bob | 8 | co-authored + reviews |

## Review Balance
| Reviewer | Reviews Given | Reviews Received |
|---|---|---|

## Siloed Contributors
(developers who authored without being reviewed, or reviewed without
being reviewed — flag as a coaching opportunity)
```

### 11. Your Week (personal deep-dive)

For the current user only. Include: their commit count, LOC, test ratio,
session patterns and peak hours, focus areas, biggest ship, **what you did
well** (2-3 specific things anchored in commits), and **where to level up**
(1-2 specific, actionable suggestions).

### 12. Team Breakdown

For each teammate (sorted by commits descending), write a section:

#### [Name]
- **What they shipped**: 2-3 sentences on their contributions, areas of focus, and commit patterns
- **Praise**: 1-2 specific things they did well, anchored in actual commits. Examples:
  - "Cleaned up the entire auth module in 3 small, reviewable PRs — textbook decomposition"
  - "Added integration tests for every new endpoint, not just happy paths"
- **Opportunity for growth**: 1 specific, constructive suggestion, framed as investment. Examples:
  - "Test coverage on the payment module is at 8% — worth investing in before the next feature lands on top of it"
  - "All commits land between 1-4am — sustainable pace matters for code quality long-term"

Sort contributors by impact (PRs merged, then commit volume). Include everyone,
not just the top performers. For contributors with zero commits or merges,
acknowledge them with a note (e.g., "on leave," "focused on design work")
rather than silently omitting them.

**AI collaboration note:** if many commits have `Co-Authored-By` AI trailers,
note the AI-assisted commit percentage neutrally — "N% of commits were
AI-assisted" — without judgment.

### 13. Top 3 Team Wins

The 3 highest-impact things shipped in the window across the whole team. For
each: what it was, who shipped it, why it matters (product/architecture
impact).

### 14. 3 Things to Improve

Specific, actionable, anchored in actual commits. Mix personal and team-level
suggestions. Phrase as "to get even better, the team could..."

### 15. 3 Habits for Next Week

Small, practical, realistic. Each must take <5 minutes to adopt. At least one
should be team-oriented (e.g., "review each other's PRs same-day").

### 16. Reflections

```
## Wins
- (What went well this week? Be specific.)

## Misses
- (What didn't go as planned? Be honest, not punitive.)

## Pivots
- (What should we change for next week?)
```

### 17. Weekly Scorecard

```
| Metric | This Week | Last Week | Trend |
|---|---|---|---|
| PRs merged | _ | _ | ↑ / ↓ / → |
| PRs opened | _ | _ | |
| Avg. review time | _h | _h | |
| Contributors active | _ | _ | |
| Incidents / hotfixes | _ | _ | |
| Days with merges | _/5 | _/5 | |
| Stale branches | _ | _ | |
| Bus factor risk | _/10 | _/10 | |

**Overall Health:** 🟢 Green / 🟡 Yellow / 🔴 Red
```

## Important Rules

- All narrative output goes directly to the user in the conversation. The only file written is a local JSON snapshot.
- Display all timestamps in the user's local timezone.
- If there are zero commits, say so and suggest a different window.
- Treat merge commits as PR boundaries.
- On first run (no prior retro), skip saved-history comparisons gracefully.
