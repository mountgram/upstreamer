---
name: design-html
description: |
  Create static HTML and CSS explorations for interface ideas without adding app
  infrastructure. Works with approved mockups from design-shotgun, CEO plans from
  plan-ceo-review, design review context from plan-design-review, or from scratch
  with a user description. Text reflows correctly, heights adapt, and the result
  is self-contained. Use when asked to "build the design", "turn this into HTML",
  "make it real", or after any planning or design skill.
triggers:
  - build the design
  - code the mockup
  - make design real
---

# Design HTML: Interface Exploration

You generate production-quality HTML/CSS where text flows correctly, layouts adapt, and the result is self-contained. Not CSS approximations — real computed layout.

## UX Principles: How Users Actually Behave

These principles govern how real humans interact with interfaces. They are observed behavior, not preferences. Apply them before, during, and after every design decision.

### The Three Laws of Usability

1. **Don't make me think.** Every page should be self-evident. If a user stops to think "What do I click?" or "What does this mean?", the design has failed. Self-evident > self-explanatory > requires explanation.
2. **Clicks don't matter, thinking does.** Three mindless, unambiguous clicks beat one click that requires thought. Each step should feel like an obvious choice, not a puzzle.
3. **Omit, then omit again.** Get rid of half the words on each page, then get rid of half of what's left. Happy talk (self-congratulatory text) must die. Instructions must die. If they need reading, the design has failed.

### How Users Actually Behave

- **Users scan, they don't read.** Design for scanning: visual hierarchy (prominence = importance), clearly defined areas, headings and bullet lists, highlighted key terms. You're designing billboards going by at 60 mph, not brochures people will study.
- **Users satisfice.** They pick the first reasonable option, not the best. Make the right choice the most visible choice.
- **Users muddle through.** They don't figure out how things work. They wing it. Once they find something that works, no matter how badly, they stick to it.
- **Users don't read instructions.** They dive in. Guidance must be brief, timely, and unavoidable, or it won't be seen.

### Billboard Design for Interfaces

- **Use conventions.** Logo top-left, nav top/left, search = magnifying glass. Don't innovate on navigation to be clever. Innovate when you KNOW you have a better idea; otherwise use conventions.
- **Visual hierarchy is everything.** Related things are visually grouped. Nested things are visually contained. More important = more prominent. If everything shouts, nothing is heard. Start with the assumption everything is visual noise, guilty until proven innocent.
- **Make clickable things obviously clickable.** No relying on hover states for discoverability, especially on mobile where hover doesn't exist. Shape, location, and formatting (color, underlining) must signal clickability without interaction.
- **Eliminate noise.** Three sources: too many things shouting for attention, things not organized logically, and too much stuff. Fix noise by removal, not addition.
- **Clarity trumps consistency.** If making something significantly clearer requires making it slightly inconsistent, choose clarity every time.

### Navigation as Wayfinding

Users on the web have no sense of scale, direction, or location. Navigation must always answer: What site is this? What page am I on? What are the major sections? The "trunk test": cover everything except the navigation. You should still know what site this is, what page you're on, and what the major sections are. If not, the navigation has failed.

### The Goodwill Reservoir

Users start with a reservoir of goodwill. Every friction point depletes it. Deplete faster: hiding info users want, punishing users for not doing things your way, asking for unnecessary information, putting sizzle in their way, unprofessional or sloppy appearance. Replenish: make top tasks obvious, tell them what they want to know upfront, save steps, make it easy to recover from errors.

### Mobile: Same Rules, Higher Stakes

All the above applies on mobile, just more so. Real estate is scarce, but never sacrifice usability for space savings. Affordances must be VISIBLE: no cursor means no hover-to-discover. Touch targets must be big enough (44px minimum). Prioritize ruthlessly.

## Step 0: Input Detection

Detect what design context exists for this project. Check:

1. **Approved design variants** — has design-shotgun run? Approved mockups?
2. **Plan context** — has plan-ceo-review or plan-design-review produced design direction?
3. **DESIGN.md** — does the project have a design system file?
4. **User description** — what the user said they want

Branch based on what's found:

### Case A: approved mockup exists
Read the approved design variant. Extract colors, typography, layout structure, component inventory. Use it as the visual reference.

### Case B: plan context exists, no approved mockup
Read the plan and extract design requirements, user flows, visual direction. Ask: "No approved mockup found but the plan describes [design direction]. Should I design the HTML directly from the plan context, or would you prefer to run design-shotgun first to explore visual directions?"

### Case C: clean slate
Ask: "No design context found. How do you want to start? A) Describe what you want and I'll design HTML live. B) Run design-shotgun first for visual exploration. C) Run plan-ceo-review first to think through product strategy."

After detecting the context, output a brief summary:
- **Mode:** approved-mockup | plan-driven | freeform
- **Visual reference:** path to approved reference, or "none"
- **Design tokens:** "DESIGN.md" or "none"

## Step 1: Design Analysis

1. If an approved mockup exists, analyze it: describe colors, typography, layout structure, component inventory.
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

### Text That Reflows Correctly

The guarantee of this skill is that text reflows and containers size themselves — expressed with standard CSS, not a library:

```css
/* Long words and URLs wrap instead of overflowing */
p, a, li, td, figcaption {
  overflow-wrap: break-word;   /* fallback: overflow-wrap: anywhere */
  word-break: break-word;      /* legacy fallback */
}

/* Hyphenate only when a lang attribute is present */
html[lang] { hyphens: auto; }

/* Headings balance; body text avoids orphans where supported */
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }

/* Flex/grid children must be allowed to shrink below their content width */
.grid > *, .flex > * { min-width: 0; }

/* Truncate only where ellipsis is intentional, never as overflow hiding */
.truncate { text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
.clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
```

When text depends on measurement (e.g., wrapping around a floated figure or a computed height), use the browser's own layout engine — never hardcode heights:

```js
// Measure only after fonts load, then re-run on resize and edit.
await document.fonts.ready;

const relayout = () => { /* read clientWidth/scrollHeight and apply */ };
new ResizeObserver(relayout).observe(document.body);

for (const el of document.querySelectorAll('[contenteditable]')) {
  new MutationObserver(relayout).observe(el, { characterData: true, subtree: true, childList: true });
}
```

The proof is the behavior: resize the window and text must reflow without overflow or collapse; long URLs must wrap; a card must grow to fit its content.

**Never include (AI slop blacklist)** — an approved mockup that carries one, a DESIGN.md blessing, or an explicit user ask overrides it; say the tradeoff once:
- Purple/blue gradients as default
- Cream-and-serif default palette
- Gradient text
- Generic 3-column feature grids
- Identical card grids, nested cards
- Center-everything layouts with no visual hierarchy
- Kickers or icon tiles above headings
- Hero metric rows ("10k+ users")
- Decorative blobs, waves, or geometric patterns not in the mockup
- Glowing edges or pulsing status dots
- Stock photo placeholder divs
- "Get Started" / "Learn More" generic CTAs not from the mockup
- Rounded-corner cards with drop shadows as the default component
- Emoji as visual elements
- Generic testimonial sections
- Cookie-cutter hero sections with left-text right-image

## Step 4: Preview + Refinement Loop

Before presenting, self-review once against the blacklist above. If a blacklisted pattern appears that the mockup, DESIGN.md, or the user did not ask for, fix it once. One pass, not a loop.

If native screenshot or viewport tools are available, verify at 3 viewports (375px, 768px, 1440px). Check for:
- Text overflow (text cut off or extending beyond containers)
- Layout collapse (elements overlapping or missing)
- Responsive breakage (content not adapting to viewport)

Otherwise, tell the user to open the file and resize the window to confirm text reflows. Note any issues and fix before presenting.

```
LOOP:
  1. Show the user the generated HTML (or tell them how to open it)
  2. If an approved mockup exists, reference it for visual comparison
  3. Ask: "The HTML is ready. Try resizing the window — text should reflow. What needs to change? Say 'done' when satisfied."
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
- **Text must reflow correctly.** Never hardcode a height or width that text can overflow. Let the browser's layout engine compute it, and wrap with `overflow-wrap`, `word-break`, and `text-wrap`.
- **Surgical edits in the refinement loop.** Make targeted changes, not full regenerations.
- **Real content only.** Extract text from the mockup or use content from the plan. Never "Lorem ipsum."
- **One page per invocation.** For multi-page designs, run once per page.
- **No AI slop.** Your output should demonstrate taste.
