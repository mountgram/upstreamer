---
name: upstreamer-converter
description: Convert upstream repositories into synthetic downstream codebases from upstreamer.md rewrite rules. Use when running upstreamer, processing a codebase conversion, translating an upstream repo into a markdown-only downstream repo, or performing the first-pass rewrite of an upstream project.
---

# Upstreamer Converter

Convert an upstream repository into a synthetic downstream codebase following the exact contract in an `upstreamer.md` file. The `upstreamer.md` rules are the source of truth; this skill supplies the execution discipline.

## Step 0: Read the rewrite contract

1. Read `upstreamer.md` before inspecting or writing output.
2. Parse the frontmatter fields, especially `upstream` and `downstream`.
3. Treat every section in `upstreamer.md` as binding: philosophy, keep/drop rules, per-file processing rules, final structure, and verification.
4. If a rule conflicts with this skill, follow `upstreamer.md` and note the conflict in the final report.

## Step 1: Acquire and inspect upstream

1. Clone or open the upstream repository named by `upstreamer.md` in a temporary or workspace-safe location.
2. Inspect the top-level tree to understand major directories, but do not preserve upstream structure by default.
3. Build an inventory of every upstream `SKILL.md` before writing downstream files.
4. Mark candidates inside removed directories separately; some rewrite contracts intentionally drop implementation directories while still allowing the contained `SKILL.md` to be evaluated.

Useful commands:

```bash
git clone <upstream-url> <upstream-worktree>
find <upstream-worktree> -name SKILL.md -type f | sort
```

## Step 2: Create the downstream skeleton

1. Create a clean downstream output directory for the `downstream` repo name.
2. Copy only baseline files allowed by `upstreamer.md`, usually `LICENSE` and `VERSION`.
3. If `VERSION` is missing upstream, create a simple version file only when the rewrite contract allows it.
4. Do not copy package manifests, lockfiles, CI, docs, generated files, templates, binaries, scripts, or infrastructure unless `upstreamer.md` explicitly says to keep them.

## Step 3: Apply removal rules first

1. Drop every path class listed in `upstreamer.md` under removal rules.
2. Do not salvage non-skill implementation files from removed directories.
3. For each remaining or specially allowed `SKILL.md`, evaluate the markdown instructions, not the helper code around them.
4. Drop any file whose path or filename matches banned concepts such as telemetry, analytics, benchmark, or upstream-specific infrastructure.

## Step 4: Evaluate every skill candidate

For each inventoried `SKILL.md`, decide `KEEP`, `DROP`, or `ADAPT`.

Use `KEEP` when the core value is portable instructions, checklists, planning, review, QA, retrospectives, release process, or analysis that can run with ordinary agent tools and standard system tools.

Use `DROP` when the core value is a custom binary, hosted service, database, telemetry, browser/screenshot executable, upgrade mechanism, generated artifact, or upstream-specific context store that cannot be replaced by concise markdown instructions.

Use `ADAPT` when the skill idea is valuable but the upstream workflow depends on removable infrastructure. Rewrite it around generic agent capabilities or standard commands. If the generic rewrite would be vague or misleading, drop it instead.

Keep a concise decision log while working so the final report can explain notable drops and adaptations.

## Step 5: Rewrite kept skills as fresh markdown

For every kept or adapted skill:

1. Create exactly one downstream directory for the skill and write exactly one file in it: `SKILL.md`.
2. Write a fresh implementation in your own words; do not copy-paste the upstream preamble or helper-script workflow.
3. Preserve the useful concept, prompts, checklists, decision criteria, and standard-tool commands.
4. Remove upstream infrastructure sections named by `upstreamer.md`, including plan-mode machinery, routing, artifacts sync, model patches, context recovery, checkpointing, telemetry, analytics, config lookup, and completion footers when listed.
5. Normalize frontmatter to only the fields allowed by `upstreamer.md`, usually `name`, `description`, and `triggers`.
6. Remove provider/tool allowlists, versions, preamble tiers, hosted-service config, `gbrain` metadata, and upstream-specific metadata.
7. Remove all helper-script references such as `bin/<upstream>-*`, config commands, telemetry commands, session tracking, marker files, and install paths under home directories.
8. Rename upstream identities to downstream identities only in user-facing text, skill names, descriptions, and examples. Do not leave stale upstream branding in output.
9. Clean bash code blocks so they contain only standard commands that are part of the actual workflow.
10. For browser, screenshot, or design skills, keep generic review/checklist value only if it works with the invoking agent's native tools; otherwise drop the skill.

## Step 6: Enforce downstream shape

Unless `upstreamer.md` explicitly says otherwise, the downstream repository must contain only:

```text
<downstream-name>/
├── README.md
├── LICENSE
├── VERSION
└── <skill-name>/
    └── SKILL.md
```

Rules:

1. Each skill directory has exactly one file: `SKILL.md`.
2. No subdirectories inside skill directories.
3. No generated files or templates.
4. No package manager files, dependencies, build step, binaries, or helper scripts.
5. No hidden infrastructure directories unless `upstreamer.md` explicitly requires them.

## Step 7: Write README.md

Write a simple downstream `README.md` after the kept skill set is known.

Include:

1. The downstream project purpose in the downstream voice.
2. Minimal usage instructions.
3. A compact list or summary of kept skills.
4. Any constraints from `upstreamer.md`, such as line limits or no upstream references.

Exclude:

1. Upstream install machinery.
2. CI, package manager, or helper-script instructions.
3. Telemetry, config, session, or hosted-service references.

## Step 8: Verify and iterate

Run the verification checklist from `upstreamer.md` and add these checks when relevant:

```bash
find <downstream-dir> -type f | sort
find <downstream-dir> -mindepth 2 -maxdepth 2 -type f ! -name SKILL.md
find <downstream-dir> -mindepth 3 -type f
grep -RInE 'gstack|garrytan|~/.gstack|~/.tstack|~/.claude/skills/(gstack|tstack)|bin/(gstack|tstack)-|gstack-config|telemetry|analytics|gbrain|benchmark|session tracking|package.json|bun.lock' <downstream-dir> || true
find <downstream-dir> -type f -perm +111
```

Review every grep hit before finishing. Some downstream-facing terms may be allowed only if `upstreamer.md` explicitly requires them; otherwise rewrite or remove them.

If verification fails:

1. Fix the specific file or remove the offending skill.
2. Re-run the failed check.
3. Prefer a smaller coherent downstream set over a broad set with weak or infrastructure-dependent skills.

## Final report

Return:

1. Output location.
2. Count of kept, adapted, and dropped skills.
3. Notable drop/adapt decisions.
4. Verification commands run and results.
5. Any remaining uncertainty or rules that required judgment.
