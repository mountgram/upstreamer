# TStack

A minimal, pure-markdown skills framework for AI agents. Every skill is a single
SKILL.md file with YAML frontmatter and instructions. No helper scripts, no
binaries, no config files, no tracking.

## Available skills

### Plan & Strategy
- **office-hours** — Product brainstorming with YC-style diagnostic questions
- **plan-ceo-review** — CEO-level plan review: scope, architecture, strategy
- **plan-eng-review** — Engineering plan review: architecture, tests, performance
- **plan-design-review** — Design plan review: 0-10 ratings across design dimensions
- **plan-devex-review** — Developer experience plan review: TTHW, SDK, docs

### Implementation
- **review** — Pre-landing PR review with fix-first classification
- **investigate** — Systematic root-cause debugging
- **cso** — Chief Security Officer audit (OWASP, STRIDE, supply chain)

### Design & QA
- **design-review** — Design QA checklist for visual audits
- **autoplan** — Multi-pass review orchestrator

### Release & Operations
- **ship** — Release checklist and PR creation
- **land-and-deploy** — Merge, deploy, and verify
- **setup-deploy** — One-time deploy platform detection
- **document-release** — Post-ship documentation updates
- **health** — Code quality dashboard (type check, lint, tests)

### Process
- **retro** — Weekly engineering retrospective
- **careful** — Warn before destructive commands
- **freeze** — Restrict edits to one directory
- **guard** — Combined careful + freeze
- **unfreeze** — Remove directory restrictions

## Usage

Each skill lives in its own directory with a single SKILL.md file. Invoke a skill
by pointing an AI agent at its SKILL.md file. The agent reads the frontmatter for
name/description/triggers, then follows the markdown instructions step by step.

Bash code blocks in skill files use only standard commands (git, gh, grep, find,
curl, etc.). No custom binaries or helper scripts are required.

## Output structure

```
tstack/
├── README.md
├── LICENSE
├── VERSION
└── <skill-name>/
    └── SKILL.md
```

Each skill directory contains exactly one file: SKILL.md. No subdirectories, no
generated files, no templates, no package managers.
