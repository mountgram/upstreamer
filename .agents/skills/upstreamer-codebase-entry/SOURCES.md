# Upstreamer Codebase Entry Sources

## Source Inventory

| Source | Trust | Confidence | Contribution | Usage constraints |
|--------|-------|------------|--------------|-------------------|
| `README.md` | authoritative repo docs | high | Defines synthetic codebases, `upstreamer.md` frontmatter, wrapper usage, logs, state, and examples. | Keep runtime guidance aligned with README terminology. |
| `AGENTS.md` before this skill extraction | authoritative repo policy | high | Provided the original codebase-entry how-to and maintenance rule to move into the skill. | Do not keep duplicated how-to in AGENTS.md. |
| `scripts/upstream` | authoritative implementation | high | Defines accepted codebase path, model override, temp/log/state paths, verifier location, and conversion prompt. | Re-check when wrapper behavior changes. |
| `.agents/skills/upstreamer-converter/SKILL.md` | authoritative conversion workflow | high | Shows what a converter expects from a rewrite contract and final verification. | This skill writes contracts; it does not replace conversion. |
| `codebases/tstack/upstreamer.md` | local example | medium-high | Demonstrates concrete rewrite rules, keep/drop/adapt language, and final contract depth. | Example is domain-specific; avoid copying TStack rules into unrelated entries. |
| `.agents/skills/skill-writer/` | authoritative skill authoring workflow | high | Provides skill layout, SPEC/SOURCES expectations, validation, and trigger optimization requirements. | Use only for maintaining this skill, not for runtime entry creation. |
| User-provided Karpathy-style engineering principles | user requirement | high | Adds think-before-coding, simplicity, surgical changes, and goal-driven execution to contract authoring. | Preserve as practical authoring guidance, not attribution-heavy runtime prose. |

## Synthesis Decisions

| Decision | Status | Rationale |
|----------|--------|-----------|
| Skill class: `workflow-process` | adopted | Creating a codebase entry is a repeatable ordered operation with preconditions, safety boundaries, and validation. |
| Primary shape: `inline-guidance` | adopted | One compact checklist covers most invocations; no routed knowledge base or automation is currently needed. |
| Add `SPEC.md` | adopted | New skill creation materially establishes intent, scope, validation, and maintenance rules. |
| Add `SOURCES.md` | adopted | Source provenance and synthesis decisions should not live in runtime instructions. |
| Add references | deferred | Examples are short enough to keep inline; add flat `references/` files only if examples or troubleshooting grow. |
| Add scripts | rejected | The skill's job is authoring contracts; deterministic validation belongs in per-codebase verifiers. |
| Run conversions by default | rejected | Conversion is model-dependent and potentially expensive; run only when requested or explicitly scoped. |
| Add goal-driven contract principles | adopted | New `upstreamer.md` entries should state final state and verification criteria so the converter can iterate without fragile step prescriptions. |

## Coverage Matrix

| Coverage area | Status | Notes |
|---------------|--------|-------|
| Preconditions | covered | Required first reads and inputs are listed. |
| Ordered flow | covered | Entry writing, verifier addition, and verification steps are ordered. |
| Failure handling | partial | The skill says to ask one question for missing required values; task-specific upstream inspection may still reveal gaps. |
| Safety boundaries | covered | Do not hand-edit generated downstream; do not add framework code; do not run conversion by default. |
| Validation | covered | Re-read contract, check frontmatter, check verifier, optionally run wrapper. |
| Trigger precision | covered | Description targets codebase entries and excludes generic conversion in SPEC. |
| Goal-driven execution | covered | Runtime guidance now requires success criteria and observable output/verification goals. |

## Source Adaptation Notes

| Item | Note |
|------|------|
| Source intent | Move the detailed AGENTS.md codebase-entry how-to into a reusable skill. |
| Local target behavior | Agents invoke a dedicated skill when creating or updating `codebases/<name>/` entries. |
| Fidelity boundary | Preserve frontmatter fields, contract-writing guidance, verifier path, wrapper command, and maintenance expectations. |
| Local replacements | Runtime instructions now require reading wrapper code and nearby contracts before drafting. |
| Omitted material | General repository philosophy and codebase map stay in `AGENTS.md`; generated-output details stay in README/wrapper. |
| Rights and attribution | All sources are local repository materials; no external excerpts added. |

## Description Optimization

Final description:

```text
Create or update upstreamer codebase entries. Use when asked to add a new codebases/<name>/ upstreamer.md file, design an upstreamer rewrite contract, configure an upstream/downstream repo pair, add a verifier for a synthetic codebase, or prepare a new upstreamer codebase entry.
```

Should trigger:

- "add a new upstreamer codebase for owner/repo"
- "write codebases/foo/upstreamer.md"
- "create a rewrite contract for this upstream repo"
- "add a verifier for a codebases entry"
- "set up a synthetic downstream codebase entry"

Should not trigger:

- "run upstreamer for tstack"
- "convert this upstream repo now"
- "edit the generated downstream README"
- "write a generic agent skill"
- "review this PR"

## Changelog

- 2026-05-13: Created skill from the original `AGENTS.md` new-codebase-entry how-to and local upstreamer implementation docs.
- 2026-05-13: Added user-requested contract authoring principles emphasizing assumptions, simplicity, surgical scope, and goal-driven success criteria.
