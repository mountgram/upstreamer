# upstreamer

Keep **synthetic codebases** in sync with upstream repos, rewritten around your own local purpose.

Upstreamer is for projects that should follow an upstream repo without becoming a normal fork. You write a plain-English rewrite contract, run the wrapper, and get a downstream codebase that keeps the parts you care about while removing or replacing the parts that do not fit.

Use it when you want to repeatedly translate a real project into a different shape: a Python tool into a TypeScript library, a full agent framework into portable markdown skills, a large app into a smaller reference implementation, or an unreliable adapter into a better local choice.

The durable artifact is the contract in `codebases/<name>/upstreamer.md`. The generated downstream files are outputs of that contract.

For a deeper explanation, see [`docs/SYNTHETIC_CODEBASES.md`](docs/SYNTHETIC_CODEBASES.md).

## Why This Exists

Forks are good when you want to preserve upstream structure and make local patches. Dependencies are good when you can use upstream as-is. Upstreamer is for the middle case: upstream has useful behavior, examples, workflows, or product direction, but the downstream should have a different runtime, package shape, security model, docs surface, or user experience.

The goal is to make recurring translation explicit instead of tribal. The contract says what to keep, adapt, drop, verify, and evaluate. When upstream changes, you rerun the contract and review the generated diff.

## What You Might Do With It

- Track a popular package while maintaining a TypeScript, Swift, Go, or local-first rewrite.
- Extract a focused CLI or library from a larger app or agent skill.
- Maintain a markdown-only skill pack from a framework that ships binaries and host-specific glue.
- Convert a research prototype into a stable teaching/reference repo.
- Keep an internal starter kit aligned with an upstream public app while replacing infrastructure choices.
- Run qualitative evals that catch "looks complete but lost the important workflow" failures.

## Quick Start

```bash
# Run one configured synthetic codebase
./scripts/upstream tstack

# Re-run even if upstream has not changed, useful after editing upstreamer.md
./scripts/upstream tstack --force

# Choose a model for one run
OPENCODE_MODEL=anthropic/claude-sonnet-4-5 ./scripts/upstream tstack
```

Each run reads `codebases/<name>/upstreamer.md`, invokes `opencode` with the converter skill, writes output under `codebases/<name>/downstream`, and logs the run under `codebases/<name>/.upstreamer/logs/`.

## Install The Public Skills

Two generated downstreams can be installed from their paths in this repo:

```bash
# Install the TStack skill collection globally
npx skills add mountgram/upstreamer/codebases/tstack/downstream -g

# Install the Last30Days research skill globally
npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream -g
```

Use `tstack` when you want portable review, QA, design, security, shipping, and planning workflows. Use `last30days` when you want an agent to research recent public signals with the TypeScript CLI/library.

## Current Examples

| Codebase | Upstream | Downstream purpose |
| --- | --- | --- |
| [`tstack`](codebases/tstack/upstreamer.md) | [`garrytan/gstack`](https://github.com/garrytan/gstack) | A pure-markdown agent skills collection with helper scripts, telemetry, binaries, and package infrastructure removed. |
| [`last30days-ts`](codebases/last30days-ts/upstreamer.md) | [`mvanhorn/last30days-skill`](https://github.com/mvanhorn/last30days-skill) | A TypeScript research CLI and library generated from a Python-oriented agent skill project, with DuckDuckGo removed in favor of Exa and Brave web search. |

## What Can You Rewrite?

Start with a project whose behavior you like, then describe the downstream you actually want:

| Upstream project type | Possible synthetic downstream | Contract focus |
| --- | --- | --- |
| Popular Python package | TypeScript library with similar behavior | Preserve public behavior and tests; rewrite runtime, packaging, and examples. |
| Agent skills bundle | Markdown-only skill pack | Keep portable `SKILL.md` workflows; drop custom binaries, telemetry, config, and host-specific glue. |
| Full-stack app | Smaller starter or reference implementation | Keep architecture and UX patterns; remove deployment-specific services and local assumptions. |
| Research CLI | CLI plus importable library | Keep source coverage and output quality; simplify setup, adapters, and evals. |

The contract is the product spec. The generated files are outputs of that contract. See [`docs/SYNTHETIC_CODEBASES.md`](docs/SYNTHETIC_CODEBASES.md) for how to decide whether this pattern fits your project.

## How It Works

1. Configure each synthetic codebase in `codebases/<name>/upstreamer.md`.
2. `scripts/upstream` clones or fetches the upstream repo with git and checks the last verified upstream commit.
3. If upstream changed, or `--force` is passed, the wrapper launches `opencode run` with `.agents/skills/upstreamer-converter/SKILL.md`.
4. The conversion agent reads the contract, summarizes what changed upstream since the last verified run, rewrites the downstream output, runs any codebase-specific verifier, runs any qualitative `.upstreamer/eval.md`, and updates `.upstreamer/state.yaml` only after successful verification and eval.
5. If upstream has not changed and downstream output already exists, the wrapper writes a no-change run summary and executes the verifier directly.

Each log starts with, or includes, an at-a-glance run summary that explains the upstream delta, what was put into the downstream output, why those changes match the contract, verification results, and qualitative eval results. Model-backed runs also update `upstreamer-changelog.md` in the downstream root with user-facing release-note style bullets.

If a qualitative eval fails, the converter must fix and rerun it or declare bankruptcy in `codebases/<name>/.upstreamer/eval-report.md`. Failed evals block `.upstreamer/state.yaml` updates.

`upstreamer` does not commit or push generated results for you. Review the output, logs, and git diff before committing.

## Contract Format

Each `upstreamer.md` file has YAML frontmatter plus markdown rewrite rules. The frontmatter identifies the upstream and downstream repositories and can choose a default opencode model:

```yaml
---
upstream: garrytan/gstack
downstream: mountgram/tstack
model: deepseek/deepseek-v4-pro
---
```

The markdown body should be specific about what to keep, adapt, drop, verify, and report. Good contracts usually include:

- The downstream identity and philosophy.
- Source material the converter must inspect.
- Keep/adapt/drop rules.
- Expected output structure.
- Verification commands or quality criteria.
- Optional `.upstreamer/eval.md` criteria for fresh-context qualitative review.
- Final report requirements.

See [`codebases/tstack/upstreamer.md`](codebases/tstack/upstreamer.md) for a markdown-only skills rewrite and [`codebases/last30days-ts/upstreamer.md`](codebases/last30days-ts/upstreamer.md) for a library/CLI rewrite.

## Usage Details

```bash
# Run a configured codebase
./scripts/upstream <name>

# Force conversion after changing the local contract
./scripts/upstream <name> --force

# Stop a stuck run after one hour
UPSTREAMER_TIMEOUT_SECONDS=3600 ./scripts/upstream <name>

# Pass extra args to opencode
./scripts/upstream <name> -- --print-logs
./scripts/upstream <name> -- --agent build
```

`OPENCODE_MODEL` overrides the `model:` value in frontmatter for one-off runs.

The wrapper uses workspace-local temporary paths under `tmp/upstreamer/<name>/`, so conversion agents do not need to write to system `/tmp`.

## Project Structure

```text
upstreamer/
├── scripts/
│   └── upstream
├── docs/
│   └── SYNTHETIC_CODEBASES.md
├── .agents/
│   └── skills/
│       ├── upstreamer-converter/
│       └── upstreamer-codebase-entry/
└── codebases/
    ├── tstack/
    │   ├── upstreamer.md
    │   ├── downstream/
    │   └── .upstreamer/
    └── last30days-ts/
        ├── upstreamer.md
        ├── downstream/
        └── .upstreamer/
```

Important per-codebase paths:

- `codebases/<name>/upstreamer.md`: binding rewrite contract.
- `codebases/<name>/downstream/`: generated downstream output.
- `codebases/<name>/.upstreamer/state.yaml`: last verified upstream commit.
- `codebases/<name>/.upstreamer/logs/`: wrapper and opencode logs.
- `codebases/<name>/.upstreamer/scripts/`: optional verification scripts.
- `codebases/<name>/.upstreamer/eval.md`: optional qualitative eval run by a fresh review context after mechanical checks.
- `codebases/<name>/.upstreamer/eval-report.md`: latest qualitative eval result or bankruptcy report.

## Library Status

Today `upstreamer` is a repo-local Bash wrapper plus agent skills, not an installable library or package API.

Generated downstreams can be libraries, as `last30days-ts` demonstrates. If `upstreamer` itself grows a library interface, the likely extraction points are contract parsing, upstream resolution, conversion prompt construction, state updates, and verifier execution. Until then, `scripts/upstream` is the supported interface.

## Requirements

- Bash and standard Unix tools.
- `git` for cloning and fetching upstream repos.
- `opencode` CLI for executing the rewrite agent.
- API credentials for the opencode model you choose.
- `perl` only when using `UPSTREAMER_TIMEOUT_SECONDS`.
- GitHub credentials only when the upstream repo is private or your git transport requires them.

Run commands from the repository root so relative paths resolve correctly.

## License

MIT
