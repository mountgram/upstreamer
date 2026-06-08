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

1. Clone or open the upstream repository named by `upstreamer.md` in a workspace-safe location. Prefer `tmp/upstreamer/<codebase>/upstream` inside the current workspace. Do not use `/tmp` or another external directory unless the user explicitly authorizes it.
2. Read `.upstreamer/state.yaml` for `upstream_commit` when it exists. This is the last upstream commit that was successfully converted and verified.
3. Record the current upstream `HEAD` commit before making downstream changes.
4. If `UPSTREAM_COMMIT` exists and is an ancestor of current `HEAD`, inspect the upstream diff first with `git diff --name-status <UPSTREAM_COMMIT>..HEAD` and focus the update on changed files and affected skills. Keep a concise summary of those upstream changes for the final report.
5. If there is no prior commit, the prior commit is missing upstream, or the downstream output does not exist, perform a full conversion.
6. Inspect the top-level tree to understand major directories, but do not preserve upstream structure by default.
7. Build an inventory of every upstream `SKILL.md` before writing downstream files. On incremental runs, include unchanged skills in the inventory but mark unchanged decisions as reused when appropriate.
8. Mark candidates inside removed directories separately; some rewrite contracts intentionally drop implementation directories while still allowing the contained `SKILL.md` to be evaluated.

Useful commands:

```bash
git clone <upstream-url> <upstream-worktree>
find <upstream-worktree> -name SKILL.md -type f | sort
git -C <upstream-worktree> rev-parse HEAD
git -C <upstream-worktree> diff --name-status <last-upstream-commit>..HEAD
```

## Step 2: Create the downstream skeleton

1. Create a clean downstream output directory for the `downstream` repo name. Prefer `tmp/upstreamer/<codebase>/downstream` inside the current workspace unless the rewrite contract explicitly names another output location.
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

Keep a concise decision log while working so the final report can explain notable drops and adaptations, including what was put into the downstream and why.

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
├── upstreamer-changelog.md
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

## Step 8: Mechanical verification

Run the verifier and mechanical checklist from `upstreamer.md`. These checks should be deterministic: required files, allowed shapes, banned paths, banned infrastructure references, executable bits, package manager files, and other objective invariants.

```bash
find <downstream-dir> -type f | sort
find <downstream-dir> -mindepth 2 -maxdepth 2 -type f ! -name SKILL.md
find <downstream-dir> -mindepth 3 -type f
grep -RInE 'gstack|garrytan|~/.gstack|~/.tstack|~/.claude/skills/(gstack|tstack)|bin/(gstack|tstack)-|gstack-config|telemetry|analytics|gbrain|benchmark|session tracking|bun.lock' <downstream-dir> || true
find <downstream-dir> -type f -perm +111
```

Review every grep hit before finishing. Some downstream-facing terms may be allowed only if `upstreamer.md` explicitly requires them; otherwise rewrite or remove them.

If verification fails:

1. Fix the specific file or remove the offending skill.
2. Re-run the failed check.
3. Prefer a smaller coherent downstream set over a broad set with weak or infrastructure-dependent skills.

## Step 9: Qualitative eval

If `codebases/<name>/.upstreamer/eval.md` exists, run it after mechanical verification passes and before updating sync state. Write the latest eval result to `codebases/<name>/.upstreamer/eval-report.md`.

The eval is a fresh-context review standard, not a shell script. Use a subagent or otherwise start a separate review context when the tool environment supports it. The evaluator should read the eval file, the rewrite contract, relevant upstream sources, and downstream output; it should not rely on the converter's prior reasoning. The evaluator should report `PASS`, `PASS WITH WARNINGS`, or `FAIL` with concrete findings.

Treat `FAIL` as a blocker. Fix the downstream or contract, re-run mechanical verification, and re-run the eval. Repeat until the eval returns `PASS` or `PASS WITH WARNINGS`, or until you have made three focused fix/eval attempts or no coherent fix remains within the contract.

If the eval still fails, declare bankruptcy instead of quietly accepting the conversion:

1. Do not update `.upstreamer/state.yaml`.
2. Write `codebases/<name>/.upstreamer/eval-report.md` with the failed eval result, attempted fixes, remaining blockers, and recommended next action for a human.
3. Return a final report that clearly says the conversion did not pass eval and points to the eval report file.

## Step 10: Update sync state

After downstream verification passes, update `.upstreamer/state.yaml` for the codebase with the exact upstream commit processed:

```yaml
upstream_commit: <current-upstream-head-sha>
```

Only update this state after successful verification. Do not update it if conversion was partial, failed, or left unresolved verification issues.

## Final report

Start the final report with a section named `Run summary`. It must be useful to someone reviewing the log later and must include:

1. `Upstream changes since last run`: summarize the meaningful upstream commits/files/features inspected since the previous verified commit. For a first run, say there was no previous verified commit and summarize the upstream snapshot used.
2. `Downstream changes made`: summarize what you added, adapted, removed, or left unchanged in the downstream output, including the main files, skills, library modules, CLI behavior, docs, or tests affected.
3. `Why these downstream changes`: connect the downstream changes to the rewrite contract, especially judgment calls about what was kept, adapted, or dropped.
4. `Verification`: state the commands/checks run and whether they passed.

Also update `upstreamer-changelog.md` in the downstream root. This changelog is user-facing and should read like concise release notes for a busy engineer, not sync bookkeeping. Include at-a-glance bullets about upstream product changes, downstream user-visible changes, and notable omissions or compatibility notes. Do not mention commit hashes, `.upstreamer/state.yaml`, verifier internals, or other implementation bookkeeping in the downstream changelog.

Then return the detailed report:

1. Output location.
2. Count of kept, adapted, and dropped skills.
3. Notable drop/adapt decisions.
4. Verification commands run and results.
5. Qualitative eval run, result, and `eval-report.md` path when `.upstreamer/eval.md` exists.
6. Previous upstream commit and current upstream commit.
7. Whether the run was full or incremental, including notable upstream files changed since the previous commit.
8. Any remaining uncertainty or rules that required judgment.

### Example run summaries

Example incremental TypeScript library run:

```markdown
## Run summary

Upstream changes since last run: the meaningful delta was README and skill behavior updates, new Reddit public fallback paths, GitHub/http/pipeline/planner changes, Digg coverage, and expanded tests. Removed upstream docs, plugin packaging, and historical fixtures stayed dropped by contract.

Downstream changes made: updated the TypeScript CLI/library to preserve the new source behavior. Added a `digg` optional adapter, strengthened Reddit fallback handling, expanded GitHub result handling, updated setup/docs/tests, and kept generated eval artifacts ignored.

Why these downstream changes: the contract requires preserving the upstream source surface where practical while keeping each source independently optional and avoiding Python/plugin packaging. Reddit, GitHub, and Digg behavior mapped cleanly to optional TypeScript adapters; removed docs and packaging did not.

Verification: `npm test`, `npm run typecheck`, `npm run build`, live evals, and `verify-last30days-ts.sh` ran. Deterministic checks and verifier passed; live evals had usable zero-key and Exa results with some keyed-provider warnings.
```

Example incremental markdown skills run:

```markdown
## Run summary

Upstream changes since last run: the upstream diff was broad, dominated by infrastructure, tests, docs, and helper binaries, but it also included new or changed portable `SKILL.md` workflows including iOS, document/spec, design, QA, scraping, canary, Codex, and Hacker News frontpage skills.

Downstream changes made: added fresh markdown-only skill directories for the portable new workflows: `canary`, `codex`, `design-consultation`, `design-html`, `design-shotgun`, `devex-review`, `document-generate`, `hackernews-frontpage`, `ios-clean`, `ios-design-review`, `ios-fix`, `ios-qa`, `qa-only`, `qa`, `scrape`, and `spec`. Refreshed the downstream README skill list.

Why these downstream changes: the contract requires one `SKILL.md` per skill directory with no helper scripts, binaries, telemetry, config, or upstream-specific state. Portable workflows were adapted into concise markdown; infrastructure-heavy upstream changes and nested helper implementations were dropped.

Verification: `verify-tstack.sh` plus manual shape/reference checks passed. The downstream has only README/LICENSE/VERSION plus one-file skill directories, no nested files, no executables, and no banned upstream infrastructure references.
```
