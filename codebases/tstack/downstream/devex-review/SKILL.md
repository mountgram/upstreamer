---
name: devex-review
description: |
  Audit the developer experience of a product, API, SDK, or repository.
triggers:
  - devex review
  - developer experience audit
  - review docs and onboarding
---

# Devex Review

Use this skill to review how quickly and confidently a developer can succeed.

## Evaluate

- First contact: README, examples, install, and prerequisites.
- Time to hello world: setup friction, auth, sample data, and failure messages.
- Conceptual model: naming, API shape, and docs structure.
- Debuggability: logs, errors, local reproducibility, and version clarity.
- Maintenance: tests, migration notes, release notes, and compatibility signals.

## Method

1. Start as a new developer would: read entry docs before source internals.
2. Try the documented happy path when feasible.
3. Record every point where assumptions, missing commands, or unclear errors slow progress.
4. Prioritize findings by developer time lost and likelihood.

## Output

Findings first, with exact file or command references. Then provide quick wins and larger product improvements.
