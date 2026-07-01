---
title: All-Time Search
description: How to run unbounded historical searches with Last30Days TS using --timeframe all
---

# All-Time Search

Last30Days TS defaults to a 30-day lookback for recent research, but it supports explicitly unbounded searches through the `--timeframe all` flag or by setting a long lookback window. The engine is not limited to a 30-day window, and all-time output must never claim results are from "the last 30 days."

## When to Use All-Time Search

- **Reference topics:** When the topic doesn't change quickly, such as historical events, foundational papers, or classic comparisons.
- **Evergreen research:** When you want canonical community consensus rather than recent news.
- **Long-tail searches:** When the last 30 days would return too few results.

## CLI Usage

```bash
bun run last30days -- "Rust vs Go for CLI tools" --timeframe all --lookback 3650
```

The `--timeframe all` flag tells the engine to use a wide window and to never describe results as "last 30 days." Combine with `--lookback` to set the maximum days (in practice, sources older than the lookback window are not returned).

## SDK Usage

```typescript
import { runResearch } from "last30days-skill";

const report = await runResearch({
  topic: "history of the Rust language",
  lookbackDays: 3650,
  outputFormat: "markdown",
});
```

Omit `lookbackDays` to use the default 30-day window. A high value combined with a wide window produces an unbounded result.

## Output Behavior

When an all-time search is selected, the output badge and synthesis reflect the actual search window rather than forcing "last 30 days" branding:

- Badge metadata shows the actual date range.
- The engine's source adapters do not filter on a short recency window.
- Older canonical evidence is allowed and surfaced when relevant.

## Source-Specific Behavior

Different sources handle unlimited lookback differently:

| Source | All-Time Behavior |
|--------|-------------------|
| Exa | Searches with wide date range; older results rank lower |
| Brave | Wide date freshness filter; news API returns only recent |
| Reddit | Searches all time by default; recency only affects ranking |
| Hacker News | Algolia search is inherently all-time |
| GitHub | Repos and issues are unlimited; date-filtered client-side |
| X/Grok | xAI search prioritizes recent but returns relevant older posts |
| YouTube | yt-dlp returns most relevant; client-side date filter |
| arXiv | Older papers are dropped only past 365 days for relevance |
| Techmeme | Current news cycle only; inherently recent |
| Trustpilot | Current sentiment; not date-filtered |

Sources that are inherently recent (Techmeme, Trustpilot current snapshot) operate normally; they are not modified for all-time mode.

## Comparison with Recent Search

Recent search (default) is better for:
- Breaking news and announcements
- What people are saying right now
- Pre-meeting research on a person or company

All-time search is better for:
- Understanding a technology's evolution
- Canonical references and foundational papers
- Long-tail topics with sparse recent coverage
