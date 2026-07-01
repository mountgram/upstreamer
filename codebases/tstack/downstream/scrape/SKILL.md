---
name: scrape
description: |
  Extract structured information from web pages using available browsing or fetch tools.
  Read-only by design — pull data from a page and return it as structured JSON. Use
  when asked to "scrape", "get data from", "pull", "extract from", or "what's on" a
  page.
triggers:
  - scrape this page
  - get data from
  - pull from
  - extract from
  - what is on
---

# Scrape — Pull Data from a Page

One entry point for getting data off the web. Two paths under the hood:

1. **Match path** — if the user's intent matches a known extraction pattern, run it directly and return JSON.
2. **Prototype path** — no matching pattern yet, so drive the page with fetch or browse tools, return the JSON.

Read-only by contract. If the intent implies writing (submitting forms, clicking buttons that mutate state), refuse.

## Step 1 — Determine Intent

The user's request after invoking scrape is the intent. If they did not include one, ask once:

> "What do you want to scrape? Describe it in one line, e.g. 'top stories on Hacker News' or 'product names + prices on example.com/products'."

Do not ask multiple clarifying questions up front. Any further questions go in the prototype path.

## Step 2 — Refuse Mutating Intents

If the intent implies writes — verbs like *submit*, *post*, *send*, *log in*, *click X*, *fill the form*, *delete*, *create*, *order*, *book* — respond:

> "Scrape is read-only. For mutating flows, use the browse or automate tools directly."

Stop. Do not proceed.

## Step 3 — Match Phase

Check if the user's intent matches a known extraction pattern:

- Is the target a known site with a predictable structure? (e.g., Hacker News front page, GitHub repo page)
- Is the data requested a common pattern? (e.g., list of items with properties)
- Can the extraction be done with a simple HTTP fetch + parsing?

A confident match means **all three** are true:
- The intent's domain is accessible via HTTP fetch or page load
- The data structure is predictable and parseable
- The intent does not require complex interactions (login, infinite scroll, JS-rendered content)

If matched, execute the extraction directly and emit the JSON result. Stop.

If matching is ambiguous, fall through to the prototype path rather than guess wrong.

## Step 4 — Prototype Phase

No match. Drive the page using available tools:

1. **Fetch the page** — navigate or fetch the target URL:

```bash
curl -s -L "<url>" > /tmp/scrape-page.html
```

Or use available browsing tools to navigate to the page.

2. **Inspect the structure** — examine the page source to find selectors for the target data:

```bash
grep -oP '<pattern>' /tmp/scrape-page.html | head -20
```

Or parse with available HTML parsing tools (`pup`, `jq`, `htmlq`, `python -c`, etc.)

3. **Extract structured content** — parse lists, tables, repeated rows, or text content:

```bash
# Example: extract from HTML
python3 -c "
from html.parser import HTMLParser
import json, sys
# ... parse logic ...
print(json.dumps(result))
"
```

4. **Iterate** — try a selector, check the output, refine. Maximum 3-4 selector attempts before reporting failure.

## Step 5 — Output Discipline

Emit the result as JSON on stdout. Use a stable shape:

```json
{
  "items": [...],
  "count": N,
  "source": "<url>",
  "extracted_at": "<ISO timestamp>"
}
```

Rules:
- **One JSON document, on stdout.** No prose wrapped around the JSON unless the user asked for explanation.
- **No partial results.** If extraction fails, report what was tried and what blocked — do not emit partial data.
- **Stderr (or chat) is for logs.** Keep the data output clean for piping to `jq` or other tools.

## When the Prototype Fails

If the page loads but data extraction does not yield a sensible JSON shape after 3-4 selector attempts:

- Report what you tried, what came back, and what's blocking (lazy-loaded, JS-rendered, paywalled, auth-required, etc.)
- Do NOT write a partial result and call it done.
- Do NOT suggest caching a broken extraction.
- Ask the user whether they want to (a) try a different selector, (b) switch to a different page, or (c) stop.

## What This Skill Does NOT Do

- Mutating actions (form fills, buttons, submissions)
- Auth flows or login (handle auth before invoking scrape)
- Multi-page crawls (this is one-shot per call)
- Anything that requires interactive state
