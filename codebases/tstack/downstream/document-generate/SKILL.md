---
name: document-generate
description: |
  Generate clear, task-focused documentation from source code, behavior, and user intent.
triggers:
  - generate docs
  - write documentation
  - document this feature
---

# Document Generate

Use this skill to create or update documentation that helps a real reader complete a task or understand a system.

## Classify The Doc

- Tutorial: teaches through a guided path.
- How-to: solves one practical problem.
- Reference: describes facts, APIs, flags, or configuration.
- Explanation: builds understanding and tradeoff awareness.

## Workflow

1. Identify the reader, task, and required prior knowledge.
2. Inspect the source of truth: code, tests, CLI help, examples, or product behavior.
3. Choose one doc type and keep the structure consistent with that type.
4. Write directly, using commands and examples that can be verified.
5. Remove speculation, stale setup details, and implementation trivia that does not help the reader.

## Quality Bar

The finished doc should answer: who it is for, when to use it, what to do, what result to expect, and where to go next.
