---
name: codex
description: |
  Get a second-pass critique from another coding agent or local CLI when one is available.
triggers:
  - ask codex
  - second opinion
  - independent review
---

# Codex

Use this skill when a problem benefits from an independent pass. It is optional: if no second agent or CLI is available, perform the same critique yourself and label it as a self-review.

## When To Use

- Architecture choices with multiple plausible solutions.
- Risky code changes before landing.
- Bug fixes where the root cause is uncertain.
- Test failures that need another hypothesis.

## Prompt Shape

Give the reviewer only the necessary context:

- Goal and user-facing requirement.
- Files or diff to inspect.
- Known constraints.
- Specific question to answer.
- Expected output format: findings first, then recommendations.

## Integrate Results

1. Treat the second pass as evidence, not authority.
2. Verify claims against the code or runtime.
3. Apply only changes that directly improve correctness, safety, or maintainability.
4. Report what was accepted, rejected, and why.
