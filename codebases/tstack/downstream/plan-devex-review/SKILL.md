---
name: plan-devex-review
description: |
  Run a comprehensive Developer Experience (DX) review against a project,
  product, or API. Produces a structured DX Scorecard with prioritized
  recommendations backed by first-principles analysis, persona interrogation,
  and competitive analysis.
triggers:
  - "run a devex review"
  - "developer experience audit"
  - "dx review"
  - "review our dx"
  - "evaluate developer experience"
  - "dx scorecard"
  - "how is our developer experience"
---

# Developer Experience Review

Conduct a thorough, opinionated DX review using TStack's DX-first framework.
This skill walks through zero-friction-first principles, characteristic
scoring, cognitive patterns for DX leadership, persona work, multi-pass
review, and a final scorecard.

## Voice

Speak like an empathetic, battle-tested developer advocate who has onboarded
thousands of developers onto platforms, APIs, and SDKs. You believe the first
five minutes determine whether a developer stays or leaves. You are direct
about what is broken, generous with praise when earned, and relentless about
friction removal. Use plain language. Avoid jargon unless the audience
expects it. When you find something bad, explain why it hurts a real developer
and what the fix looks like in concrete terms.

## AskUserQuestion Format

When you need clarification during the review, use numbered one-shot
questions. Each question stands alone (do not chain dependencies across
questions). Offer two to four concrete options plus a free-text fallback.
Post questions together in a single block rather than drip-feeding one at a
time.

Example:

```
1. Who is the primary developer persona for this project?
   A) Frontend web dev
   B) Backend / infra engineer
   C) Mobile developer
   D) Data engineer / ML practitioner
   E) Other: _______

2. What is the developer's primary goal with this product?
   A) Integrate an API / SDK into their app
   B) Build on top of a platform
   C) Contribute to this open-source project
   D) Deploy and operate this tool
   E) Other: _______
```

## DX First Principles

Every review is grounded in these eight principles. Reference them explicitly
in findings.

1. **Zero Friction at T=0.** A developer who cannot install, build, or
   authenticate within five minutes will not return. Remove all blockers
   before the first meaningful action.

2. **Incremental Steps.** Every onboarding step must deliver a concrete,
   visible win. A "Getting Started" that ends with a console log is better
   than one that ends with "now read the architecture guide."

3. **Learn by Doing.** Documentation that front-loads concepts before action
   fails. Show the code first, explain the concept second.

4. **Pit of Success.** The default path must be the correct path. If the
   developer can accidentally take a wrong turn, the API or tool is poorly
   designed.

5. **Error Messages Are Product.** Every error message is a micro-moment of
   developer experience. A bad error message erodes trust faster than missing
   documentation.

6. **Empathy by Default.** Assume the developer is smart, busy, and working
   under pressure. Design for their mental state, not your idealized user.

7. **Consistency Over Cleverness.** Predictable naming, parameter ordering,
   response shapes, and CLI flags beat clever novelty every time.

8. **DX Is Teamwork.** Developer experience is not owned by DevRel alone.
   Engineering, design, documentation, and support all shape it. A DX review
   must speak to every function.

## Seven DX Characteristics

Rate each characteristic on a 1-5 scale (1 = absent, 5 = industry-leading)
and justify every rating.

| Characteristic | Definition |
|---|---|
| **Usable** | Can the developer accomplish core tasks without assistance? |
| **Credible** | Does the project inspire confidence? (docs accuracy, uptime, SLAs, test coverage signals) |
| **Findable** | Can developers discover features, docs, and answers through search and navigation? |
| **Useful** | Does the product solve a real problem the developer has? |
| **Valuable** | Does the developer get value worth the time and cognitive cost? |
| **Accessible** | Is the product usable by developers with diverse backgrounds, abilities, and environments? |
| **Desirable** | Would a developer choose this product over alternatives on experience alone? |

## Ten Cognitive Patterns for DX Leaders

Apply these patterns when forming recommendations. Name them when you use
them so the reader can trace your reasoning.

1. **Peak-End Rule.** Developers judge the experience by its most intense
   moment (good or bad) and its ending. Identify both.

2. **Hick's Law.** Every additional choice increases decision time. Audit
   CLI flags, API surface area, and navigation for unnecessary choices.

3. **Jakob's Law.** Developers spend most of their time on other products.
   They expect this product to work like those. Note where it breaks
   convention.

4. **Doherty Threshold.** Productivity soars when interaction latency drops
   below 400ms. Measure build times, API response P95, and CLI feedback.

5. **Tesler's Law.** Every system has irreducible complexity. Map where
   complexity lands (on the developer vs. inside the tool).

6. **Von Restorff Effect.** Distinctive elements are remembered. Identify
   the one or two things that make this product's DX memorable.

7. **Serial Position Effect.** Developers remember the first and last items
   in a sequence best. Structure onboarding and documentation accordingly.

8. **Zeigarnik Effect.** Unfinished tasks occupy mental space. Incomplete
   onboarding steps, dangling error states, and unresolved warnings are
   cognitive load.

9. **Cognitive Load Theory.** Distinguish intrinsic load (problem
   complexity), extraneous load (bad design), and germane load (learning).
   Minimize extraneous load ruthlessly.

10. **Fitts's Law.** Time to reach a target is a function of distance and
    size. In DX terms: how many clicks, keystrokes, and page navigations to
    reach the next action.

## TTHW Benchmarks

Time to Hello World (TTHW) is the single strongest leading indicator of DX
health. Measure or estimate:

- **Ideal TTHW:** How fast could a developer go from zero to a meaningful
  first action if everything went perfectly?
- **Actual TTHW:** What is the observed or estimated time for a real first
  attempt?
- **TTHW Gap:** Actual minus Ideal. A gap larger than 2x signals serious
  friction.
- **TTHW by Persona:** Distinct personas (frontend vs. backend, Windows vs.
  macOS) may have radically different TTHW. Segment them.

For each persona, trace the TTHW timeline in minutes:
0:00 land on page → 0:30 find install instructions → 1:00 install
dependency → 1:30 auth → 2:00 first API call / command → 2:15 first
meaningful output.

## Step 0: Developer Persona Work

Before scoring anything, do the deep persona work. This is the foundation
of every finding.

### Developer Persona Interrogation

For each target persona, answer:

- What is their primary role and skill level?
- What problem are they trying to solve right now?
- What tools, languages, and frameworks do they already use?
- What is their emotional state when they arrive? (Curious? Frustrated?
  Under deadline? Exploring?)
- What does success look like for them after one hour?
- What would make them abandon the product?

### Empathy Narrative

Write a one-paragraph first-person narrative from the persona's perspective
as they attempt to use the product. Capture their internal monologue,
frustrations, and moments of delight. Use this narrative as a calibration
tool throughout the review.

### Competitive DX Benchmarking

Identify two to four direct or adjacent competitors. For each, evaluate
their TTHW, "Getting Started" quality, docs searchability, error message
quality, and community responsiveness. This anchors your ratings in real
market expectations.

### Magical Moment Design

Define the single "magical moment" this product should deliver — the point
where a developer says, "Oh wow, that was easy." If the product doesn't have
one, the review must flag it as the highest-priority gap.

### Mode Selection

Identify which developer mode the product primarily targets:

- **Build mode:** Integrate, code, ship
- **Debug mode:** Diagnose, fix, verify
- **Learn mode:** Explore, understand, prototype
- **Operate mode:** Deploy, monitor, scale

Rate how well the experience supports each relevant mode.

### Journey Trace

Map the end-to-end journey for the primary persona from first touchpoint to
production deployment. Mark every handoff (docs → CLI → API → support),
every authentication step, and every environment switch.

### First-Time Developer Roleplay

Narrate a step-by-step walkthrough of a first-time developer following the
official "Getting Started" guide. At each step, call out friction,
confusion, or delight. If the guide cannot be completed in under 10 minutes,
flag it.

## Eight Review Passes

Execute each pass independently. Each pass produces its own findings section
in the final scorecard.

### Pass 1: Getting Started

Walk through the first-time experience from landing page to first successful
action. Evaluate:

- Is TTHW under 5 minutes for the primary persona?
- Are prerequisites listed before the first step?
- Does the guide work on a clean machine?
- Is auth/API key acquisition seamless?
- Does the first step produce visible, satisfying output?
- Are there multiple "Getting Started" paths that confuse choice?
- Can a developer copy-paste every code block without modification?

### Pass 2: API / CLI / SDK

Evaluate the primary developer interface:

- Naming consistency across endpoints, methods, flags, and parameters
- Predictable request/response shapes
- Pagination, filtering, and error handling conventions
- SDK language support and generation quality
- CLI UX: help text, subcommands, exit codes, stdout/stderr discipline
- Rate limits and their developer-facing experience
- Deprecation headers and migration guidance

### Pass 3: Error Messages

Audit error communication:

- Does every error include a human-readable description?
- Are error codes unique and searchable?
- Do errors suggest a concrete next action?
- Are authentication errors distinguishable from permission errors?
- Are rate-limit errors distinguishable from server errors?
- Is there a canonical error reference?
- Do CLI errors write to stderr and return non-zero exit codes?

### Pass 4: Documentation

Evaluate the docs as a product:

- Search quality: can a developer find the answer to a specific question?
- Navigation IA: is it organized by developer task, not architecture diagram?
- Accuracy: spot-check five random pages against current behavior.
- Code samples: are they runnable, complete, and versioned?
- Conceptual docs: do they follow learn-by-doing or front-load theory?
- Changelog / migration guides: are breaking changes clearly communicated?
- Dark corners: are there undocumented features, endpoints, or flags?

### Pass 5: Upgrade Path

Evaluate the experience of upgrading from a prior version:

- Is there a migration guide for every major version?
- Are breaking changes enumerated and justified?
- Is there a deprecation window with clear timelines?
- Can a developer test the upgrade in isolation?
- Are there automated migration scripts or codemods?

### Pass 6: Dev Environment

Evaluate the local development experience:

- Setup time on a clean machine
- Dependency management and version pinning
- Hot reload / fast feedback loop
- Test suite run time and reliability
- Contributing guide quality
- Reproducible builds

### Pass 7: Community

Evaluate the social and support fabric:

- Issue response time and resolution rate
- PR review turnaround
- Community forum / chat health
- Code of conduct and contribution ladder
- Recognition and champion programs
- Documentation for community maintainers

### Pass 8: DX Measurement

Evaluate how the project measures its own DX:

- Are there TTHW measurements that are run regularly?
- Is there a developer NPS or satisfaction survey?
- Are error rates, support ticket volume, and time-to-resolution tracked?
- Is there a feedback loop from developer pain to engineering backlog?
- Are documentation metrics (page views, search misses, bounce rates) used?

## DX Scorecard Output Format

Produce a single structured scorecard at the end of the review.

```markdown
# DX Scorecard: <Project Name>

**Review Date:** <date>
**Reviewer:** TStack DX Review
**Primary Persona:** <persona description>

## Characteristic Scores
| Characteristic | Score (1-5) | Evidence |
|---|---|---|
| Usable | _ | _ |
| Credible | _ | _ |
| Findable | _ | _ |
| Useful | _ | _ |
| Valuable | _ | _ |
| Accessible | _ | _ |
| Desirable | _ | _ |
| **Overall** | **_** | (not an average; holistic judgment) |

## TTHW
| Persona | Ideal | Actual | Gap |
|---|---|---|---|
| _ | _ min | _ min | _x |

## Magical Moment
_ (exists / missing; describe it)_

## Top 3 Strengths
1. _
2. _
3. _

## Top 5 Critical Fixes (ranked by impact)
1. **[Critical]** _ (TTHW impact: _min, characteristic: _)
2. **[Critical]** _
3. **[High]** _
4. **[High]** _
5. **[Medium]** _

## Pass-by-Pass Summary
| Pass | Rating | Headline Finding |
|---|---|---|
| Getting Started | _ / 5 | _ |
| API / CLI / SDK | _ / 5 | _ |
| Error Messages | _ / 5 | _ |
| Documentation | _ / 5 | _ |
| Upgrade Path | _ / 5 | _ |
| Dev Environment | _ / 5 | _ |
| Community | _ / 5 | _ |
| DX Measurement | _ / 5 | _ |

## Detailed Findings
(per-pass findings with evidence, cognitive pattern references,
and concrete recommendations)
```
