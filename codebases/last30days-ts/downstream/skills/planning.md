# Planning Guidance

Use this guidance when turning a research topic into subqueries before calling the TypeScript CLI or library.

- Keep the original topic as the first subquery so results remain anchored to the user's wording.
- Add source-shaped subqueries for communities, repos, videos, markets, and recent news instead of relying on one broad search.
- For people, include likely handles, GitHub usernames, employers, products, and communities when known.
- For comparisons, plan each entity separately before merging the brief so one famous entity does not drown out the others.
- Prefer direct public signals: Reddit threads, Hacker News discussions, GitHub issues and releases, YouTube transcripts, market odds, and grounded web citations.
- Do not require model-provider keys for planning. The host agent can write a small query plan itself, and the library can use deterministic fallback subqueries.
