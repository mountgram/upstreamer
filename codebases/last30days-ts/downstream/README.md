# Last30Days Skill

Last30Days is an installable agent skill with a bundled Bun/TypeScript research CLI under `scripts/last30days/`. Installing the skill brings the agent instructions, source code, source adapters, tests, config examples, and planning/reranking references together in one skill directory.

It researches what people actually say about a topic in the last N days across Exa or Brave web search, Reddit, Hacker News, X/Twitter, YouTube, TikTok, GitHub, Polymarket, Digg, and other optional sources.

## Install The Skill

```bash
npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream --skill last30days
```

The installed `last30days` skill directory contains the runnable Bun project. After installing, open that skill directory and run:

```bash
cd scripts/last30days
bun install
bun run setup
bun run last30days -- "React Server Components"
```

## What Gets Installed

```text
last30days/
├── SKILL.md
├── references/
│   ├── planning.md
│   ├── reranking.md
│   └── INSTALL.md
└── scripts/
    └── last30days/
        ├── package.json
        ├── bun.lock
        ├── .env.example
        ├── src/
        └── test/
```

The skill is self-contained. It does not require a separate global `last30days` npm package.

## Source Configuration

Configure `EXA_API_KEY` for preferred web search or `BRAVE_API_KEY` as a fallback. Other source-specific keys are optional and isolated.

Public or local sources can still work when available:

- Reddit public JSON/RSS
- Hacker News Algolia API
- GitHub unauthenticated API
- Polymarket public API
- Digg through optional `digg-pp-cli`
- YouTube through optional `yt-dlp`

Optional keyed sources include Exa, Brave, Serper, Parallel, X/Grok, Perplexity through OpenRouter, ScrapeCreators social sources, Bluesky, and Truth Social. See `scripts/last30days/.env.example` inside the installed skill for the exact variables.

## Run And Verify

From the installed skill directory:

```bash
cd scripts/last30days
bun install
bun run typecheck
bun run test
```

Live evals are maintained outside the installed skill at `downstream/eval/`. They write generated artifacts to `downstream/eval-output/`, which is ignored by git and should not be installed on a customer machine.

From `downstream/skills/last30days/scripts/last30days`, maintainers can run:

```bash
bunx tsx ../../../../eval/run.ts
```

## Notes

- The X/Grok adapter uses xAI `responses.create` with the `x_search` tool and parses strict JSON posts from `output_text`.
- Unofficial scraping-based web search adapters are intentionally omitted in favor of Exa and Brave.
- Planning guidance lives in `references/planning.md`; scoring and synthesis guidance lives in `references/reranking.md`.
- This downstream is derived from `mvanhorn/last30days-skill` and rewritten as a self-contained TypeScript skill bundle.

## License

MIT
