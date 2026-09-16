---
name: autoplan
description: |
  Auto-review pipeline: runs the full review pipeline (CEO review → design review →
  DX review → eng review, eng always last), auto-decides on obvious issues using 6
  decision principles, and surfaces taste decisions at a final approval gate. Outputs
  a combined review report. Use when asked to "auto review", "autoplan", "run all
  reviews", or "review this plan automatically".
triggers:
  - run all reviews
  - automatic review pipeline
  - auto plan review
  - autoplan
---

# Autoplan: Auto-Review Pipeline

One command. Plan in, fully reviewed plan out. Autoplan runs the full review pipeline — CEO, design, DX, eng — at full depth, auto-deciding on obvious issues and surfacing taste decisions at a final approval gate.

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

**Mechanical** — one clearly right answer. Auto-decide silently. Examples: run the evals (always yes), reduce scope on a complete plan (always no).

**Taste** — reasonable people could disagree. Auto-decide with recommendation, but surface at the final gate. Three natural sources:
1. **Close approaches** — top two are both viable with different tradeoffs.
2. **Borderline scope** — in blast radius but 3-5 files, or ambiguous radius.
3. **Reviewer disagreements** — different reviewers disagree with valid points.

**User Challenge** — reviewers agree the user's stated direction should change (merge, split, add, or remove features the user specified). This is qualitatively different from a taste decision. It is NEVER auto-decided.

User Challenges surface at the final approval gate with richer context than taste decisions:
- **What the user said** — their original direction
- **What the reviews recommend** — the change
- **Why** — the reasoning
- **What context we might be missing** — explicit acknowledgment of blind spots
- **If we're wrong, the cost is** — what happens if the user's original direction was right and we changed it

Default to the user's original direction. The reviews must justify changing it.

**Exception:** If the reviews flag the change as a security vulnerability or feasibility blocker (not a preference), the gate explicitly warns: "Both reviews believe this is a security/feasibility risk, not just a preference." The user still decides, but the framing is appropriately urgent.

## What "Auto-Decide" Means

Auto-decide replaces the USER'S answer, not the ANALYSIS. Execute every review section at full interactive depth; answer its questions using the 6 principles.

**Default resolution: the recommended option.** Every question in the loaded review skills resolves to its recommended option; mode selections take the skill's context-dependent default. The 6 principles guide cases with no recommendation and break ties; when a principle argues AGAINST the recommended option, that is a Taste decision — take the recommendation and surface the disagreement at the final gate.

**One exception class — never auto-decided:** User Challenges (when reviews agree the user's stated direction should change), or a premise that looks clearly wrong. These queue and surface at the Final Approval Gate — never as mid-run stops. The user is interrupted exactly once, at the gate. The user always has context the reviews lack.

**You MUST still:**
- READ the actual code, diffs, and files each section references
- PRODUCE every output the section requires (diagrams, tables, registries, artifacts)
- IDENTIFY every issue the section is designed to catch
- DECIDE each issue using the 6 principles (instead of asking the user)
- LOG each decision in the audit trail
- WRITE all required artifacts to disk

**You MUST NOT:**
- Compress a review section into a one-liner table row
- Write "no issues found" without showing what you examined
- Skip a section because "it doesn't apply" without stating what you checked and why
- Produce a summary instead of the required output (e.g., "architecture looks good" instead of the ASCII dependency graph the section requires)

"No issues found" is a valid output for a section — but only after doing the analysis. State what you examined and why nothing was flagged (1-2 sentences minimum). "Skipped" is never valid for a non-skip-listed section.

## Sequential Execution — MANDATORY

Phases MUST execute in strict order: CEO → Design (if UI scope) → DX (if developer-facing scope) → Eng. Eng runs LAST, always, reviewing the final amended plan. Each phase MUST complete fully before the next begins. Never run phases in parallel — each builds on the previous.

A phase is complete only when all its required outputs are written to the plan file. A missing output means the current phase remains open. Headings and promises are not completion.

## Phase 0: Intake

### Read context

```bash
git log --oneline -30
git diff <base> --stat
```

Read CLAUDE.md, TODOS.md, and any plan file. Assess scope:
- **UI scope:** Does the plan involve screens, pages, components, forms, layouts, modals, dashboards, navigation? Require 2+ concrete matches; exclude false positives ("page" alone, "UI" in acronyms).
- **DX scope:** Does the plan involve APIs, CLIs, SDKs, developer tools, docs, or onboarding? Also enable DX when the product is a developer tool (developers install, integrate, or build on it) or an AI agent is the primary user.

### Load review skills

Read each review skill file from disk to understand methodology. You will follow each skill's review sections at full depth. Do not prefetch future phase sections; read each at its phase entry.

Output: "Here's what I'm working with: [plan summary]. UI scope: [yes/no]. DX scope: [yes/no]. Starting the full review pipeline with auto-decisions."

## Phase 1: CEO Review (Strategy & Scope)

**Override rules:**
- Mode selection: SELECTIVE EXPANSION
- Premises: accept reasonable ones (P6). Clearly-wrong or challenged premises are NOT a mid-run stop — queue each as a User-Challenge-shaped item for the Final Approval Gate: what the plan assumes, why it looks wrong, and the cost of proceeding anyway.
- Alternatives: pick highest completeness (P1). If tied, pick simplest (P5). If top 2 are close → mark TASTE DECISION.
- Scope expansion: in blast radius + <1 day effort → approve (P2). Outside → defer to TODOS.md (P3). Duplicates → reject (P4). Borderline (3-5 files) → mark TASTE DECISION.
- All review sections run fully; auto-decide each issue; log every decision.

**Step 0 — run each sub-step and produce its output:**
- **0A:** Premise challenge with specific premises named and evaluated
- **0B:** Existing code leverage map (sub-problems → existing code)
- **0C:** Dream state diagram (CURRENT → THIS PLAN → 12-MONTH IDEAL)
- **0C-bis:** Implementation alternatives table (2-3 approaches with effort/risk/pros/cons)
- **0F:** Mode selection confirmation
- **0D:** Mode-specific analysis with scope decisions logged
- **0E:** Temporal interrogation (HOUR 1 → HOUR 6+)

**Sections 1-10 — for EACH section, run the evaluation criteria from the loaded review skill:**
- Sections WITH findings: full analysis, auto-decide each issue, log to the audit trail
- Sections with NO findings: 1-2 sentences stating what was examined and why nothing was flagged. NEVER compress a section to just its name in a table row.
- Section 11 (Design): run only if UI scope was detected in Phase 0.

**Mandatory outputs from Phase 1:**
- "NOT in scope" section with deferred items and rationale
- "What already exists" section mapping sub-problems to existing code
- Error & Rescue Registry table
- Failure Modes Registry table
- Dream state delta (where this plan leaves us vs 12-month ideal)
- Completion Summary (the full summary table from the CEO skill)

## Phase 2: Design Review (conditional — skip if no UI scope)

**Skip condition:** If UI scope was NOT detected in Phase 0, skip this phase entirely. Log: "Phase 2 skipped — no UI scope detected."

**Override rules:**
- Focus areas: all relevant dimensions (P1)
- Structural issues (missing states, broken hierarchy): auto-fix (P5)
- Aesthetic/taste issues: mark TASTE DECISION
- Design system alignment: auto-fix if DESIGN.md exists and the fix is obvious

Follow the plan-design-review methodology. Rate completeness 0-10. Check DESIGN.md. Map existing patterns. Run all 7 design passes, rating each dimension 0-10 and auto-deciding each issue:
1. Information Architecture
2. Interaction State Coverage
3. User Journey and Emotional Arc
4. AI Slop Risk
5. Design System Alignment
6. Responsive and Accessibility
7. Unresolved Design Decisions

**Mandatory outputs from Phase 2:**
- All 7 dimensions evaluated with scores
- Issues identified and auto-decided
- Design litmus scorecard

## Phase 2.5: DX Review (conditional — skip if no developer-facing scope)

**Skip condition:** If DX scope was NOT detected in Phase 0, skip this phase entirely. Log: "Phase 2.5 skipped — no developer-facing scope detected."

**Override rules:**
- Mode selection: DX POLISH
- Persona: infer from README/docs, pick the most common developer type (P6)
- Magical moment: pick the lowest-effort delivery vehicle that achieves the competitive tier (P5)
- Getting started friction: always optimize toward fewer steps (P5, simpler over clever)
- Error message quality: always require problem + cause + fix (P1, completeness)
- API/CLI naming: consistency wins over cleverness (P5)
- DX taste decisions (e.g., opinionated defaults vs flexibility): mark TASTE DECISION

Review dimensions:
1. **Time to Hello World** — how many steps from zero to working? Target under 5 minutes.
2. **Error messages** — when something goes wrong, does the developer know what, why, and how to fix?
3. **API/CLI design** — are names guessable? Are defaults sensible? Is it consistent?
4. **Documentation** — can a developer find what they need in under 2 minutes? Are examples copy-paste-complete?
5. **Upgrade path** — can developers upgrade without fear? Migration guides? Deprecation warnings?
6. **Dev environment friction** — how many setup steps before the first run?

Rate each dimension 0-10 and auto-decide each issue.

**Mandatory outputs from Phase 2.5:**
- Developer journey map (stage-by-stage table)
- Developer empathy narrative (first-person perspective)
- DX Scorecard with all dimensions scored
- DX Implementation Checklist
- TTHW assessment with target

## Phase 3: Eng Review (always runs, always LAST)

The required gate reviews the final amended plan, so Eng reviews the plan after CEO, design, and DX amendments are applied.

**Override rules:**
- Scope challenge: never reduce (P2)
- Architecture: explicit over clever (P5). A reviewer disagreement with valid reasoning → TASTE DECISION.
- Evals: always include all relevant suites (P1)
- TODOS.md: collect all deferred scope expansions from every prior phase (Eng runs last), and write them.

**Step 0 (Scope Challenge):** Read actual code referenced by the plan. Map each sub-problem to existing code. Run the complexity check. Produce concrete findings.

**Section 1 (Architecture):** Produce an ASCII dependency graph showing new components and their relationships to existing ones. Evaluate coupling, scaling, security.

**Section 2 (Code Quality):** Identify DRY violations, naming issues, complexity. Reference specific files and patterns. Auto-decide each finding.

**Section 3 (Test Review) — NEVER SKIP OR COMPRESS.**
This section requires reading actual code, not summarizing from memory:
- Read the diff or the plan's affected files
- Build the test diagram: list every NEW UX flow, data flow, codepath, and branch
- For EACH item in the diagram: what type of test covers it? Does one exist? Gaps?
- For LLM/prompt changes: which eval suites must run?
- Auto-deciding test gaps means: identify the gap → decide whether to add a test or defer (with rationale and principle) → log the decision. It does NOT mean skipping the analysis.
- Write the test plan artifact to disk.

**Section 4 (Performance):** Evaluate N+1 queries, memory, caching, slow paths.

**Mandatory outputs from Phase 3:**
- "NOT in scope" section
- "What already exists" section
- Architecture ASCII diagram (Section 1)
- Test diagram mapping codepaths to coverage (Section 3)
- Test plan artifact written to disk (Section 3)
- Failure modes registry with critical gap flags
- Completion Summary
- TODOS.md updates (collected from all phases)

## Decision Audit Trail

After each auto-decision, append a row to the plan file:

```markdown
## Decision Audit Trail

| # | Phase | Decision | Classification | Principle | Rationale | Rejected |
|---|-------|----------|----------------|-----------|-----------|----------|
```

Write one row per decision incrementally. This keeps the audit on disk, not accumulated in conversation context.

## Pre-Gate Verification

Before presenting the Final Approval Gate, verify that required outputs were actually produced. Check the plan file for each item.

**Phase 1 (CEO) outputs:**
- [ ] Premise challenge with specific premises named (not just "premises accepted")
- [ ] All applicable review sections have findings OR explicit "examined X, nothing flagged"
- [ ] Error & Rescue Registry table produced (or noted N/A with reason)
- [ ] Failure Modes Registry table produced (or noted N/A with reason)
- [ ] "NOT in scope" section written
- [ ] "What already exists" section written
- [ ] Dream state delta written
- [ ] Completion Summary produced

**Phase 2 (Design) outputs — only if UI scope detected:**
- [ ] All 7 dimensions evaluated with scores
- [ ] Issues identified and auto-decided
- [ ] Design litmus scorecard produced

**Phase 2.5 (DX) outputs — only if DX scope detected:**
- [ ] All dimensions evaluated with scores
- [ ] Developer journey map produced
- [ ] Developer empathy narrative written
- [ ] TTHW assessment with target
- [ ] DX Implementation Checklist produced

**Phase 3 (Eng — final phase) outputs:**
- [ ] Scope challenge with actual code analysis (not just "scope is fine")
- [ ] Architecture ASCII diagram produced
- [ ] Test diagram mapping codepaths to test coverage
- [ ] Test plan artifact written to disk
- [ ] "NOT in scope" section written
- [ ] "What already exists" section written
- [ ] Failure modes registry with critical gap assessment
- [ ] Completion Summary produced

**Cross-phase:**
- [ ] Cross-phase themes section written

**Audit trail:**
- [ ] Decision Audit Trail has at least one row per auto-decision (not empty)

If ANY checkbox is missing, go back and produce the missing output. Max 2 attempts — if still missing after retrying twice, proceed to the gate with a warning noting which items are incomplete. Do not loop indefinitely.

## Phase 4: Final Approval Gate

**STOP here and present the final state to the user.**

```
## Autoplan Review Complete

### Plan Summary
[1-3 sentence summary]

### Decisions Made: [N] total ([M] auto-decided, [K] taste choices, [J] user challenges)

### User Challenges (both reviews disagree with your stated direction)
[For each user challenge:]
**Challenge [N]: [title]** (from [phase])
You said: [user's original direction]
Both reviews recommend: [the change]
Why: [reasoning]
What we might be missing: [blind spots]
If we're wrong, the cost is: [downside of changing]
[If security/feasibility: "Both reviews flag this as a security/feasibility risk, not just a preference."]

Your call — your original direction stands unless you explicitly change it.

### Your Choices (taste decisions)
[For each taste decision:]
**Choice [N]: [title]** (from [phase])
I recommend [X] — [principle]. But [Y] is also viable:
  [1-sentence downstream impact if you pick Y]

### Auto-Decided: [M] decisions [see Decision Audit Trail in plan file]

### Review Scores
- CEO: [summary]
- Design: [summary or "skipped, no UI scope"]
- DX: [summary or "skipped, no developer-facing scope"]
- Eng: [summary]

### Cross-Phase Themes
[For any concern that appeared in 2+ phases independently:]
**Theme: [topic]** — flagged in [Phase 1, Phase 3]. High-confidence signal.
[If no themes span phases:] "No cross-phase themes — each phase's concerns were distinct."

### Deferred to TODOS.md
[Items auto-deferred with reasons]
```

**Cognitive load management:**
- 0 user challenges: skip the "User Challenges" section
- 0 taste decisions: skip the "Your Choices" section
- 1-7 taste decisions: flat list
- 8+: group by phase. Add warning: "This plan had unusually high ambiguity ([N] taste decisions). Review carefully."

Gate options:
- **A)** Approve as-is (accept all recommendations)
- **B)** Approve with overrides (specify which taste decisions to change)
- **B2)** Approve with user challenge responses (accept or reject each challenge)
- **C)** Interrogate (ask about any specific decision)
- **D)** Revise (the plan itself needs changes)
- **E)** Reject (start over)

**Option handling:**
- A: mark APPROVED, suggest the next step (create the PR).
- B: ask which overrides, apply, re-present gate.
- B2: walk the User Challenges one at a time (accept or reject each). Rejected → note the user's direction stands, no plan change. Accepted → amend the plan for that challenge, then re-run Eng on the amended plan (the gate always reviews the final plan), then re-present the gate. Counts toward the same 3-cycle cap as D.
- C: answer freeform, re-present gate.
- D: make changes, re-run affected phases (scope→Phase 1, design→Phase 2, dx→Phase 2.5, test plan→Phase 3, arch→Phase 3; a re-run of any earlier phase re-runs Eng after it — the gate always reviews the final plan). Max 3 cycles.
- E: start over.

## Important Rules

- **Never abort.** The user chose autoplan. Respect that choice. Surface all taste decisions, never redirect to interactive review.
- **One gate.** The only non-auto-decided questions surface at the Final Approval Gate: User Challenges — including clearly-wrong premises queued from Phase 1. Everything else resolves to the recommended option (the 6 principles break ties), so the pipeline never stops mid-run.
- **Log every decision.** No silent auto-decisions. Every choice gets a row in the audit trail.
- **Full depth means full depth.** Do not compress or skip sections from the loaded review skills. "Full depth" means: read the code the section asks you to read, produce the outputs the section requires, identify every issue, and decide each one. A one-sentence summary of a section is not "full depth" — it is a skip. If you catch yourself writing fewer than 3 sentences for any review section, you are likely compressing.
- **Artifacts are deliverables.** Test plan artifact, failure modes registry, error/rescue table, ASCII diagrams — these must exist on disk or in the plan file when the review completes. If they don't exist, the review is incomplete.
- **Sequential order.** CEO → Design (if UI scope) → DX (if developer-facing scope) → Eng, always last. Each phase builds on the last; the required gate reviews the final amended plan.
