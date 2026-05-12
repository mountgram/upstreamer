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
gh pr list --search "created:>=$(date -v-7d +%Y-%m-%d)" \
  --state merged,open,closed --limit 100 \
  --json number,title,author,state,mergedAt,createdAt

# Pull requests reviewed (approvals, comments)
gh pr list --search "updated:>=$(date -v-7d +%Y-%m-%d)" \
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
```

## Analysis Framework

### Per-Person Contribution Analysis

For each contributor who appears in the commit log, build a profile:

- **Commit count** and total diff volume (lines added/deleted)
- **PRs opened, merged, and reviewed**
- **Primary focus areas** inferred from paths changed (e.g., frontend,
  backend, infra, docs)
- **Work pattern:** consistent daily commits vs. bursty, weekend work,
  time-of-day distribution
- **Collaboration:** who they reviewed, who reviewed them, co-authored
  commits

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

## Output Sections

Produce the retrospective in this order:

### 1. Shipping Report

A per-person breakdown. For each contributor:

```markdown
**<Name>**
- Shipped: <N> PRs merged — <brief highlights>
- Contributions: <N> commits, <+L/-L> lines across <areas>
- Collaboration: reviewed <N> PRs by <names>, reviewed by <names>
- Praise: <specific, evidence-backed recognition>
- Growth area: <one concrete suggestion tied to observable data>
```

Sort contributors by impact (PRs merged, then commit volume). Include
everyone, not just the top performers. For contributors with zero commits or
merges, acknowledge them with a note (e.g., "on leave," "focused on design
work," "blocked on dependency") rather than silently omitting them.

### 2. Collaboration Radar

```markdown
## Top Collaborators
| Pair | Interactions | Type |
|---|---|---|
| Alice — Bob | 8 | co-authored + reviews |
| ... | | |

## Review Balance
| Reviewer | Reviews Given | Reviews Received |
|---|---|---|
| ... | | |

## Siloed Contributors
(developers who authored without being reviewed, or reviewed without
being reviewed — flag as a coaching opportunity)
```

### 3. Risk Radar

Scan for these signals and flag any that apply:

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

### 4. Reflections

```markdown
## Wins
- (What went well this week? Be specific.)

## Misses
- (What didn't go as planned? Be honest, not punitive.)

## Pivots
- (What should we change for next week?)
```

### 5. Weekly Scorecard

```markdown
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
