---
upstream: garrytan/gstack
downstream: mountgram/tstack
schedule: "0 */6 * * *"
model: deepseek/deepseek-v4-pro
---

# TStack Rewrite Rules

TStack is a **minimal, pure-markdown skills framework**. No helper scripts, no binaries, no config files, no telemetry — just AI agent skills written in clean markdown.

This conversion should produce a fresh downstream repository, not a lightly edited copy of the upstream tree. Use the upstream skills as source material, then rewrite kept skills into clean downstream markdown.

## Philosophy

**KISS: Keep It Simple, Skills.**

- Every skill is a single markdown file with YAML frontmatter + instructions
- Bash code blocks in SKILL.md files are fine — they're instructions for the AI agent
- But no external helper scripts, binaries, or tooling that the skill depends on
- No references to `~/.tstack`, `~/.gstack`, config files, or session state
- No binaries, no dependencies, no package.json, no build step
- Just markdown files that tell AI agents what to do

## What to Keep

Start with every `SKILL.md` file from the upstream repo. Evaluate each one individually.

Before writing output files, create a working inventory of every upstream `SKILL.md` using this shape:

```text
Path | Decision | Reason | Output skill name
```

Decision must be one of:

- `KEEP` — the skill is already portable as markdown instructions
- `ADAPT` — the skill idea is useful, but the upstream workflow must be rewritten around generic agent capabilities or standard commands
- `DROP` — the skill depends on custom infrastructure, binaries, hosted services, generated artifacts, telemetry, or an upstream-specific context store

Do not begin writing downstream skill files until the inventory is complete.

## What to Remove Entirely

Remove these directories and files completely (no attempt to salvage):

- `bin/` — All CLI binaries and helper scripts
- `scripts/` — Build scripts, analytics, skill doc generation, test runners
- `test/` — Entire test suite
- `supabase/` — Database infrastructure
- `extension/` — Browser extension code
- `hosts/` — Host adapters for Claude, Cursor, Codex, etc.
- `lib/` — Shared libraries
- `browse/` — Browser implementation directory (but keep `browse/SKILL.md` if it can work without the browser binary)
- `design/` — Design tool implementation directory
- `make-pdf/` — PDF generation tool directory
- `model-overlays/` — Model-specific prompt overlays
- `gstack/` — gstack-specific metadata directory
- `agents/` — Agent configurations
- `.github/`, `.gitlab-ci.yml` — CI/CD
- `conductor.json`, `package.json`, `bun.lock`
- `CHANGELOG.md`, `TODOS.md`, `ARCHITECTURE.md`, `BROWSER.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `DESIGN.md`, `USING_GBRAIN_WITH_GSTACK.md`
- `docs/` directory
- `SKILL.md.tmpl` files (we're not generating skills, we're writing them)
- `AGENTS.md` (we'll generate a simpler README instead)
- Any file with "telemetry", "analytics", "gbrain", "benchmark" in its name or path

## How to Process Each SKILL.md

For each skill, the agent should:

Do not perform a mechanical search-and-replace conversion. Rewrite each kept skill as fresh markdown in TStack's voice, preserving only the portable workflow, prompts, checklists, judgment criteria, and standard-tool commands.

### 1. Evaluate: Can this skill work without external helper scripts?

**Keep and rewrite** if the skill's core value is the *instructions* — telling an AI agent how to think, review, plan, or analyze. The skill can reference standard tools like `git`, `gh`, `node`, etc., but should not depend on custom gstack binaries.

Examples to keep:
- `review/` — Code review guidelines (keep, remove references to gstack-review-log, etc.)
- `office-hours/` — Product brainstorming framework (keep, remove gbrain context queries)
- `design-review/` — Design QA checklist (keep, remove dependency on screenshot tooling)
- `plan-*` — Planning skills (keep, they're just thinking frameworks)
- `retro/` — Retrospective format (keep, it's a meeting structure)
- `qa/` — QA workflow (keep if it can work without custom browser binary)
- `ship/` — Release checklist (keep, it's a process)

**Drop entirely** if the skill's core value is a *custom binary tool* that can't be replaced with standard tools:
- `gstack-upgrade/` — Requires upgrade mechanism. Drop.
- `setup-gbrain/`, `sync-gbrain/` — Requires gbrain infrastructure. Drop.
- `context-save/`, `context-restore/` — If they depend on gstack-specific context format. Evaluate case by case.

**Use your judgment.** If a skill uses bash to run `git diff`, that's fine. But if it requires `~/.claude/skills/gstack/bin/gstack-something`, either remove that dependency or drop the skill.

### 2. Strip the gstack infrastructure preamble

Every gstack SKILL.md has a massive preamble. Remove ALL of these infrastructure-specific sections:

- The bash preamble block that runs update checks, session tracking, telemetry, etc. (keep only the first few lines if they set useful variables, otherwise remove entirely)
- `## Plan Mode Safe Operations` (gstack-specific)
- `## Skill Invocation During Plan Mode` (gstack-specific)
- `## Skill routing` (gstack-specific)
- `## Artifacts Sync`
- `## Model-Specific Behavioral Patch`
- `## Context Recovery`
- `## Writing Style` (gstack-specific explain levels)
- `## Completeness Principle — Boil the Lake`
- `## Confusion Protocol`
- `## Continuous Checkpoint Mode`
- `## Context Health`
- `## Question Tuning`
- `## Repo Ownership`
- `## Search Before Building`
- `## Completion Status Protocol`
- `## Operational Self-Improvement`
- `## Telemetry`
- `## Plan Status Footer`

Keep these sections if present:
- `## Voice` (personality/tone instructions)
- `## AskUserQuestion Format` (only if it's generic, not gstack-specific)
- The actual skill steps, checklists, prompts

### 3. Clean the YAML frontmatter

Simplify the frontmatter to only these fields:

```yaml
---
name: skill-name
description: |
  What this skill does. Keep it concise.
triggers:
  - trigger phrase 1
  - trigger phrase 2
---
```

Remove:
- `preamble-tier` (we have no preamble)
- `version` (we're not versioning)
- `allowed-tools` (the agent has its own tools)
- `gbrain` section entirely
- Any gstack-specific metadata

### 4. Remove references to gstack helper scripts and infrastructure

Replace or remove throughout the skill content:

**Remove entirely:**
- All references to `~/.gstack/`
- All references to `~/.claude/skills/gstack/`
- All references to `~/.claude/skills/tstack/` (we don't install to ~/.tstack)
- `gstack-config` and all config lookups
- `gstack-update-check`
- `gstack-telemetry-log`
- `gstack-timeline-log`
- `gstack-slug`
- `gstack-learnings-search`
- Any `bin/gstack-*` or `bin/tstack-*` references
- Session tracking
- Telemetry
- Analytics
- Checkpoint mode
- Routing
- `.feature-prompted-*` markers
- `.telemetry-prompted` markers
- `.proactive-prompted` markers

**Keep but clean up:**
- Standard git commands (`git diff`, `git log`, `git branch`)
- Standard GitHub CLI commands (`gh pr view`, `gh auth status`)
- Standard system commands (`find`, `grep`, `wc`, `mkdir`, `touch`)
- Environment variables that are standard (`$HOME`, `$PWD`)

**Rename:**
- `gstack` → `tstack` (in user-facing text, descriptions, skill names)
- `garrytan` → `mountgram`
- `Garry's Stack` → `TStack`

### 5. Clean up bash code blocks

Bash code blocks in the skill instructions are fine, but clean them up:

**Remove lines that:**
- Call gstack helper scripts (`~/.claude/skills/gstack/bin/*`)
- Check gstack config (`gstack-config get`)
- Track sessions or telemetry
- Write to `~/.gstack/`
- Run update checks
- Log to analytics

**Keep lines that:**
- Run standard git commands
- Run standard GitHub CLI commands
- Do simple file operations
- Are part of the actual skill workflow

**Example transformation:**

Before:
```bash
_UPD=$(~/.claude/skills/gstack/bin/gstack-update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
mkdir -p ~/.gstack/sessions
touch ~/.gstack/sessions/"$PPID"
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
```

After:
```bash
_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
echo "BRANCH: $_BRANCH"
```

### 6. Rewrite skills that depend on browser/screenshot tooling

For skills like `browse/`, `design-review/`, `qa/` that reference browser capabilities:

- If the skill can be rewritten to use the agent's native browsing tools (like the WebSearch or Browser tools that Claude/Cursor may have), keep it and rewrite the instructions
- If the skill fundamentally requires a custom headless browser binary that we don't have, drop it
- For `design-review/`, keep the design checklist and visual QA instructions, but remove the screenshot comparison workflow that depends on the browse binary

## Final Output Structure

The repo should look like:

```
codebases/tstack/downstream/
├── README.md
├── LICENSE
├── VERSION
├── review/
│   └── SKILL.md
├── office-hours/
│   └── SKILL.md
├── plan-ceo-review/
│   └── SKILL.md
├── retro/
│   └── SKILL.md
└── [other pure-markdown skills...]
```

Each directory has exactly one file: `SKILL.md`.
No subdirectories within skill directories.
No generated files.
No templates.

## Verification

Before finishing, verify:
- [ ] No references to gstack helper scripts (`bin/gstack-*`, `gstack-config`, etc.)
- [ ] No references to `~/.gstack/`, `~/.tstack/`, or session tracking
- [ ] No telemetry, analytics, or routing references
- [ ] No files other than SKILL.md in skill directories
- [ ] no upstream CI/CD, no infrastructure files, no package.json

Run the bundled verifier against the downstream output directory:

```bash
codebases/tstack/.upstreamer/scripts/verify-tstack.sh codebases/tstack/downstream
```

If running checks manually, use these macOS-compatible commands:

```bash
find <downstream-dir> -type f | sort
find <downstream-dir> -mindepth 2 -maxdepth 2 -type f ! -name SKILL.md
find <downstream-dir> -mindepth 3 -type f
find <downstream-dir> -type f -perm -111
grep -RInE 'gstack|garrytan|~/.gstack|~/.tstack|~/.claude/skills/(gstack|tstack)|bin/(gstack|tstack)-|gstack-config|gstack-update-check|gstack-telemetry-log|gstack-timeline-log|gstack-slug|gstack-learnings-search|telemetry|analytics|gbrain|benchmark|session tracking|checkpoint|routing|bun.lock' <downstream-dir> || true
```

Review every grep hit before finishing. Fix any real violation and rerun verification until it passes.

## Final Report

Return:

- Output location
- Count of kept, adapted, and dropped skills
- The decision inventory, or a concise summary of it
- Notable drop/adapt decisions
- Verification commands run and results
- Any remaining uncertainty or rules that required judgment
