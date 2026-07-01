---
name: design-html
description: |
  Create static HTML and CSS explorations for interface ideas without adding app
  infrastructure. Works with approved mockups from design-shotgun, CEO plans from
  plan-ceo-review, design review context from plan-design-review, or from scratch
  with a user description. Use when asked to "build the design", "turn this into
  HTML", "make it real", or after any planning or design skill.
triggers:
  - build the design
  - code the mockup
  - make design real
---

# Design HTML: Interface Exploration

You generate production-quality HTML/CSS where text flows correctly, layouts adapt, and the result is self-contained. Not CSS approximations — real computed layout.

## Step 0: Input Detection

Detect what design context exists for this project. Check:

1. **Approved design variants** — has design-shotgun run? Approved mockups?
2. **Plan context** — has plan-ceo-review or plan-design-review produced design direction?
3. **DESIGN.md** — does the project have a design system file?
4. **User description** — what the user said they want

Route based on what's found:

### Case A: approved mockup exists
Read the approved design variant. Extract colors, typography, layout structure, component inventory. Use it as the visual reference.

### Case B: plan context exists, no approved mockup
Read the plan and extract design requirements, user flows, visual direction. Ask: "No approved mockup found but the plan describes [design direction]. Should I design the HTML directly from the plan context, or would you prefer to run design-shotgun first to explore visual directions?"

### Case C: clean slate
Ask: "No design context found. How do you want to start? A) Describe what you want and I'll design HTML live. B) Run design-shotgun first for visual exploration. C) Run plan-ceo-review first to think through product strategy."

After detecting the context, output a brief summary:
- **Mode:** approved-mockup | plan-driven | freeform
- **Visual reference:** path to approved PNG, or "none"
- **Design tokens:** "DESIGN.md" or "none"

## Step 1: Design Analysis

1. If an approved mockup exists, analyze it visually: describe colors, typography, layout structure, component inventory.
2. If in plan-driven or freeform mode, design from context:
   - Read the plan or user description
   - Extract: target audience, visual feel (dark/light, playful/serious, dense/spacious), content structure, design constraints
   - Describe the intended visual layout, colors, typography, and component structure
3. Read DESIGN.md tokens. These override any extracted values for system-level properties (brand colors, font family, spacing scale).
4. Output an "Implementation spec" summary: colors (hex), fonts (family + weights), spacing scale, component list, layout type.

## Step 2: Framework Detection

Check if the project uses a frontend framework:

```bash
[ -f package.json ] && cat package.json | grep -o '"react"\|"svelte"\|"vue"\|"@angular/core"\|"solid-js"\|"preact"' | head -1 || echo "NONE"
```

If a framework is detected, ask: "Detected [framework] in your project. What format? A) Vanilla HTML — self-contained preview file (recommended for first pass). B) Framework component."

## Step 3: Generate HTML

Write a single self-contained HTML file. Include:

- Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- CSS custom properties for design tokens from DESIGN.md / Step 1 extraction
- Google Fonts via `<link>` tags where appropriate
- Responsive behavior at 375px, 768px, 1024px, 1440px breakpoints
- ARIA attributes, heading hierarchy, focus-visible states
- `prefers-color-scheme` media query for dark mode
- `prefers-reduced-motion` for animation respect
- Real content (never lorem ipsum)

**Never include (AI slop blacklist):**
- Purple/blue gradients as default
- Generic 3-column feature grids
- Center-everything layouts with no visual hierarchy
- Decorative blobs, waves, or geometric patterns not in the mockup
- Stock photo placeholder divs
- "Get Started" / "Learn More" generic CTAs not from the mockup
- Rounded-corner cards with drop shadows as the default component
- Emoji as visual elements
- Generic testimonial sections
- Cookie-cutter hero sections with left-text right-image

## Step 4: Preview + Refinement Loop

```
LOOP:
  1. Show the user the generated HTML (or tell them how to open it)
  2. If an approved mockup exists, reference it for visual comparison
  3. Ask: "The HTML is ready. What needs to change? Say 'done' when satisfied."
  4. If "done" / "ship it" / "looks good" → exit loop, go to Step 5
  5. Apply feedback using targeted edits (surgical, not full regenerate)
  6. Brief summary of what changed (2-3 lines)
  7. Go to LOOP
```

Maximum 10 iterations. After 10, ask: "We've done 10 rounds. Want to continue iterating or call it done?"

## Step 5: Save & Next Steps

### Design Token Extraction

If no `DESIGN.md` exists in the repo root, offer to create one from the generated HTML by extracting: CSS custom properties (colors, spacing, font sizes), font families and weights, color palette, spacing scale, border radius values.

Ask: "Want me to create a DESIGN.md from these tokens so future design runs are style-consistent?"

### Next Steps

Ask: "Design finalized. What's next? A) Copy to project — integrate into your codebase. B) Iterate more. C) Done — I'll use this as a reference."

## Important Rules

- **Source of truth fidelity over code elegance.** When an approved mockup exists, match it. The user's feedback during refinement is the source of truth.
- **Surgical edits in the refinement loop.** Make targeted changes, not full regenerations.
- **Real content only.** Extract text from the mockup or use content from the plan. Never "Lorem ipsum."
- **One page per invocation.** For multi-page designs, run once per page.
- **No AI slop.** Your output should demonstrate taste.
