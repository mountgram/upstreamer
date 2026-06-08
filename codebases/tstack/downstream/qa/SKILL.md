---
name: qa
description: |
  Test a change end to end and report actionable bugs with reproduction detail.
triggers:
  - qa this
  - test this change
  - quality assurance
---

# QA

Use this skill when the user wants active testing, not just code review.

## Workflow

1. Identify what changed and which user flows are at risk.
2. Build a compact test matrix: happy path, edge cases, failure states, accessibility, responsiveness, and regression areas.
3. Run available automated checks first when they are cheap.
4. Exercise the product manually with the tools available in the current environment.
5. For each bug, capture expected behavior, actual behavior, reproduction steps, environment, and severity.

## Output

- Summary of coverage.
- Bugs found, ordered by severity.
- Verification commands or manual paths used.
- Areas not tested and why.
