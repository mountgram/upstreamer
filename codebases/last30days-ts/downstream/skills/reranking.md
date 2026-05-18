# Reranking Guidance

Use this guidance when reviewing or adjusting ranked evidence from Last30Days TS before answering a user.

## What Good Evidence Looks Like

- Recent items inside the requested lookback window are usually stronger than older context.
- First-hand or platform-native evidence is stronger than summaries of summaries.
- Items with inspectable citations are stronger than unsupported claims.
- Engagement matters when it is source-native: upvotes, comments, likes, views, stars, market volume, or repeated discussion across independent sources.
- Source diversity matters when independent sources are reacting to the same underlying event.

## What To Penalize

- Generic SEO pages, thin snippets, and results that only match a common word in the topic.
- Placeholder adapter output or setup text that is not real evidence.
- Duplicate URLs and near-duplicate stories that crowd out other signals.
- Results outside the lookback window unless they explain why a current discussion matters.
- Off-topic GitHub/Polymarket/search hits that match only broad words.

## Tie-Breaking

- Choose the item with better source diversity, clearer date, and a citation that a reader can inspect.
- Prefer developer/community primary sources for developer-tool topics.
- Prefer platform-native social/video posts for discourse topics.
- Prefer grounded web/search citations for broad news topics.

## Agent Output Rules

- Say when the brief is thin or source coverage is limited.
- Mention skipped or failed important adapters when they affect confidence.
- Do not imply missing source coverage is negative evidence.
- Do not invent reranked items that are not present in the brief.
