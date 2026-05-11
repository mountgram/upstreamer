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

The generic conversion workflow (clone, evaluate, process, verify) is handled by the `upstreamer-converter` skill in `.agents/skills/upstreamer-converter/`.

See [`codebases/tstack/upstreamer.md`](codebases/tstack/upstreamer.md) for a working example.

## Usage

```bash
# Run once for all configured sythnetic codebases
upstreamer

# Run as a daemon, polling for changes
upstreamer --daemon
```

`upstreamer` discovers all `upstreamer.md` files in subdirectories and processes each one.

## Requirements

- `opencode` CLI tool for executing the rewrite agent
- API key for the model used by opencode (e.g., OpenAI, Anthropic)
- GitHub access token for polling upstream repos

## License

MIT
