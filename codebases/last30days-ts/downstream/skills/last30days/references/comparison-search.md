---
title: Comparison Search
description: How to run effective head-to-head comparisons with Last30Days TS across multiple topics or products
---

# Comparison Search

Last30Days TS supports head-to-head comparisons through a single query with entity-aware source routing. Instead of running separate searches for each entity, the engine resolves subqueries, sources, and ranking queries for all sides simultaneously.

## When to Run a Comparison

A comparison is useful when you want to understand how the community and recent events position two or more alternatives against each other. Examples:

- **Product vs product:** "Cursor IDE vs Codex vs Copilot"
- **Technology vs technology:** "Rust vs Go for CLI tools"
- **Person vs person:** "Peter Steinberger vs Sam Altman on agents"
- **Mixed comparison:** "OpenClaw vs Hermes for self-improving agents"

## How Comparisons Work

The engine splits a comparison topic into per-entity subqueries, fanning out adapters in parallel. Results are clustered, scored, and the final synthesis presents a side-by-side view with:

- Quick verdict summarizing the community consensus
- Per-entity sections with community sentiment and evidence
- Head-to-head analysis where the entities are directly compared
- Bottom-line recommendation grounded in cited evidence

## Best Practices

### Be Specific About What You're Comparing

"Rust vs Go" returns broad community sentiment. "Rust vs Go for CLI tool performance" focuses on a specific decision context. The engine's subquery formation uses the full comparison string, so add context words to sharpen the result.

### Include All Sides in One Query

The engine's fan-out handles two-way and three-way comparisons. A single query like "OpenClaw vs Hermes vs Paperclip" is more coherent than running three separate searches and merging them by hand.

### Trust the Relevancy Scoring

Comparisons score higher when entities appear together in the same cluster, signaling direct community discussion. Items that mention only one side of a comparison are weighted lower.

## CLI Usage

```bash
bun run last30days -- "Cursor IDE vs Codex vs GitHub Copilot"
```

The depth flag controls how many results are returned per side:

```bash
bun run last30days -- "React vs Vue" --depth deep
```

All-time search is useful when the comparison involves technologies that don't change weekly:

```bash
bun run last30days -- "GraphQL vs REST" --lookback 3650 --timeframe all
```

## Interpretation

- **Quick Verdict:** The community's headline take. High-engagement, multi-source items strongly influence this.
- **Per-entity sections:** What each side's community says, independently. Uses source-appropriate engagement signals.
- **Head-to-Head:** Direct cross-source clusters where the entities appear in the same story.
- **Bottom Line:** Synthesis grounded in cited evidence, not opinion.

## Output Format

For comparisons, the engine produces structured output with section headers per the comparison template. The badge, footer, and citations follow the standard output contract.
