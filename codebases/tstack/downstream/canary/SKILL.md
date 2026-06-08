---
name: canary
description: |
  Verify a freshly deployed change with focused smoke checks and rollback-ready reporting.
triggers:
  - canary
  - smoke test production
  - verify deploy
---

# Canary

Use this skill after a deploy or risky release. The goal is to prove that the change works in the real environment and that critical flows still behave correctly.

## Process

1. Identify the change, deployment target, and highest-risk user flows.
2. Check deploy status using the project's normal dashboard, CLI, logs, or health endpoint.
3. Exercise the smallest set of flows that would catch a severe regression.
4. Compare expected and observed behavior with timestamps, URLs, request IDs, or screenshots when available.
5. If a check fails, stop broad testing and report impact, likely cause, and rollback or mitigation options.

## Report

- Deployment target and version tested.
- Checks run and pass/fail result.
- Evidence for each failure.
- Clear recommendation: continue monitoring, fix forward, or roll back.
