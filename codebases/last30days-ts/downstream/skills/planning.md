# Planning Guidance

Use this guidance when turning a user request into a Last30Days TS query plan.

## When To Plan

Plan before running `last30days` when the topic is ambiguous, comparative, person/company-specific, or likely to have different names across communities.

## Query Shape

- Keep the original topic as the first subquery so results remain anchored to the user's wording.
- Add source-shaped subqueries for communities, repos, videos, markets, and recent news instead of relying on one broad search.
- For products, include vendor names, common abbreviations, repo names, and launch names.
- For people, include likely handles, GitHub usernames, employers, products, and communities when known.
- For comparisons, plan each entity separately before merging the brief so one famous entity does not drown out the others.
- For incidents or controversies, include neutral wording plus likely terms people would use in Reddit, Hacker News, GitHub, YouTube, and news search.

## Source Emphasis

- Prefer direct public signals: Reddit threads, Hacker News discussions, GitHub issues and releases, YouTube transcripts, market odds, and grounded web citations.
- Use Exa/Brave/Serper/Parallel/Perplexity as additive web/search coverage when keys are available.
- Use X only through the xAI/Grok adapter with `XAI_API_KEY` or `GROK_API_KEY`.
- Do not ask for browser session credentials for X/Twitter.

## Agent Constraints

- Do not require model-provider keys for planning. The host agent can write a small query plan itself, and the library can use deterministic fallback subqueries.
- Do not hide uncertainty. If the query is underspecified, choose a reasonable first pass and say what you searched.
- After the run, compare the result against the query plan and note source gaps before answering.
