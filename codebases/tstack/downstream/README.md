# TStack

TStack is a minimal, pure-markdown skills collection for AI agents. Every skill is a single `SKILL.md` file with YAML frontmatter and instructions. There are no helper scripts, binaries, dependencies, config files, generated artifacts, or build steps.

## Usage

Point an AI agent at a skill directory and have it read `SKILL.md`. The agent uses the frontmatter to understand when the skill applies, then follows the markdown workflow.

Bash code blocks are instructional only and use ordinary commands such as `git`, `gh`, `find`, `grep`, `curl`, `node`, or platform tools already available in the project.

## Skills

- **autoplan** — Coordinate multiple review passes before implementation.
- **canary** — Validate a deployed change with targeted smoke checks.
- **careful** — Slow down around destructive or irreversible actions.
- **codex** — Ask for an optional second-pass critique from another coding agent or CLI.
- **cso** — Run a security audit across product, code, data, and supply chain risk.
- **design-consultation** — Turn design feedback into an actionable product/design plan.
- **design-html** — Build static HTML/CSS design explorations for review.
- **design-review** — Review visual quality, interaction polish, accessibility, and responsiveness.
- **design-shotgun** — Generate and compare several divergent design directions.
- **devex-review** — Audit developer experience from first contact to first successful change.
- **document-generate** — Create task-focused documentation using a clear docs taxonomy.
- **document-release** — Update release-facing docs after shipping.
- **freeze**, **unfreeze**, **careful**, **guard** — Manage local edit boundaries and safety posture.
- **hackernews-frontpage** — Summarize Hacker News front-page patterns from accessible page content.
- **health** — Check codebase health with available tests, type checks, lint, and dependency signals.
- **investigate** — Debug from symptoms to root cause with evidence.
- **ios-clean**, **ios-design-review**, **ios-fix**, **ios-qa** — Run portable iOS cleanup, review, fix, and QA workflows.
- **land-and-deploy**, **setup-deploy**, **ship** — Prepare, land, deploy, and verify releases, including App Store release via fastlane.
- **office-hours** — Pressure-test product ideas with founder-style questions.
- **plan-ceo-review**, **plan-design-review**, **plan-devex-review**, **plan-eng-review** — Review plans from strategy, design, developer experience, and engineering perspectives.
- **qa**, **qa-only** — Exercise changes and report defects with reproduction detail.
- **retro** — Run a practical retrospective focused on lessons and follow-up actions.
- **review** — Review code changes before landing.
- **scrape** — Extract structured facts from web pages using available browsing or fetch tools.
- **spec** — Convert a request into an implementation-ready specification.

## Structure

```text
tstack/
├── README.md
├── LICENSE
├── VERSION
└── <skill-name>/
    └── SKILL.md
```

Each skill directory contains exactly one file: `SKILL.md`.
