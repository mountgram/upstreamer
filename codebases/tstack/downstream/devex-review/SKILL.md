---
name: devex-review
description: |
  Live developer experience audit for docs, APIs, SDKs, CLIs, and onboarding flows. Use when
  asked to test DX, measure time to hello world, audit onboarding, or review developer docs.
triggers:
  - devex review
  - developer experience audit
  - test the dx
  - measure onboarding time
  - review docs and onboarding
---

# Developer Experience Review

Audit the developer experience by dogfooding it. Do not just read about the flow. Try the documented path when feasible, measure the friction, and separate tested evidence from inferred evidence.

## Scope

Test what the current environment allows:

- Web-accessible surfaces: docs, landing pages, API playgrounds, dashboards, examples, tutorials, and error pages.
- Repository surfaces: README, package metadata, examples, changelog, migration notes, test fixtures, generated types, and setup scripts.
- CLI surfaces: install commands, `--help`, missing-argument behavior, invalid flags, error output, and documented happy paths.

When a dimension cannot be tested directly, mark it `INFERRED` and cite the file, command, or missing artifact that supports the score. Never guess.

## Target Discovery

1. Read project entry points first: `README.md`, docs index, package manifest, CLI help, and any contributor or getting-started guide.
2. Identify the target user, first successful outcome, install/setup command, docs URL, and any required credentials or sample data.
3. If the product URL, docs URL, or intended onboarding path is missing, ask one focused question before scoring the live flow.
4. Note any prior plan, issue, or design doc that promised a DX target such as "hello world in 3 minutes" so you can compare plan vs reality.

## Evidence Rules

- Prefer direct evidence: command output, copied error text, screenshots if native tools provide them, file references, and exact docs URLs.
- Label every score as `TESTED`, `PARTIAL`, or `INFERRED`.
- Record time estimates as observed time when you can run the step; otherwise mark them as estimated from instructions.
- If an auth, billing, private network, or unavailable service blocks testing, state the blocker and score only the observable surface.
- Do not penalize a missing surface twice; explain the root friction once and reference it in affected dimensions.

## Audit Passes

### 1. Getting Started And TTHW

Measure time to hello world: the time from first docs contact to a working minimal success.

Capture:

```text
GETTING STARTED AUDIT
=====================
Step 1: [what developer does]  Time: [observed/estimated]  Friction: [low/medium/high]  Evidence: [file/URL/command]
Step 2: [what developer does]  Time: [observed/estimated]  Friction: [low/medium/high]  Evidence: [file/URL/command]

TTHW: [N minutes, N steps]
Score: __/10
Method: TESTED | PARTIAL | INFERRED
```

Look for missing prerequisites, surprise account creation, unclear copy-paste boundaries, platform assumptions, and setup steps that fail without explanation.

### 2. API/CLI/SDK Ergonomics

Inspect or run what is available:

- CLI: `--help`, command grouping, flag names, defaults, examples, and errors for invalid input.
- API/SDK: naming consistency, minimal example, type hints, return shapes, imports, and discoverability.
- Playground or dashboard: whether the first useful action is obvious and reversible.

Score 0-10 for whether the interface teaches itself under pressure.

### 3. Error Messages

Trigger safe failure modes when possible:

- Missing required arguments.
- Invalid flags or invalid input.
- Missing credentials or unauthenticated access.
- 404 or unsupported route/page.

Good errors say what happened, why it happened, and the next action. Score 0-10 and cite exact output or page text.

### 4. Documentation

Review docs as a new developer:

- Can you find install, quick start, concepts, API reference, and troubleshooting in under two minutes?
- Are examples copy-paste-complete and current?
- Are prerequisites, environment variables, costs, and supported platforms explicit?
- Does search/navigation work for three likely queries?

Score 0-10 and identify the highest-leverage docs fix.

### 5. Upgrade Path

Read changelog, release notes, deprecation warnings, migration guides, and compatibility docs.

Score 0-10 for whether an existing user can safely upgrade without reading source code. Mark `INFERRED` unless you actually perform an upgrade.

### 6. Developer Environment

Evaluate local development setup:

- Install and build commands.
- Test commands and fixture quality.
- TypeScript types or equivalent API contracts.
- Local reproducibility, seed data, mocks, and platform coverage.
- CI signals and whether failures are actionable from local commands.

Score 0-10 with file and command references.

### 7. Community And Ecosystem

Inspect public support and contribution surfaces when relevant:

- Issue templates, discussion links, examples, sample apps, Discord/Slack/forum links.
- Maintainer response patterns if public issues are available.
- Contribution guide and support boundaries.

Score 0-10. If the project is private or internal, adapt this to ownership, escalation path, and team-facing docs.

### 8. DX Measurement

Check whether the project has ways to learn from developer friction:

- Bug report templates that ask for reproduction details.
- Feedback links in docs.
- Support labels or triage process.
- Explicit DX goals, onboarding budgets, or measured setup times.

Score 0-10 from observable artifacts.

## Scorecard

Return a compact scorecard with evidence:

```text
DX LIVE AUDIT SCORECARD
=======================
Dimension              Score   Method    Evidence
Getting Started/TTHW   __/10   TESTED    [steps, time, command/URL]
API/CLI/SDK            __/10   PARTIAL   [help output, API docs, examples]
Error Messages         __/10   TESTED    [exact error text]
Documentation          __/10   TESTED    [docs URLs/files]
Upgrade Path           __/10   INFERRED  [changelog/migration refs]
Developer Environment  __/10   TESTED    [commands/files]
Community/Ecosystem    __/10   INFERRED  [issues/templates/links]
DX Measurement         __/10   INFERRED  [feedback/triage artifacts]

TTHW: __ minutes, __ steps
Overall DX: __/10
```

Use the full 0-10 range. A 10 means a competent developer can succeed quickly without hidden context. A 5 means success is possible but requires guessing, retries, or source spelunking. A 0 means the advertised path is not usable.

## Plan Vs Reality

If a plan, issue, roadmap, or prior review promised DX outcomes, compare the promise to the live result:

```text
PLAN VS REALITY
===============
Dimension       Planned/Claimed       Observed       Delta/Risk
TTHW            [claim]               [observed]     [gap]
Setup           [claim]               [observed]     [gap]
Docs            [claim]               [observed]     [gap]
Errors          [claim]               [observed]     [gap]
```

Flag any dimension where reality is meaningfully worse than the plan or README claim.

## Findings

Findings first, ordered by developer time lost and likelihood:

```text
1. [Severity] [Problem]
Evidence: [command output, URL, file:line]
Impact: [who gets stuck and how much time they lose]
Fix: [specific product/docs/code change]
Verification: [how to prove the fix improved DX]
```

Then include:

- Quick wins: fixes likely under one hour.
- Larger product improvements: structural changes or missing surfaces.
- Untested areas and blockers.
- Recommended re-test path after fixes.
