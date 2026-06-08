# Reranking

How Last30Days TS scores and ranks research results across sources.

## Scoring Architecture

Results are scored on a composite that combines:

1. **Local relevance** (35%): How well the result matches the search query
2. **Freshness** (30%): How recent the result is within the lookback window
3. **Engagement** (25%): Public interaction signals (upvotes, likes, views, comments)
4. **Source quality** (10%): The inherent signal quality of the source type

## Source Quality Weights

Different sources carry different implicit signal quality:

| Source | Weight | Rationale |
|--------|--------|-----------|
| Web search (Exa, Brave) | 0.85-1.0 | Editorial and news content, generally reliable |
| X/Twitter | 0.68 | Real-time reactions, can be noisy |
| Reddit | 0.60 | Community discussion, variable quality |
| YouTube | 0.55 | Long-form content, but engagement is spread out |
| GitHub | 0.50 | Code activity, concrete signal |
| Hacker News | 0.45 | Tech community consensus |
| Polymarket | 0.40 | Real-money prediction, high signal when relevant |
| TikTok, Instagram, Bluesky | 0.35 | Creator content, engagement-driven |
| Truth Social, Digg | 0.30 | Niche audiences |
| Pinterest | 0.25 | Visual discovery, narrow utility |

## Engagement Signals by Source

### X/Twitter
- Likes (0.55) — strongest endorsement signal
- Reposts (0.25) — amplification signal
- Replies (0.15) — discussion signal
- Views (0.05) — reach signal

### Reddit
- Score/upvotes (0.60) — community agreement
- Comment count (0.40) — discussion depth

### YouTube
- Likes (0.40) — strongest endorsement
- Views (0.30) — reach
- Comments (0.30) — discussion

### Hacker News
- Points (0.50) — community interest
- Comment count (0.50) — discussion quality

### Polymarket
- Volume (0.50) — market conviction
- Liquidity (0.50) — market health

### GitHub
- Stars (0.60) — community interest
- Forks (0.20) — derivative work
- Watchers (0.20) — ongoing interest

## Deduplication

Within each source, near-duplicate items are removed using hybrid similarity:
- **Character n-gram Jaccard**: catches copy-pasted content
- **Token Jaccard**: catches rewritten content with same vocabulary
- **Threshold**: 0.70 (70% similarity = duplicate)

## Clustering

Cross-source results are clustered to merge the same story from multiple platforms:
1. Sort candidates by score
2. Greedy clustering around high-ranked leaders
3. Similarity threshold: 0.35 for initial grouping
4. Entity-based merge: small clusters (<4 items) with similar titles are merged at 0.45 threshold

## Reciprocal Rank Fusion (RRF)

When items appear in multiple source rankings:
- Score = sum of 1/(k + rank) across all rankings, where k=60
- Normalized by count (each ranking contributes equally)
- Final RRF score is min-max normalized to 0-100

## Final Score Composition

```
final = 0.60 * rerank + 0.20 * rrf + 0.10 * freshness + 0.05 * source_quality + 0.05 * engagement
```

## Fallback Ranking (No AI Reranker)

When running without an AI reranker (deterministic mode):
1. RRF provides cross-source blending
2. Local relevance + engagement + source quality determine base score
3. Entity mismatch penalty: items not mentioning the target topic are demoted by 50%

## Tie-breaking

When scores are close:
1. Prefer items from multiple sources (cross-source corroboration)
2. Prefer higher-engagement items
3. Prefer more recent items
4. Prefer items with URLs (verifiable)

## Per-Author Cap

To prevent any single voice from dominating results:
- Maximum 3 items per author within a source
- Applied during deduplication and clustering

## Cluster Uncertainty

Clusters are annotated with uncertainty flags:
- **single-source**: All items come from one source (weaker corroboration)
- **thin-evidence**: Fewer than 3 items in the cluster
- **No flag**: Multi-source, well-supported cluster

Use these flags when synthesizing: single-source findings should be presented with appropriate hedging, while multi-source clusters represent stronger consensus.
