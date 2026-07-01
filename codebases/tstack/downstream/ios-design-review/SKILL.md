---
name: ios-design-review
description: |
  Visual design audit for iOS apps. Reviews screens against Apple HIG, DESIGN.md,
  and design best practices. Scores each dimension 0-10 with "what would make it
  a 10" framing — mirrors plan-design-review for browser apps. Use when asked to
  "review the iOS design", "audit the iPhone app's visuals", or "design QA the
  iOS app".
triggers:
  - review the ios design
  - audit the iphone app visuals
  - design qa the ios app
---

# iOS Design Review

Designer's-eye QA for iOS apps. Finds visual inconsistency, spacing issues, hierarchy problems, AI-slop patterns, and accessibility gaps. Rates each dimension 0-10. Mirrors `plan-design-review`'s scoring rubric ported to iOS idioms.

## Dimensions + Scoring

For each screen in the app, score 0-10 and explain what would push it to 10:

1. **Typography hierarchy.** Display vs body vs caption sizes consistent with Apple HIG. SF Pro at correct dynamic-type scale. Line-height matches font size. No 12pt body anywhere.

2. **Spacing rhythm.** 4pt or 8pt grid used consistently. No magic 17/23/31pt paddings. Safe-area insets respected.

3. **Color hierarchy.** Primary action highest contrast; secondary muted; destructive distinct. Dark mode renders correctly. Contrast ratios meet WCAG AA for body text (4.5:1) and large text (3:1).

4. **Touch targets.** Every interactive element >= 44x44pt. No "tappable text" smaller than 24pt.

5. **Loading + empty + error states.** Each present and intentional. No blank screens during async work. Empty states explain what to do next.

6. **Accessibility.** VoiceOver labels on every interactive element. Dynamic Type cap at XXL doesn't break layouts. Reduce Motion respected. Color-blindness palette tested (deuteranopia is most common).

7. **Animation discipline.** No more than 2 simultaneous animations. Duration 200-300ms for UI feedback. Spring damping correct (not bouncy for serious flows).

8. **iOS idiom alignment.** Uses native components (`NavigationStack`, `List`, `Form`, system sheets) where appropriate. No re-invented navigation. No web-style hamburger menus on phone.

9. **Information density.** Per-screen content fits without horizontal scroll. Long screens have section anchors. Lists use real iOS list patterns (swipe-to-delete, contextual menus).

10. **AI-slop check.** Generic stock layouts, "lorem ipsum" data left in, cargo-cult Material Design imported from Android, gradients that smell AI-generated.

## Review Loop

1. Identify the major screens of the app (from navigation structure, storyboard, or tab bar).
2. For each screen:
   - Inspect the view code and layout definitions
   - Apply the 10-dimension rubric
   - Score each dimension 0-10
   - Record findings with specific file paths and line references
3. For any dimension scored < 7, present the issue with recommended fix and tradeoff.
4. "What would make it a 10" per dimension — concrete, actionable.

## Output

Write a markdown report with:

```
iOS DESIGN REVIEW — {app name} — {date}
========================================
Screens Reviewed: {N}

Per-Screen Scores:
----------------------------------------
Screen: {name}
  Typography:         {N}/10 — {one line on what's missing for 10}
  Spacing:            {N}/10 — ...
  Color:              {N}/10 — ...
  Touch Targets:      {N}/10 — ...
  Loading/Error:      {N}/10 — ...
  Accessibility:      {N}/10 — ...
  Animation:          {N}/10 — ...
  iOS Alignment:      {N}/10 — ...
  Info Density:       {N}/10 — ...
  AI-Slop:            {N}/10 — ...
  Overall:            {N}/10

Biggest Leverage Fixes:
1. [Fix] — [Impact]
2. ...
```

## Failure Modes

| Symptom | Action |
|---|---|
| App doesn't build | Note as blocker; review source statically |
| Can't access certain screens | Note as untested; ask user for access |
| Screen list incomplete | Ask user to confirm which screens to review |
