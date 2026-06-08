---
name: scrape
description: |
  Extract structured information from web pages using available browsing or fetch tools.
triggers:
  - scrape this
  - extract from page
  - web data extraction
---

# Scrape

Use this skill for small, targeted extraction tasks from public pages or user-provided URLs.

## Workflow

1. Confirm the requested fields and output format.
2. Fetch or browse the page with tools available in the current agent environment.
3. Prefer visible page content and stable semantic structure over brittle selectors.
4. Normalize extracted values and preserve source URLs.
5. Note missing fields, access restrictions, or content that required interpretation.

## Output

Return structured data in the requested format. If no format was requested, use a concise table or JSON-like list.
