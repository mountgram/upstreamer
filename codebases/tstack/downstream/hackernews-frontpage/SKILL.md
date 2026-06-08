---
name: hackernews-frontpage
description: |
  Summarize visible themes and notable stories from the Hacker News front page.
triggers:
  - hacker news front page
  - hn summary
  - summarize hacker news
---

# Hacker News Front Page

Use this skill when the user wants a quick read on Hacker News front-page content.

## Workflow

1. Fetch or browse the front page using the tools available in the current agent environment.
2. Extract story titles, links, ranks, points, and comment counts when visible.
3. Group stories by theme such as AI, programming, science, business, security, or culture.
4. Call out unusually high comment counts, surprising sources, or repeated topics.
5. Avoid claiming article contents unless you opened and read the linked article.

## Output

- Top themes.
- Notable individual stories.
- What appears controversial or high-signal.
- Any limitations of the fetched page.
