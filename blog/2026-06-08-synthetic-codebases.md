# Open-source projects should be allowed to have downstreams

By Topper Bowers

I like a lot of what is in GStack. The skills are useful. The taste is good. There is real workflow knowledge in there.

I do not want the setup machinery, templating, installer behavior, generated files, telemetry-shaped plumbing, and host-specific assumptions. For my use case, the best version of that project is a directory of markdown skills.

That is what upstreamer is for.

Upstreamer watches an upstream repo through normal git state, then orchestrates an agent when that upstream changes. The agent reads a rewrite contract, inspects the upstream diff, rewrites the downstream, runs mechanical checks, runs a qualitative eval when one exists, and only then records the upstream commit as processed.

The result is a new canonical downstream, not a pile of local patches. The downstream has its own README, changelog, verifier, eval standard, and install story. It is derived from upstream, but it is allowed to have a different purpose.

## The fork is the wrong unit of work

The usual open-source answer is to fork the repo and start deleting things.

That works for a week. Then upstream changes, and now your fork has two jobs. It has to preserve the upstream improvements you still care about, and it has to remember every local decision you made about what not to inherit.

Most forks are bad at remembering intent. They remember files.

Upstreamer treats the local intent as the thing to preserve. Each downstream gets an `upstreamer.md` contract that says what to keep, what to adapt, what to remove, and how to tell whether the result is any good.

The generated downstream is output. The contract is the product spec.

## GStack has good skills. TStack wants only the skills.

The first concrete example is `tstack`.

Upstream is [`garrytan/gstack`](https://github.com/garrytan/gstack). Downstream is a markdown-only skill collection.

The contract says, roughly:

- inspect the upstream skill templates first, especially `SKILL.md.tmpl` files
- keep portable workflows, checklists, rubrics, prompts, review criteria, and safety gates
- drop helper binaries, package infrastructure, telemetry, generated templates, browser daemons, session state, and GStack-specific setup
- write one `SKILL.md` per skill directory
- keep the downstream installable as plain agent skills

That is not a fork in the normal sense. It is a translation.

The upstream project can keep being itself. It can have its installer, templates, local runtime assumptions, and whatever complexity makes sense for that project.

TStack can keep being a much smaller thing: the portable agent workflows, rewritten as markdown.

The important failure mode here was not a syntax error. It was over-compression. One conversion turned `devex-review` from a real live developer-experience audit into a short checklist. Mechanically valid, spiritually dead.

That is why `tstack` now has a qualitative eval. The eval checks whether a rich upstream workflow still has its phases, evidence rules, scorecards, output templates, and refusal rules after conversion. A markdown file that lost the useful instructions should fail, even if every shell check passes.

## Last30Days had the right idea in the wrong shape for us

The second example is `last30days-ts`.

Upstream is [`mvanhorn/last30days-skill`](https://github.com/mvanhorn/last30days-skill). The concept is excellent: research what people have said about a topic recently, across public sources, then produce a concise brief with citations.

The upstream implementation is Python. It worked, but for my use case it was clunky to run, and I wanted the result to match a TypeScript/Bun workflow. I also wanted to choose different source trade-offs.

So the downstream contract converts it into an installable agent skill with bundled Bun/TypeScript source:

```text
last30days/
├── SKILL.md
├── references/
│   ├── INSTALL.md
│   ├── planning.md
│   └── reranking.md
└── scripts/
    └── last30days/
        ├── package.json
        ├── bun.lock
        ├── src/
        └── test/
```

Installing the skill gives you the instructions and the code. No separate global package. No "go find the real project somewhere else" step.

The skill tells the agent where the bundled project lives:

```bash
cd scripts/last30days
bun install
bun run setup
bun run last30days -- "React Server Components"
```

We also made source choices in the downstream. DuckDuckGo came out. The unofficial scraping path was too unreliable for this use case. Exa became the preferred web-search source, Brave became the fallback, and X/Grok uses xAI's `x_search` tool.

That last adapter caught a real bug. The first implementation looked for top-level `tool_results`. The xAI Responses API does not return useful post data there. The adapter now asks for strict JSON and parses posts from `output_text`, with tool usage treated as diagnostics.

Again, this is not a normal fork. It is a maintained translation into a shape that fits a different environment.

## Upstream projects should not have to become kitchen sinks

This is the part I care about most.

Open-source maintainers get pulled toward kitchen-sink repos because users ask for every runtime, every integration, every deployment target, every packaging style, every auth model, every adapter.

Sometimes those features belong upstream. Often they do not.

With a contract-driven downstream, upstream can stay focused. It can expose the behavior, concepts, tests, examples, and docs that matter. Downstream users can create their own feature streams without asking upstream to absorb every preference.

The Python project can stay Python. The TypeScript downstream can exist anyway.

The full framework can keep its installer. The markdown-only skill collection can exist anyway.

The source project does not have to become all things to all users just because different users need different shapes.

## Open source should look more like a graph

We usually talk about open-source projects as if there is one canonical codebase and everything else is a fork, a plugin, or a package.

That model is too narrow.

A healthier ecosystem looks more like a graph:

```text
         upstream project
          /      |      \
         /       |       \
 markdown    TypeScript   local-first
 skill pack   skill       starter
```

The edges are not random copies. They are contracts.

Each edge says how to translate upstream into a downstream that has its own purpose. Each downstream can have its own verifier, qualitative eval, changelog, and install story. If upstream improves, downstreams can update without pretending they are all the same product.

That is the promise of synthetic codebases. Not AI-generated forks for the sake of more code. Maintained translations with explicit intent.

## How upstreamer implements this today

The current implementation is small on purpose.

```bash
./scripts/upstream <name>
```

That wrapper reads `codebases/<name>/upstreamer.md`, fetches upstream, invokes the converter skill when needed, runs mechanical verification, runs qualitative eval when configured, and writes sync state only after success.

If eval fails, the converter is supposed to fix and rerun it. If it cannot make the eval pass, it writes `.upstreamer/eval-report.md` and leaves state unchanged.

The project now has two configured examples:

- [`codebases/tstack/upstreamer.md`](../codebases/tstack/upstreamer.md)
- [`codebases/last30days-ts/upstreamer.md`](../codebases/last30days-ts/upstreamer.md)

And a longer explanation of the pattern:

- [`docs/SYNTHETIC_CODEBASES.md`](../docs/SYNTHETIC_CODEBASES.md)

## Try the generated skills

Install the TStack skill collection:

```bash
npx skills add mountgram/upstreamer/codebases/tstack/downstream --skill '*'
```

Install the Last30Days skill:

```bash
npx skills add mountgram/upstreamer/codebases/last30days-ts/downstream --skill last30days
```

Then read the contracts. The contracts are where the interesting product decisions live.

The next step is making the eval loop easier to inspect and making failed conversions easier to recover from. The goal is not to remove judgment from downstream maintenance. The goal is to write the judgment down so it can run again when upstream changes.
