# Reranking

How Last30Days TS scores and ranks research results across sources.

## Scoring Architecture

Results are scored on a composite:

- Local relevance: how well the result matches the search query.
- Freshness: how recent the result is within the lookback window.
- Engagement: public interaction signals such as upvotes, likes, views, and comments.
- Source quality: the inherent signal quality of the source type.

## Source Quality Weights

Different sources carry different implicit signal quality:

| Source | Weight | Rationale |
| --- | --- | --- |
| Web search: Exa, Brave | High | Editorial and news content, generally reliable. |
| X/Twitter | Medium-high | Real-time reactions, can be noisy. |
| Reddit | Medium | Community discussion, variable quality. |
| YouTube | Medium | Long-form content, but engagement is spread out. |
| GitHub | Medium | Code activity, concrete signal. |
| Hacker News | Medium | Tech community consensus. |
| Polymarket | Medium-low | Real-money prediction, high signal when relevant. |
| TikTok, Instagram, Bluesky | Low-medium | Creator content, engagement-driven. |
| Truth Social, Digg | Low-medium | Niche audiences. |
| Pinterest | Low | Visual discovery, narrow utility. |

## Engagement Signals By Source

### X/Twitter

- Likes: strongest endorsement signal.
- Reposts: amplification signal.
- Replies: discussion signal.
- Views: reach signal.

### Reddit

- Score/upvotes: community agreement.
- Comment count: discussion depth.

### YouTube

- Likes: endorsement.
- Views: reach.
- Comments: discussion.

### Hacker News

- Points: community interest.
- Comment count: discussion quality.

### Polymarket

- Volume: market conviction.
- Liquidity: market health.

### GitHub

- Stars: community interest.
- Forks: derivative work.
- Watchers: ongoing interest.

## Deduplication

Within each source, near-duplicate items are removed with hybrid similarity:

- Character n-gram Jaccard catches copy-pasted content.
- Token Jaccard catches rewritten content with the same vocabulary.
- A high similarity threshold means duplicate or near-duplicate.

## Clustering

Cross-source results are clustered to merge the same story from multiple platforms:

1. Sort candidates by score.
2. Greedily cluster around high-ranked leaders.
3. Merge small clusters with similar titles.
4. Prefer clusters with multiple sources when synthesizing.

## Reciprocal Rank Fusion

When items appear in multiple source rankings, reciprocal rank fusion blends their positions so a result that is consistently high across sources outranks a single-source spike.

## Fallback Ranking

When running without an AI reranker:

1. Cross-source blending provides basic corroboration.
2. Local relevance, engagement, and source quality determine base score.
3. Entity mismatch penalties demote items that do not mention the target topic.

## Tie-Breaking

When scores are close:

1. Prefer items from multiple sources.
2. Prefer higher-engagement items.
3. Prefer more recent items.
4. Prefer items with inspectable URLs.

## Per-Author Cap

Avoid letting one author dominate a source. If several posts come from the same author, keep only the strongest few unless the user's query is specifically about that author.

## Cluster Uncertainty

Use uncertainty flags when synthesizing:

- Single-source findings should be hedged.
- Thin-evidence clusters should be treated as leads, not conclusions.
- Multi-source clusters represent stronger consensus.
