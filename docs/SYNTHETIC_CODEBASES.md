# Synthetic Codebases

A synthetic codebase is a generated downstream repo that follows a real upstream project but is rewritten for a different local purpose.

The important idea is not "copy this repo with edits." The important idea is "keep a contract that explains how this downstream should differ from upstream, then rerun that contract as upstream changes."

## Why Make One?

Use a synthetic codebase when the upstream project has value you want to keep tracking, but its exact shape is wrong for your use case.

Common reasons:

- You want a project in a different language or runtime.
- You want the behavior, but not the framework, packaging, telemetry, auth model, or deployment assumptions.
- You want a smaller teaching/reference implementation that stays close to a bigger production app.
- You want an agent skill, SDK, CLI, or library extracted from a broader tool.
- You want to keep pace with upstream improvements without repeatedly hand-porting everything.

Synthetic codebases are useful when the downstream has a durable identity of its own. If you only need a one-time fork, just fork the repo. If you only need a patch, open a PR upstream. Use upstreamer when the interesting work is the repeated translation.

## What You Might Build

| Upstream | Synthetic downstream | Why it helps |
| --- | --- | --- |
| A Python CLI | A TypeScript CLI plus importable library | Keep behavior and source coverage, but fit a JS/TS ecosystem. |
| A full agent framework | A markdown-only skill pack | Keep the portable workflows while dropping binaries, telemetry, and host-specific setup. |
| A SaaS app | A local-first starter app | Preserve UX and architecture patterns while replacing production services. |
| A large SDK | A tiny task-specific client | Track API changes without inheriting every abstraction. |
| A research repo | A stable tutorial or reference implementation | Keep the algorithm and examples, drop experimental scaffolding. |

The downstream should be opinionated. It is allowed to remove upstream features when the contract explains why.

## What Goes In The Contract

Each synthetic codebase is configured by `codebases/<name>/upstreamer.md`. That file is the rewrite contract.

Good contracts answer:

- What is the downstream for?
- What upstream behavior must be preserved?
- What should be adapted, renamed, simplified, or rewritten?
- What should be dropped even if upstream keeps changing it?
- What output shape should the downstream have?
- What mechanical checks prove the shape is right?
- What qualitative eval proves the generated result is actually good?

The contract should be specific enough that a fresh agent can make the same keep/adapt/drop decisions without reading your mind.

## Mechanical Verification vs Qualitative Eval

Upstreamer uses two kinds of checks.

Mechanical verification belongs in `.upstreamer/scripts/verify-<name>.sh`. It should check objective facts: required files, banned files, no stale dependencies, no generated binaries, no forbidden auth paths, no package-manager files when the contract bans them.

Qualitative eval belongs in `.upstreamer/eval.md`. It should check judgment-heavy questions: did the downstream preserve the useful workflow, is the output good enough, did the agent over-compress rich instructions, does the CLI produce useful results, are optional failures isolated and clearly reported?

If qualitative eval fails, the converter should fix and rerun it. If it cannot make the eval pass coherently, it should write `.upstreamer/eval-report.md` as a bankruptcy report instead of silently accepting the run.

## Current Examples

`codebases/tstack/` converts `garrytan/gstack` into a markdown-only skill pack. The downstream keeps portable agent workflows and drops helper binaries, telemetry, generated templates, package infrastructure, and host-specific state. Its eval focuses on instruction fidelity, because a short summary of a rich skill is not good enough.

`codebases/last30days-ts/` converts `mvanhorn/last30days-skill` into a TypeScript CLI/library. The downstream keeps recent-public-signal research behavior while changing the runtime and source adapters. It intentionally removes DuckDuckGo because the unofficial scraping path is unreliable, and uses Exa with Brave fallback for web search.

## When Not To Use Upstreamer

Do not use upstreamer when:

- You need exact upstream compatibility.
- The downstream should accept every upstream file unchanged.
- There is no recurring upstream to track.
- You cannot state the downstream purpose clearly.
- Human judgment is required for every update and cannot be encoded as contract or eval criteria.

In those cases, a fork, vendored copy, patch queue, or normal dependency is probably simpler.

## Mental Model

Think of upstreamer as a contract-driven translation loop:

```text
upstream repo + upstreamer.md + eval.md
        -> generated downstream
        -> mechanical verification
        -> qualitative eval
        -> changelog and sync state
```

The downstream files matter, but the durable asset is the contract that can regenerate them as upstream changes.
