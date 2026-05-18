# Upstreamer Codebase Entry Specification

## Intent

`upstreamer-codebase-entry` guides agents through creating and updating configured upstreamer entries under `codebases/<name>/`.

The skill should produce precise `upstreamer.md` rewrite contracts and optional deterministic verifiers that the existing wrapper and converter skill can execute without adding framework code.

## Scope

In scope:

- Creating `codebases/<name>/upstreamer.md` for a new synthetic codebase.
- Updating an existing codebase entry's rewrite contract.
- Adding optional `.upstreamer/scripts/verify-<name>.sh` checks for mechanical invariants.
- Advising whether to run `./scripts/upstream <name>` after an entry is created.

Out of scope:

- Running full upstream conversions by default.
- Replacing the `upstreamer-converter` skill.
- Hand-editing generated downstream output unless explicitly requested.
- Managing schedules outside the `upstreamer.md` frontmatter.

## Users And Trigger Context

- Primary users: agents and humans configuring new synthetic codebases in this repository.
- Common user requests: "add a new upstreamer codebase", "create a codebases entry", "write an upstreamer.md", "set up a rewrite contract", or "add a verifier for this codebase".
- Should not trigger for: executing a conversion run, editing generated downstream output, generic skill authoring, or broad repository documentation work unless a `codebases/<name>/` entry is involved.

## Runtime Contract

- Required first actions:
- Read `@README.md`, `@AGENTS.md`, `@scripts/upstream`, and a nearby contract example.
- Resolve local name, upstream repo, downstream repo, schedule, downstream purpose, rewrite rules, success criteria, and verifier needs.
- Required outputs:
- `codebases/<name>/upstreamer.md` with valid frontmatter and a concrete rewrite contract.
- Optional executable verifier when deterministic checks are useful.
- Final response with paths, repo values, verifier status, validation, and conversion-run status.
- Non-negotiable constraints:
- State assumptions and tradeoffs instead of silently guessing.
- Prefer the simplest downstream shape that satisfies the user's goal.
- Keep contract instructions surgical and goal-driven.
- Do not hand-edit generated downstream output unless explicitly requested.
- Do not add framework code when a stronger contract or verifier solves the need.
- Keep deterministic checks in verifier scripts and judgment-heavy rules in `upstreamer.md`.
- Expected bundled files loaded at runtime:
- `SKILL.md` only.

## Source And Evidence Model

Authoritative sources:

- `README.md` for upstreamer purpose, frontmatter format, wrapper usage, logs, and state behavior.
- `AGENTS.md` for repository philosophy, codebase map, and maintenance expectations.
- `scripts/upstream` for actual wrapper paths, model override behavior, verifier invocation, logs, state, and prompt behavior.
- `.agents/skills/upstreamer-converter/SKILL.md` for the conversion contract consumed by generated entries.
- Existing `codebases/*/upstreamer.md` files for local examples.

Useful improvement sources:

- Review comments on generated `upstreamer.md` contracts.
- Failed conversion logs showing ambiguous or insufficient rewrite rules.
- Verifier failures that reveal missing mechanical invariants.
- New wrapper behavior in `scripts/upstream`.

Data that must not be stored:

- Secrets, tokens, private clone credentials, or private downstream URLs not required for the contract.
- Large copied upstream source excerpts.
- Generated logs containing sensitive data.

## Reference Architecture

- `SKILL.md` contains all runtime guidance because the workflow is a single coherent checklist.
- `SPEC.md` contains this maintenance contract.
- `SOURCES.md` contains provenance, synthesis decisions, coverage, and changelog.
- `references/`, `scripts/`, and `assets/` are unused until repeated optional lookup needs appear.

## Validation

- Lightweight validation:
- Run `uv run scripts/quick_validate.py ../upstreamer-codebase-entry` from `.agents/skills/skill-writer/`.
- Re-read `SKILL.md` to ensure all local file references are intentional and portable.
- Confirm trigger language distinguishes entry creation from conversion execution.
- Deeper validation:
- Use the skill to create or update a real entry and inspect whether `scripts/upstream` can consume it.
- Review conversion logs for ambiguity caused by the entry-writing guidance.
- Acceptance gates:
- Validator passes with no errors.
- `SKILL.md` frontmatter name matches the directory.
- Runtime guidance points to README, AGENTS, wrapper behavior, and existing contracts.
- The AGENTS how-to section is no longer duplicated outside the skill.

## Known Limitations

- The skill cannot know every upstream repository's structure without inspecting that repository during a specific task.
- It intentionally does not run conversions by default because conversion can be expensive and model-dependent.
- It relies on `scripts/upstream` for actual execution behavior and must be updated if wrapper paths or verifier conventions change.
- Goal-driven contracts still need concrete enough keep/adapt/drop rules for the converter to make file-level decisions.

## Maintenance Notes

- Update `SKILL.md` when the entry-writing workflow, required contract sections, verifier rules, or final response format changes.
- Update `SOURCES.md` when source files, synthesis decisions, trigger behavior, or known gaps change.
- Update `SPEC.md` when intent, scope, validation expectations, or maintenance rules change.
- If optional examples or troubleshooting grow beyond the inline workflow, add flat files under `references/` and route them from `SKILL.md`.
