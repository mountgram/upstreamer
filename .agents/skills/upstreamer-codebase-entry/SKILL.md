---
name: upstreamer-codebase-entry
description: Create or update upstreamer codebase entries. Use when asked to add a new codebases/<name>/ upstreamer.md file, design an upstreamer rewrite contract, configure an upstream/downstream repo pair, add a verifier for a synthetic codebase, or prepare a new upstreamer codebase entry.
---

# Upstreamer Codebase Entry

Create or update a configured synthetic codebase entry under `codebases/<name>/`. The output is a clear rewrite contract that `scripts/upstream` and the `upstreamer-converter` skill can execute.

## Required First Reads

1. Read `@README.md` to understand upstreamer, the `upstreamer.md` format, and wrapper behavior.
2. Read `@AGENTS.md` for repository orientation and maintenance rules.
3. Read `@scripts/upstream` before relying on wrapper behavior.
4. Read at least one nearby contract, usually `@codebases/tstack/upstreamer.md`, before drafting a new one.

## Inputs To Resolve

Collect or infer these before writing. Ask one short question only when a required value cannot be safely inferred.

| Input | Required | Notes |
|-------|----------|-------|
| local name | yes | Directory name for `codebases/<name>/`; must work with `./scripts/upstream <name>`. |
| upstream repo | yes | GitHub `owner/repo` or clone URL for the source repository. |
| downstream repo | yes | Intended downstream repository identity. |
| schedule | yes | Cron string for sync cadence. Use the repo's examples if the user has no preference. |
| model | no | Optional frontmatter field; `OPENCODE_MODEL` can override it. |
| downstream purpose | yes | What the synthetic codebase is and is not. |
| rewrite rules | yes | What to keep, adapt, drop, rename, simplify, and verify. |
| success criteria | yes | How the converter knows the downstream output is correct. |
| verifier needs | no | Mechanical invariants that deserve a `.upstreamer/scripts/verify-<name>.sh`. |

## Contract Authoring Principles

Use these principles when writing `upstreamer.md` contracts:

- Think before coding. State assumptions in the contract, surface tradeoffs, and ask before guessing when a required decision is unclear.
- Simplicity first. Define the smallest downstream project that satisfies the goal. Do not add speculative features, one-off abstractions, or broad compatibility layers unless the user asks for them.
- Surgical changes. Tell the converter to change only what the downstream goal requires. Do not ask it to improve unrelated upstream code, comments, formatting, or structure.
- Goal-driven execution. Define the desired final state and verification criteria. Avoid over-prescribing a fragile step-by-step implementation when success can be stated as observable output.

Push back when the proposed downstream shape is more complex than the stated purpose requires.

## Write The Entry

1. Create `codebases/<name>/` where `<name>` is the stable local identifier.
2. Add `codebases/<name>/upstreamer.md` with YAML frontmatter:

```yaml
---
upstream: owner/repo
downstream: owner/downstream-repo
schedule: "0 */6 * * *"
model: provider/model-name
---
```

3. Omit `model` when the user did not choose one.
4. Write the markdown body as the binding rewrite contract. Include concrete sections for:
- downstream identity and philosophy
- assumptions, constraints, and tradeoffs
- success criteria for the generated downstream repo
- source material to inspect
- files, concepts, and behaviors to keep
- files, concepts, and behaviors to adapt
- files, concepts, and behaviors to drop
- naming, branding, dependency, and infrastructure changes
- expected output shape under `codebases/<name>/downstream/`
- verification requirements
- final report requirements for the conversion agent
5. Prefer explicit examples and path lists over vague prose. A converter should be able to decide whether any upstream file is kept, adapted, or dropped.
6. Phrase execution guidance around observable goals: what files should exist, what behavior or content should be preserved, what must be absent, and how verification proves it.
7. Treat generated downstream files as outputs of the contract. Do not hand-edit `codebases/<name>/downstream/` unless the user explicitly asks to debug or patch generated output.

## Add A Verifier When Useful

Add `codebases/<name>/.upstreamer/scripts/verify-<name>.sh` when the contract has mechanical invariants such as banned strings, required files, allowed extensions, exact directory shape, executable-bit bans, or README requirements.

Verifier rules:

1. Make the verifier executable.
2. Accept the downstream directory as the first argument.
3. Fail fast on violations with clear messages.
4. Keep repo-specific judgment in `upstreamer.md`; keep deterministic checks in the verifier.
5. Avoid network access and model calls in verifiers.

## Verify The Entry

Before finishing:

1. Re-read `codebases/<name>/upstreamer.md` as if you were the conversion agent.
2. Confirm the frontmatter has `upstream`, `downstream`, and `schedule`, with optional `model` only when intended.
3. Confirm every major upstream area has an intended keep, adapt, or drop policy when the source repo is known.
4. If a verifier was added, run or at least syntax-check it and ensure executable permissions are set.
5. Run `./scripts/upstream <name>` only when the user asks for a conversion run or the task explicitly includes end-to-end verification.

## Examples

Happy path:

```text
User asks: add codebases/foo for owner/foo -> local/foo-lite.
Action: create codebases/foo/upstreamer.md with frontmatter, write a clear contract for foo-lite, and report that conversion has not been run unless requested.
```

Robust variant:

```text
If the downstream must never contain telemetry, add both a contract rule banning telemetry and a verifier grep that fails on telemetry-related strings in generated output.
```

Anti-pattern and correction:

```text
Bad: "Keep the useful parts and remove cruft."
Good: "Keep docs/*.md and src/parser.ts; adapt CLI examples into library API examples; drop .github/, scripts/, analytics/, package publishing files, and generated docs."
```

Goal-driven correction:

```text
Bad: "First copy these files, then edit these headings, then rewrite every import."
Good: "The downstream repo should expose the parser as a dependency-free TypeScript library with no CLI, CI, telemetry, or package-publishing infrastructure. Verification passes when only src/parser.ts, README.md, LICENSE, and package metadata needed for local tests remain, and tests cover the parser examples from upstream docs."
```

## Final Response

Return:

1. Entry path created or updated.
2. Upstream and downstream repo values.
3. Whether a verifier was added.
4. Verification performed.
5. Whether `./scripts/upstream <name>` was run.

See `SPEC.md` and `SOURCES.md` only when maintaining this skill itself.
