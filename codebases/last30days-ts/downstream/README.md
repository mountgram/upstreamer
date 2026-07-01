# Last30Days Skill

Last30Days is an installable agent skill with a bundled Bun/TypeScript research CLI under `scripts/last30days/`. Installing the skill brings the agent instructions, source code, source adapters, tests, config examples, and planning/reranking references together in one skill directory.

It researches what people actually say about a topic in the last N days across Exa or Brave web search, OpenAI web grounding, Reddit, Hacker News, X/Twitter, YouTube, Gemini YouTube understanding, Gemini Maps grounding, TikTok, GitHub, Polymarket, Digg, arXiv, Techmeme, Trustpilot, LinkedIn, Bluesky, Truth Social, health sources, and other optional sources. The `--hiring-signals` flag analyzes public job postings to surface company focus shifts.

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
│   ├── comparison-search.md
│   ├── all-time-search.md
│   ├── browser-research.md
│   ├── source-sdk-guide.md
│   └── INSTALL.md
└── scripts/
    └── last30days/
        ├── package.json
        ├── bun.lock
        ├── tsconfig.json
        ├── .env.example
        ├── src/
        │   ├── index.ts
        │   ├── cli.ts
        │   ├── setup.ts
        │   └── sources/  (28 source SDKs and utilities)
        └── test/
```

The skill is self-contained. It does not require a separate global `last30days` npm package.

## Source Configuration

Configure `EXA_API_KEY` for preferred web search or `BRAVE_API_KEY` as a fallback. Use `OPENAI_API_KEY` for optional OpenAI web-search grounding, and `GEMINI_API_KEY` for YouTube video understanding and Maps grounding. Other source-specific keys are optional and isolated.

If keys live in the host repo-root `.env`, load them before changing into the installed skill directory:

```bash
set -a; source .env; set +a
cd .agents/skills/last30days/scripts/last30days
bun run setup
```

Public or local sources can still work when available:

- Reddit public JSON/RSS with comment enrichment
- Hacker News Algolia API
- GitHub unauthenticated API
- Polymarket public API
- Digg through optional `digg-pp-cli`
- arXiv through optional `arxiv-pp-cli`
- Techmeme through optional `techmeme-pp-cli`
- Trustpilot through optional `trustpilot-pp-cli` (auto-gated on brand topics)
- YouTube through optional `yt-dlp`
- Gemini YouTube analysis through `GEMINI_API_KEY` plus `yt-dlp` discovery
- Gemini Maps grounding through `GEMINI_API_KEY` for spatial/place questions
- Health sources via MedlinePlus/NIH public API
- Jobs/Hiring Signals via public ATS APIs (Greenhouse, Lever, Ashby)

Optional keyed sources include Exa, Brave, OpenAI web grounding, Gemini YouTube/Maps grounding, Serper, Parallel, X/Grok, Perplexity/Sonar through OpenRouter, ScrapeCreators social sources (TikTok, Instagram, Threads, Pinterest, LinkedIn), Bluesky, and Truth Social. Perplexity/Sonar is expensive and opt-in only via `--web-backend perplexity` or `--include-sources perplexity`. See `scripts/last30days/.env.example` inside the installed skill for the exact variables.

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

- The X/Grok adapter uses xAI `responses.create` with the `x_search` and `web_search` tools, parsing strict JSON posts from `output_text`.
- The OpenAI adapter uses Responses API web-search grounding as the preferred LLM-grounded web option when configured.
- The Gemini adapters use Gemini for YouTube video understanding and Google Maps grounding for spatial/place questions.
- Perplexity/Sonar is available through OpenRouter but intentionally de-emphasized because of cost; opt in explicitly when needed.
- Unofficial scraping-based web search adapters are intentionally omitted in favor of Exa and Brave.
- Trustpilot is gated on brand-shaped topics and requires `trustpilot-pp-cli` on PATH.
- arXiv adapter uses `arxiv-pp-cli` with relevance-sorted search and a 365-day recency window.
- Techmeme adapter uses `techmeme-pp-cli` for current tech news headlines.
- LinkedIn adapter uses ScrapeCreators with article enrichment for person topics.
- Browser tools are optional companions, not dependencies. Use an available browser skill/tool for dynamic or identity-sensitive pages such as LinkedIn profiles/posts when API results need verification. See `references/browser-research.md`.
- Planning guidance lives in `references/planning.md`; reranking in `references/reranking.md`; comparison search in `references/comparison-search.md`; all-time search in `references/all-time-search.md`; browser guidance in `references/browser-research.md`; SDK import guide in `references/source-sdk-guide.md`.
- This downstream is derived from `mvanhorn/last30days-skill` and rewritten as a self-contained TypeScript skill bundle.

## License

MIT
