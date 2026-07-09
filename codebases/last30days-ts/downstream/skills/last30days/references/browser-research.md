---
title: Browser Research
description: When and how to use browser automation alongside Last30Days TS source SDKs
---

# Browser Research

Use Last30Days TS for broad, repeatable discovery. Use a browser when the web page itself is the evidence or when APIs and search adapters return thin, ambiguous, or stale metadata.

This skill does not install agent-browser, Rotunda, Playwright, or any browser runtime. If the host agent already has a browser tool, browser skill, agent-browser, Rotunda, or a project-specific browser workflow, use it as an optional companion step.

## Use the SDK/CLI First

Start with the bundled SDK or CLI when you need:

- Broad discovery across sources.
- Repeatable queries and JSON/Markdown output.
- Fast source availability checks.
- Public APIs such as Hacker News, Reddit, GitHub, Polymarket, arXiv, Techmeme, or Exa/Brave web search.

Then use a browser to verify or deepen the specific leads that matter.

## Use a Browser When

- A page is dynamic, lazy-loaded, or requires client-side navigation.
- The source requires visible UI context, such as a LinkedIn profile, Instagram post, TikTok page, company page, or post thread.
- You need exact quoted text, screenshots, visible author identity, timestamps, reactions, or page layout.
- The API result has only a title/snippet but the final answer depends on details from the page.
- Search results need manual filtering, sorting, pagination, or disambiguation.
- The user asks for a source manifest, screenshot-ready proof, or distribution-ready attribution.

## Good Browser Targets

- LinkedIn profiles, posts, company pages, and job pages.
- Instagram profiles/posts, TikTok creator pages, and other social surfaces where API snippets miss visible context.
- X posts or threads when exact post text, visual context, or screenshots matter.
- Company pricing pages, docs, changelogs, status pages, and launch pages.
- Review sites and marketplaces where sorting, filters, and pagination shape the evidence.
- News/article pages where the snippet is insufficient and the original page must be read.

## Avoid Browser Use When

- A stable public API or SDK already returns the needed structured evidence.
- The page is private, paywalled, or access-restricted and the user has not explicitly authorized use of their session.
- Browser automation would bypass site controls, CAPTCHAs, paywalls, or terms of service.
- The result would be less reproducible than an API call and the page itself is not important evidence.

## Workflow

1. Run the CLI or SDK to discover candidate sources.
2. Pick the few candidates where exact page evidence matters.
3. Open those pages with the available browser tool in the host environment.
4. Capture the URL, title, visible author/source, visible date, exact quote or observation, and any uncertainty.
5. Return browser findings as verification notes, not as a hidden replacement for cited search results.

## LinkedIn Pattern

For LinkedIn-heavy research:

1. Use `searchLinkedIn()` or the orchestrated CLI when `SCRAPECREATORS_API_KEY` is available.
2. If results are thin, stale, or identity-sensitive, use an available browser tool to inspect the public profile/post/company page.
3. Prefer public, visible facts: headline, company, role, post text, date, link, and visible engagement.
4. Do not claim private profile details, hidden comments, or logged-in-only information unless the user explicitly provided access and asked for that review.

## Instagram/TikTok Pattern

For creator, brand, or post research where the API path is incomplete:

1. Use ScrapeCreators-backed adapters when `SCRAPECREATORS_API_KEY` is available.
2. If the result depends on visuals, visible captions, story-like context, comments, or profile identity, use an available browser tool.
3. Record only visible public facts unless the user explicitly authorized a logged-in review.
4. Keep screenshots or visual observations separate from structured SDK evidence.

## Output Format

When browser verification changes the answer, include a short note:

```markdown
Browser verification:
- URL: https://...
- Observed: [exact visible fact or quote]
- Why it matters: [how it confirms, corrects, or enriches the SDK result]
- Uncertainty: [login state, partial page, pagination, blocked content, etc.]
```

Keep browser evidence separate from SDK evidence so downstream readers can tell which claims came from structured search and which came from visible page inspection.
