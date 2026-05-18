# Planning

How to design effective research queries for Last30Days TS.

## Query Design Principles

### Be Specific
"OpenAI GPT-5 release reaction" is better than "AI news". Specific queries produce focused results across all sources.

### Include Context Words
Add words that signal what kind of content you want:
- "reaction", "review", "announcement" for general sentiment
- "vs", "compared to", "alternative" for comparisons
- "launch", "release", "shipped" for product news
- "problem", "issue", "broken" for pain points
- "tip", "trick", "workflow" for how-to content

### Person Research
For a person, consider:
- Their full name and any known handles
- Companies or products they're associated with
- Recent projects or talks
- Communities where they're discussed

Example: For "Peter Steinberger", queries might include:
- "Peter Steinberger" (primary)
- "steipete" (GitHub/X handle)
- "OpenClaw" (his main project)

### Product/Company Research
For a product, consider:
- The product name and variations
- Competitor names for comparison context
- Related technology terms
- Common user complaints or praise

### Person-to-Product Resolution
When researching a person who created a product:
1. Start with the person's name and handles
2. Resolve their key projects
3. Search for both the person and the product
4. Look for community discussions in relevant subreddits

### Entity Disambiguation
When a term could mean multiple things:
1. Add context words ("Apple Vision Pro" vs "Apple fruit")
2. Use proper capitalization
3. Add domain-specific terms
4. Consider excluding common noise words

## Subquery Formation

For broad topics, break into subqueries:
1. **Core query**: The main topic
2. **Reaction query**: "TOPIC reaction" or "TOPIC review"
3. **Community query**: "TOPIC reddit" or "TOPIC discussion"
4. **Comparison query**: "TOPIC vs ALTERNATIVE"
5. **Prediction query**: "TOPIC future" or "TOPIC 2026"

## Source-Specific Planning

### Web Search (DuckDuckGo, Exa, Brave)
- Use natural language queries
- Include date references for recency
- Consider news-specific searches for breaking stories

### Reddit
- General topics work well with broad subreddit search
- Product/project topics benefit from relevant subreddits
- Person topics may need subreddit hints

### Hacker News
- Tech and startup topics perform best
- Use product names and technical terms
- "Show HN" and "Tell HN" prefixes can surface specific content

### GitHub
- For people: search by username for PRs, issues, repos
- For projects: search repositories and issues
- Use language filters for technology-specific searches

### X/Twitter
- Search handles with @ if known
- Use hashtag forms for trending topics
- Consider related accounts for broader coverage

### YouTube
- Search for reviews, reactions, tutorials
- Channel-specific searches when a creator is known
- Consider transcript content for deep dives

### Polymarket
- Use event-specific terminology
- Consider related markets for context
- Look for both binary and multi-outcome markets

## Avoiding Noise

- Strip question words (what, how, why, when, where)
- Remove stop words that don't add meaning
- Keep compound terms together ("machine learning" not separate)
- Use quotes for exact phrases when precision matters

## Depth Trade-offs

- **Quick** (5 items per source): Fast overview, good for initial scan
- **Medium** (10 items): Balanced coverage, good default
- **Deep** (20 items): Comprehensive, takes longer

Choose depth based on:
- How much you already know about the topic
- Whether you need exhaustive or representative coverage
- Time constraints of the user's request

## Fallback Strategy

If initial queries return few results:
1. Broaden the query (remove specific terms)
2. Try alternative spellings or names
3. Switch from person to product focus (or vice versa)
4. Try news-oriented queries instead of general search
5. Reduce the lookback window to capture more recent content
