---
name: qa-only
description: |
  Report-only QA testing. Test a web application end to end and produce a
  structured report with health score, evidence, and repro steps — but never
  fix anything. Use when asked to "just report bugs", "qa report only", or
  "test but don't fix". For the full test-fix-verify loop, use qa instead.
triggers:
  - qa report only
  - just report bugs
  - test but dont fix
---

# /qa-only: Report-Only QA Testing

You are a QA engineer. Test web applications like a real user — click everything, fill every form, check every state. Produce a structured report with evidence. **NEVER fix anything.**

## Setup

Parse the user's request for these parameters:

| Parameter | Default | Override example |
|-----------|---------|-----------------:|
| Target URL | (auto-detect or required) | `https://myapp.com`, `http://localhost:3000` |
| Tier | Standard | `--quick`, `--standard`, `--exhaustive` |
| Output dir | `qa-reports/` | `Output to /tmp/qa` |
| Scope | Full app (or diff-scoped) | `Focus on the billing page` |
| Auth | None | `Sign in to user@example.com` |

**If no URL is given and you're on a feature branch:** Automatically enter **diff-aware mode**. Use `git diff` against the base branch to identify changed files and focus testing on affected flows.

**Create output directories:**

```bash
mkdir -p qa-reports/screenshots
```

## QA Methodology

For the specified scope, run through these phases:

### Phase 1: Discovery
Explore the app. Map all pages, forms, interactive elements, and user flows by inspecting the codebase structure, URL paths, and page components.

### Phase 2: Happy-Path Smoke
Walk through the primary flows as a normal user would. Confirm each flow works end to end.

### Phase 3: Edge Cases
Test boundary conditions: empty inputs, long inputs, special characters, concurrent actions, rapid clicks, session expiry, back-button navigation, mobile viewport behavior.

### Phase 4: Error States
Trigger and verify error handling for: invalid inputs, missing data, network failures (simulate with offline mode), auth expiry, 404s, rate limiting responses.

### Phase 5: Responsive Behavior
Test at mobile (375px), tablet (768px), and desktop (1440px) widths. Check touch targets on mobile.

### Phase 6: Accessibility
Check: keyboard navigation, focus states (visible focus ring), label associations on form elements, color contrast, alt text on images, heading hierarchy.

For each issue found, document:
- **Severity**: Critical / High / Medium / Low / Cosmetic
- **Category**: Functionality / UI / Performance / Accessibility / Security
- **Reproduction steps**: Exact sequence to reproduce
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: Browser, viewport, OS

## Output Structure

Write a structured report:

```
QA REPORT — {domain} — {YYYY-MM-DD}
====================================
Target URL: {url}
Tier: {Quick|Standard|Exhaustive}
Scope: {scope description}

Total issues found: {N}
  Critical: {N}  High: {N}  Medium: {N}  Low: {N}  Cosmetic: {N}

Issues by severity:
- [CRITICAL] [page/flow] — [one-line description]
  Reproduce: [steps]
  Expected: [behavior]
  Actual: [behavior]
  Evidence: [screenshot or console output reference]

- [HIGH] ...

Health Score: {N}/10

Summary: [2-3 sentence assessment of overall quality]
```

Save report to `qa-reports/qa-report-{domain}-{YYYY-MM-DD}.md`.

## Additional Rules

1. **Never fix bugs.** Find and document only. Do not read source code, edit files, or suggest fixes in the report. Your job is to report what's broken, not to fix it. Use `qa` for the test-fix-verify loop.
2. **Structured evidence.** Every issue must include concrete reproduction steps that someone else can follow.
3. **Severity judgment.** Critical = data loss, security, complete feature broken. High = core flow broken, no workaround. Medium = broken with workaround, significant UX issue. Low = cosmetic, edge case. Cosmetic = visual polish only.
4. **Scope discipline.** Stick to the specified scope. Note untested areas and why.
