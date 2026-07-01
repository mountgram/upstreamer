---
title: Install Last30Days
description: First-time setup instructions for the Last30Days TS Bun/TypeScript skill bundle
---

# Install Last30Days

Last30Days ships with a bundled Bun/TypeScript project under `scripts/last30days/`.

Requirements:

- Bun installed and available as `bun`.
- Optional source API keys exported in the environment or copied into `scripts/last30days/.env`.

## Environment Variables

Skill commands usually run from inside `scripts/last30days/`. If the host project keeps keys in a repo-root `.env`, load them before changing directories or copy only the needed keys into this package's `.env`.

```bash
# From the host project root. Do not print the values.
set -a; source .env; set +a

cd .agents/skills/last30days/scripts/last30days
bun run setup
```

The bundled config reads `.env` from the current working directory. That means `scripts/last30days/.env` works automatically, but a host repo-root `.env` will not be found after you `cd` into the installed skill unless you loaded it first.

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

## Custom Scripts Are Encouraged

For serious research, it is often better to write a tiny TypeScript or JavaScript file that imports the SDK, runs a few tailored searches, custom-parses the JSON, and prints exactly the synthesis shape you need.

```typescript
import { searchInternet } from "./src/index.js";

const report = await searchInternet({
  topic: "AI video generation tools for UGC ads",
  timeframe: "all",
  includeSources: ["exa", "hackernews", "reddit", "gemini_youtube"],
  outputFormat: "json",
});

const links = report.ranked_candidates.map((candidate) => ({
  title: candidate.title,
  url: candidate.url,
  sources: candidate.subquery_labels,
}));

console.log(JSON.stringify(links, null, 2));
```

Run it from `scripts/last30days/` with `bun run ./scratch-my-query.ts`. Keep scratch scripts and generated outputs out of commits unless they are intentionally part of the project.

Run local verification:

```bash
bun run typecheck
bun run test
```

Live evals are maintained outside the installed skill bundle in the upstreamer downstream repo. They are not part of the installed customer-facing skill.
