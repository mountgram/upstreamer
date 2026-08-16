---
name: autoplan
description: |
  Auto-review pipeline: runs the full review pipeline (CEO review → design review →
  eng review → DX review), auto-decides on obvious issues using 6 decision principles,
  and surfaces taste decisions at a final approval gate. Outputs a combined review report.
  Use when asked to "auto review", "autoplan", "run all reviews", or "review this plan
  automatically".
triggers:
  - run all reviews
  - automatic review pipeline
  - auto plan review
  - autoplan
---

# Autoplan: Auto-Review Pipeline

One command. Plan in, fully reviewed plan out. Autoplan runs the full review pipeline — CEO, design, eng, DX — at full depth, auto-deciding on obvious issues and surfacing taste decisions at a final approval gate.

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime. Lead with the point. Be concrete. Be direct about quality. No em dashes. No AI vocabulary.

## The 6 Decision Principles

These rules auto-answer every intermediate question:

1. **Choose completeness** — Ship the whole thing. Pick the approach that covers more edge cases.
2. **Boil lakes** — Fix everything in the blast radius (files modified by this plan + direct importers). Auto-approve expansions in blast radius and under 1 day of effort.
3. **Pragmatic** — If two options fix the same thing, pick the cleaner one. 5 seconds choosing, not 5 minutes.
4. **DRY** — Duplicates existing functionality? Reject. Reuse what exists.
5. **Explicit over clever** — 10-line obvious fix > 200-line abstraction. Pick what a new contributor reads in 30 seconds.
6. **Bias toward action** — Merge > review cycles > stale deliberation. Flag concerns but don't block.

**Conflict resolution (context-dependent):**
- **CEO phase:** P1 (completeness) + P2 (boil lakes) dominate.
- **Eng phase:** P5 (explicit) + P3 (pragmatic) dominate.
- **Design phase:** P5 (explicit) + P1 (completeness) dominate.

## Decision Classification

Every auto-decision is classified:

**Mechanical** — one clearly right answer. Auto-decide silently.

**Taste** — reasonable people could disagree. Auto-decide with recommendation, but surface at the final gate. Three natural sources:
1. **Close approaches** — top two are both viable with different tradeoffs.
2. **Borderline scope** — in blast radius but 3-5 files, or ambiguous radius.
3. **Cross-model disagreements** — different reviewers disagree with valid points.

**User Challenge** — both reviewers agree the user's stated direction should change. Never auto-decided. Goes to the final approval gate with full context.

## Sequential Execution

Phases MUST execute in strict order: CEO → Design → Eng → DX. Each phase MUST complete fully before the next begins. Never run phases in parallel — each builds on the previous.

## Phase 0: Intake

### Read context

```bash
git log --oneline -30
git diff <base> --stat
```

Read CLAUDE.md, TODOS.md, and any plan file. Assess scope:
- **UI scope:** Does the plan involve screens, pages, components, forms, layouts?
- **DX scope:** Does the plan involve APIs, CLIs, SDKs, developer tools, docs?

### Load review skills

Read each review skill file from disk to understand methodology. You will follow each skill's review sections at full depth.

When following a loaded skill file, SKIP these sections — they are already handled by autoplan:
- Scope gate (autoplan's intake already determined the review target)
- AskUserQuestion Format (autoplan auto-decides via the 6 principles)

If a loaded skill spawns a subagent (e.g. a Codex second voice), pass `run_in_background: false` explicitly — subagents may run in the background by default, and all review voices must complete before the consensus summary.

## Phase 1: CEO Review (Strategy and Scope)

Review dimensions:
1. **Premise challenge:** Are the premises valid or assumed? Which could be wrong?
2. **Problem framing:** Is this the right problem to solve? Could a reframing yield 10x impact?
3. **Alternatives:** What alternatives were dismissed too quickly?
4. **Scope calibration:** What scope decisions will look foolish in 6 months?
5. **Competitive/market risks:** What's unaddressed?
6. **6-month trajectory:** Is the plan heading toward the right outcome?

**Auto-decide rules:**
- Mode: SELECTIVE EXPANSION
- Premises: accept reasonable ones (P6), challenge only clearly wrong ones. **GATE: Present premises to user for confirmation** — this is NOT auto-decided.
- Alternatives: pick highest completeness (P1). If tied, pick simplest (P5). If top 2 are close → mark TASTE DECISION.
- Scope expansion: in blast radius + <1d effort → approve (P2). Outside → defer to TODOS.md (P3). Duplicates → reject (P4). Borderline → mark TASTE DECISION.

**Required outputs:**
- "NOT in scope" section with deferred items and rationale
- "What already exists" section mapping sub-problems to existing code
- Dream state delta (where this plan leaves us vs 12-month ideal)
- Completion Summary

## Phase 2: Design Review (conditional — skip if no UI scope)

Follow the plan-design-review methodology. Review all 7 dimensions:
1. Information Architecture
2. Interaction State Coverage
3. User Journey and Emotional Arc
4. AI Slop Risk
5. Design System Alignment
6. Responsive and Accessibility
7. Unresolved Design Decisions

**Auto-decide rules:**
- Focus areas: all relevant dimensions (P1)
- Structural issues (missing states, broken hierarchy): auto-fix (P5)
- Aesthetic/taste issues: mark TASTE DECISION
- Design system alignment: auto-fix if DESIGN.md exists and fix is obvious

If no UI scope detected, skip this phase entirely.

## Phase 3: Eng Review (Architecture and Code Quality)

Review dimensions:
1. **Architecture:** Component structure, coupling, scaling, security
2. **Code quality:** DRY violations, naming, complexity
3. **Test review:** Every codepath mapped to coverage. Gaps identified.
4. **Performance:** N+1 queries, memory, caching, slow paths
5. **Error handling:** What breaks under load? Nil/empty/error paths?
6. **Deployment risk:** Migration safety, rollback plan, dependencies

**Auto-decide rules:**
- Architecture: explicit over clever (P5)
- Scope challenge: never reduce (P2)
- Evals: always include all relevant suites (P1)

**Required outputs:**
- Architecture ASCII diagram
- Test coverage mapping
- Failure modes registry
- Completion Summary

## Phase 3.5: DX Review (conditional — skip if no developer-facing scope)

If DX scope was NOT detected, skip this phase.

Review dimensions:
1. **Time to Hello World:** how many steps from zero to working?
2. **API/CLI design:** naming consistency, sensible defaults, progressive disclosure
3. **Error handling:** every error specifies problem + cause + fix
4. **Documentation:** copy-paste examples, findability, information architecture
5. **Getting started friction:** fewer steps (P5, simpler over clever)

## Phase 4: Final Approval Gate

Present the final state to the user:

```
## Autoplan Review Complete

### Plan Summary
[1-3 sentence summary]

### Decisions Made: [N] total ([M] auto-decided, [K] taste choices, [J] user challenges)

### User Challenges
[For each: what user said, what both reviews recommend, why, what context we might be missing]

### Taste Decisions
[For each: recommendation, alternatives, downstream impact]

### Auto-Decided: [M] decisions

### Review Scores
- CEO: [summary]
- Design: [summary or "skipped, no UI scope"]
- Eng: [summary]
- DX: [summary or "skipped"]

### Cross-Phase Themes
[Concerns appearing in 2+ phases independently]
```

Gate options:
- **A)** Approve as-is (accept all recommendations)
- **B)** Approve with overrides (specify which taste decisions to change)
- **C)** Interrogate (ask about any specific decision)
- **D)** Revise (the plan itself needs changes)
- **E)** Reject (start over)

## Important Rules

- **Never abort.** The user chose autoplan. Respect that choice. Surface all taste decisions, never redirect to interactive review.
- **Two gates.** The non-auto-decided questions are: (1) premise confirmation in Phase 1, and (2) User Challenges — when both reviews agree the user's stated direction should change.
- **Full depth means full depth.** Do not compress or skip sections. A one-sentence summary of a section is not "full depth."
- **Artifacts are deliverables.** Architecture diagrams, test mappings, registries — these must exist on disk or in the plan file when the review completes.
- **Sequential order.** CEO → Design → Eng → DX. Each phase builds on the last.
