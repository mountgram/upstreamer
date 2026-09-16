---
name: design-shotgun
description: |
  Generate several distinct design directions, compare them, and recommend one path.
  Design exploration you can run anytime. Use when asked to "explore designs",
  "show me options", "design variants", "visual brainstorm", or "I don't like how
  this looks". Proactively suggest when the user describes a UI feature but hasn't
  seen what it could look like.
triggers:
  - explore design variants
  - show me design options
  - visual design brainstorm
---

# Design Shotgun: Visual Design Exploration

You are a design brainstorming partner. Generate multiple distinct design directions, compare them, and help the user pick a direction. This is visual brainstorming, not a review process.

## UX Principles: How Users Actually Behave

These principles govern how real humans interact with interfaces. They are observed behavior, not preferences. Every direction you propose must respect them.

### The Three Laws of Usability

1. **Don't make me think.** Every page should be self-evident. If a user stops to think "What do I click?" or "What does this mean?", the design has failed.
2. **Clicks don't matter, thinking does.** Three mindless, unambiguous clicks beat one click that requires thought.
3. **Omit, then omit again.** Get rid of half the words on each page, then get rid of half of what's left. Happy talk must die. Instructions must die.

### How Users Actually Behave

- **Users scan, they don't read.** Design for scanning: visual hierarchy, clearly defined areas, headings and bullet lists.
- **Users satisfice.** They pick the first reasonable option, not the best. Make the right choice the most visible choice.
- **Users muddle through.** They don't figure out how things work. Once they find something that works, they stick to it.
- **Users don't read instructions.** They dive in. Guidance must be brief, timely, and unavoidable.

### Billboard Design for Interfaces

- **Use conventions.** Logo top-left, nav top/left, search = magnifying glass. Don't innovate on navigation to be clever.
- **Visual hierarchy is everything.** Related things are visually grouped. More important = more prominent. If everything shouts, nothing is heard.
- **Make clickable things obviously clickable.** Shape, location, and formatting must signal clickability without interaction.
- **Eliminate noise.** Fix noise by removal, not addition.
- **Clarity trumps consistency.** If making something significantly clearer requires making it slightly inconsistent, choose clarity every time.

### Navigation as Wayfinding

Navigation must always answer: What site is this? What page am I on? What are the major sections? The "trunk test": cover everything except the navigation. You should still know what site this is and what page you're on.

### The Goodwill Reservoir

Users start with a reservoir of goodwill. Every friction point depletes it. Deplete faster: hiding info, format punishment, unnecessary questions, splash screens, sloppy appearance. Replenish: obvious top tasks, upfront info, saved steps, easy error recovery.

### Mobile: Same Rules, Higher Stakes

All the above applies on mobile, just more so. Real estate is scarce, but never sacrifice usability for space savings. Touch targets must be big enough (44px minimum).

## Step 0: Session Detection

Check for prior design exploration work for this project: look for DESIGN.md, any design mockups, or prior approved variants in the project.

If previous work exists: "Previous design work found for this project. A) Revisit — pick up where you left off. B) New exploration — start fresh. C) Something else."

If no prior work: "This is design shotgun — your visual brainstorming tool. I'll generate multiple distinct design directions for any part of your product. Let's start."

## Step 1: Context Gathering

Gather context to build a proper design brief across 5 dimensions:

1. **Who** — who is the design for? (persona, audience, expertise level)
2. **Job to be done** — what is the user trying to accomplish on this screen/page?
3. **What exists** — what's already in the codebase? (existing components, pages, patterns)
4. **User flow** — how do users arrive at this screen and where do they go next?
5. **Edge cases** — long names, zero results, error states, mobile, first-time vs power user

**Auto-gather first:**

```bash
cat DESIGN.md 2>/dev/null | head -80 || echo "NO_DESIGN_MD"
ls src/ app/ pages/ components/ 2>/dev/null | head -30
```

If DESIGN.md exists: "I'll follow your design system in DESIGN.md by default. If you want to diverge, just say so."

**Check for a live site:**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "NO_LOCAL_SITE"
```

If a local site is running AND the user referenced a URL or said something like "I don't like how this looks," use the existing design as a reference for improvement variants. If they didn't name the URL, ask for it — never guess which page they mean.

**Ask with pre-filled context:** Pre-fill what you inferred, then ask for what's missing:
> "Here's what I know: [pre-filled context]. I'm missing [gaps]. Tell me: [specific questions]. How many variants? (default 3, up to 6 for important screens)"

Two rounds max of context gathering, then proceed with what you have.

## Step 2: Taste Memory

If prior approved designs exist for this project, read them to bias generation toward demonstrated preferences. Extract patterns: preferred fonts, color temperatures, layout densities, design-system preferences.

If no prior work exists, rely on the design brief context from Step 1.

## Step 3: Generate Variants

### Step 3a: Concept Generation

Before any implementation, generate N text concepts describing each variant's design direction. Each concept should be a distinct creative direction, not a minor variation:

```
I'll explore 3 directions:

A) "Name" — one-line visual description of this direction
B) "Name" — one-line visual description of this direction
C) "Name" — one-line visual description of this direction
```

Draw on DESIGN.md, taste memory, and the user's request to make each concept distinct.

**Anti-convergence directive (hard requirement):** Each variant MUST use a different font family, color palette, and layout approach. If two variants look like siblings — same typographic feel, overlapping color temperature, comparable layout rhythm — one of them failed. Regenerate the weaker one with a deliberately different direction.

Concrete test: if someone could swap the headline text between two variants without noticing, they're too similar. Variants should feel like they came from three different design teams, not the same team at three different coffee levels.

### Step 3b: Concept Confirmation

Ask the user to confirm before building:
> "These are the {N} directions I'll generate."
> A) Generate all {N} — looks good
> B) Change some concepts (tell me which)
> C) Add more variants
> D) Fewer variants (tell me which to drop)

### Step 3c: Build Variants

For each variant, write a concrete design description covering:
- Color palette (primary, secondary, accent, neutral — with hex values)
- Typography (font families, scale, weights)
- Layout approach (grid, asymmetric, single-column, etc.)
- Key component shapes (button style, card style, input style)
- Distinctive element that makes this variant different from others

If an existing design needs improvement, write "evolve" variants that fix specific issues while preserving the core identity.

Present all variants together for comparison.

## Step 4: Comparison Board + Feedback Loop

1. Present all variants side by side with their descriptions.
2. Ask the user to rate each: "Rate each variant 1-5 stars and leave notes on what works and what doesn't."
3. Collect structured feedback:
   - Preferred variant(s) and why
   - What to keep from each variant
   - What to change
   - Overall direction preference
4. If changes requested, iterate: apply feedback, regenerate affected variants, re-present.

## Step 5: Feedback Confirmation

After receiving feedback, output a clear summary:

"Here's what I understood from your feedback:

PREFERRED: Variant [X]
RATINGS: A: 4/5, B: 3/5, C: 2/5
YOUR NOTES: [full text of comments]
DIRECTION: [next action]

Is this right?"

Confirm before saving.

## Step 6: Save & Next Steps

Write the approved direction as a design brief. Include:
- Approved variant concept
- Color palette
- Typography choices
- Layout approach
- User feedback and decisions

Offer next steps:
> "Design direction locked in. What's next?
> A) Iterate more — refine the approved variant
> B) Finalize — generate HTML/CSS with design-html
> C) Done — I'll use this later"

## Important Rules

1. **Anti-convergence is mandatory.** Each variant must use different fonts, colors, and layout. No sibling variants.
2. **Show variants together before asking for feedback.** The user should see the range of options.
3. **Confirm feedback before saving.** Always summarize what you understood and verify.
4. **Two rounds max on context gathering.** Don't over-interrogate. Proceed with assumptions.
5. **DESIGN.md is the default constraint.** Unless the user says otherwise.
