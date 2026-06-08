---
name: qa-only
description: |
  Test and report findings without making code changes.
triggers:
  - qa only
  - test only
  - do not fix
---

# QA Only

Use this skill when the user wants testing and reporting but no edits.

## Rules

- Do not modify source files.
- Do not apply fixes, even for obvious issues.
- You may run read-only inspection and safe test commands.
- If a command would mutate files, ask or skip and note the limitation.

## Report

Provide findings first, with severity, reproduction steps, expected behavior, actual behavior, and evidence. End with coverage and untested areas.
