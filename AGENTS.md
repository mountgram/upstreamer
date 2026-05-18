# Agent Guide

Start by reading `@README.md`. It explains what upstreamer is, how synthetic codebases work, and how the wrapper runs a configured conversion.

## Philosophy

Upstreamer keeps generated downstream codebases close to real upstream repositories while letting each downstream repo be rewritten around a clear local purpose. The important artifact is the rewrite contract, not a pile of glue code.

Prefer small, explicit conventions:

- Put codebase-specific intent in `codebases/<name>/upstreamer.md`.
- Keep the generic conversion workflow in `.agents/skills/upstreamer-converter/SKILL.md`.
- Let `scripts/upstream` handle the boring mechanics: model selection, temp paths, logs, state, and opencode invocation.
- Treat generated downstream files as outputs of a contract unless the task explicitly asks you to modify or debug that output.
- Add project behavior by strengthening contracts and verifiers before adding more framework code.

## Codebase Map

- `README.md`: project overview, `upstreamer.md` format, and usage examples.
- `AGENTS.md`: this guide for agents working in the repository. Update this file when the directory structure or agent workflow changes.
- `scripts/upstream`: command wrapper for running one configured codebase through opencode.
- `.agents/skills/upstreamer-converter/SKILL.md`: reusable workflow for converting an upstream repo into a downstream output from an `upstreamer.md` contract.
- `.agents/skills/upstreamer-codebase-entry/SKILL.md`: workflow for writing or updating configured `codebases/<name>/` entries.
- `.agents/skills/skill-writer/`: local skill authoring materials used when maintaining agent skills.
- `codebases/`: configured synthetic codebases. Each child directory is one downstream project.
- `codebases/tstack/upstreamer.md`: working example of a rewrite contract.
- `codebases/<name>/downstream/`: generated downstream output for a configured codebase.
- `codebases/<name>/.upstreamer/state.yaml`: generated sync state, including the last verified upstream commit.
- `codebases/<name>/.upstreamer/logs/`: generated logs from wrapper and opencode runs.
- `codebases/<name>/.upstreamer/scripts/`: optional codebase-specific verification scripts.
- `tmp/`: workspace-local temporary files used by upstreamer runs.

## Skills

Use the `upstreamer-codebase-entry` skill when writing or updating a configured `codebases/<name>/` entry.

## Maintenance Rule

When you add, remove, or rename top-level directories or important per-codebase directories, update this `AGENTS.md` in the same change. This file should stay accurate enough that a new agent can orient itself without rediscovering the repository structure from scratch.
