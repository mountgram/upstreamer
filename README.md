# upstreamer

Keep **sythnetic codebases** in sync with upstream repos, rewritten to your specifications.

## What?

A **sythnetic codebase** is a downstream repo derived from an upstream source but rewritten according to your rules. It's synthetic because it's generated, and it's authentic because it tracks the real upstream.

`upstreamer` takes repos you like and periodically rewrites them into sythnetic codebases that stay up-to-date as the upstream evolves.

### Examples

- **"I like this Python package, but I need it in TypeScript"**
- **"I don't want all the extras—just these simple bits"**
- **"I like this repo but it needs a different name and less cruft"**

## How It Works

1. **Configure** each sythnetic codebase in its own directory with an `upstreamer.md` file
2. **Poll** upstream repos for changes (via GitHub API)
3. **Rewrite** codebases using the agent instructions written in natural language in each `upstreamer.md`
4. **Commit** results to your sythnetic codebases

## Concrete Example

Take [gstack](https://github.com/garrytan/gstack) — a project with skills markdown, but also telemetry, complex infrastructure, and a name tied to the original author.

With `upstreamer`, you can create a sythnetic `tstack` that:

- Keeps only the **skills markdown** files
- Removes all **telemetry** and **infrastructure complexity**
- Renames the project from **"gstack"** to **"tstack"**
- Automatically syncs when gstack updates

## Project Structure

Each sythnetic codebase lives in its own directory with an `upstreamer.md` file:

```
upstreamer/
└── codebases/
    ├── tstack/
    │   └── upstreamer.md
    └── some-lib-ts/
        └── upstreamer.md
```

## upstreamer.md Format

Each `upstreamer.md` is a markdown file with YAML frontmatter. The frontmatter defines the upstream source and sync schedule. The markdown body contains natural language transformation rules specific to that codebase (what to keep, what to drop, how to rewrite).

The frontmatter may also specify the opencode model for that codebase:

```yaml
---
upstream: garrytan/gstack
downstream: mountgram/tstack
schedule: "0 */6 * * *"
model: deepseek/deepseek-v4-pro
---
```

`OPENCODE_MODEL` overrides the frontmatter model for one-off runs.

The generic conversion workflow (clone, evaluate, process, verify) is handled by the `upstreamer-converter` skill in `.agents/skills/upstreamer-converter/`.

See [`codebases/tstack/upstreamer.md`](codebases/tstack/upstreamer.md) for a working example.

## Usage

```bash
# Run one configured sythnetic codebase through opencode
./scripts/upstream tstack

# Choose a specific opencode model
OPENCODE_MODEL=anthropic/claude-sonnet-4-5 ./scripts/upstream tstack

# Stop a stuck run after one hour
UPSTREAMER_TIMEOUT_SECONDS=3600 ./scripts/upstream tstack
```

`./scripts/upstream <name>` reads `codebases/<name>/upstreamer.md`, uses its `model:` frontmatter unless `OPENCODE_MODEL` is set, and invokes `opencode run` with the generic converter skill at `.agents/skills/upstreamer-converter/SKILL.md`. The generated prompt tells the agent to read both files first, execute the conversion end-to-end, write the downstream result to `codebases/<name>/downstream`, run any bundled verification scripts, and return the final report requested by the codebase contract.

The wrapper sets `TMPDIR` to `tmp/upstreamer/<name>/` and instructs opencode to keep temporary files there, so it does not need external-directory permissions for system `/tmp`.

Each run is logged under `codebases/<name>/.upstreamer/logs/` so another agent or reviewer can inspect what the conversion agent did.

If a model does not stop after producing its final report, set `UPSTREAMER_TIMEOUT_SECONDS` to cap the run.

The last successfully processed upstream commit is tracked in `codebases/<name>/.upstreamer/state.yaml`. On later runs, the wrapper includes that commit in the opencode prompt so the conversion agent can inspect upstream changes since the previous run and update only affected downstream files. The agent should update `upstream_commit` only after verification passes.

If the current upstream HEAD matches `upstream_commit` and `codebases/<name>/downstream` already exists, the wrapper runs the codebase verifier, writes a log, and exits without launching opencode.

Additional opencode arguments can be passed after `--`:

```bash
./scripts/upstream tstack -- --print-logs
./scripts/upstream tstack -- --agent build
```

## Requirements

- `opencode` CLI tool for executing the rewrite agent
- API key for the model used by opencode (e.g., OpenAI, Anthropic)
- GitHub access token for polling upstream repos

## License

MIT
