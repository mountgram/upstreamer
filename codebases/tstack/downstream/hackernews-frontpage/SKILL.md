---
name: hackernews-frontpage
description: |
  Scrape the Hacker News front page and return structured story data as JSON.
  Optionally produce a theme summary from the extracted data.
triggers:
  - scrape hacker news frontpage
  - scrape hn frontpage
  - get hn top stories
  - latest hacker news stories
  - hacker news front page
  - summarize hacker news
---

# Hacker News Front Page

Extract the top 30 stories from `news.ycombinator.com` as structured JSON, then optionally
summarize themes. The primary output is machine-readable data; the summary is secondary.

## Workflow

### Phase 1: Fetch the page

Use the tools available in the current agent environment to fetch the front page
HTML content. Options, in order of preference:

- **Agent browsing/fetch tools** — call `WebFetch` or equivalent to pull
  `https://news.ycombinator.com` and read the raw HTML.
- **curl fallback** — `curl -sL https://news.ycombinator.com`.

### Phase 2: Extract structured story data

Parse the HTML. HN uses a stable `tr.athing` row structure:

- `<tr class="athing">` contains the story rank and title link.
- The next `<tr>` contains the score (points) and comment count.

For each story, extract:

| Field      | Source                               |
|------------|--------------------------------------|
| `rank`     | `<span class="rank">`                |
| `title`    | `<a class="titleline">` inner text   |
| `url`      | `<a class="titleline">` `href`       |
| `points`   | `<span class="score">` (number only) |
| `comments` | Comment link text (number only)      |

Parse up to 30 stories.

### Phase 3: Emit structured JSON

Produce exactly this shape as the primary output:

```json
{
  "stories": [
    {
      "rank": 1,
      "title": "...",
      "url": "...",
      "points": 412,
      "comments": 87
    }
  ],
  "count": 30
}
```

Rules:
- Omit the `url` field only if the story has no link (Ask HN, Show HN job
  posts, etc.).
- `points` and `comments` must be integers. Use `0` if absent.
- If fewer than 30 stories are on the page, return whatever was found and set
  `count` to the actual number.

### Phase 4 (optional): Theme summary

After the JSON output, optionally add a brief theme summary if the user asked
for it:

- Group stories into themes (AI, programming, business, security, science,
  culture).
- Call out unusually high point counts, high comment-to-point ratios, or
  repeated topics.
- Note surprising or under-reported stories.
- Do NOT claim article contents unless you opened and read the linked article.

## Output ordering

1. Structured JSON (Phase 3) — always present. This is the primary output.
2. Theme summary (Phase 4) — present only when the request included words like
   "summarize", "themes", "what's happening", or "overview".

## Failure handling

- If `news.ycombinator.com` is unreachable, report "HN unreachable: <error>".
- If the page HTML has changed and `tr.athing` rows are not found, report "HN
  page structure changed — unable to parse stories."
- Do NOT return partial results. Either all stories parse or none do.
