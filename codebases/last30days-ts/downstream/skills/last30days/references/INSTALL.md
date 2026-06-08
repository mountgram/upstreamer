# Install Last30Days

Last30Days ships with a bundled Bun/TypeScript project under `scripts/last30days/`.

Requirements:

- Bun installed and available as `bun`.
- Optional source API keys exported in the environment or copied into `scripts/last30days/.env`.

First-time setup from this installed skill directory:

```bash
cd scripts/last30days
bun install
```

Check source availability:

```bash
bun run setup
```

Run a search:

```bash
bun run last30days -- "React Server Components"
```

Run local verification:

```bash
bun run typecheck
bun run test
```

Live evals are maintained outside the installed skill bundle in the upstreamer downstream repo. They are not part of the installed customer-facing skill.
