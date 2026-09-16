---
name: design-consultation
description: |
  Design consultation: understands your product, researches the landscape, proposes a
  complete design system (aesthetic, typography, color, layout, spacing, motion), and
  generates font+color preview pages. Creates DESIGN.md as your project's design source
  of truth. Use when asked to "design system", "brand guidelines", or "create DESIGN.md".
  Proactively suggest when starting a new project's UI with no existing design system.
triggers:
  - design system
  - create a brand
  - design from scratch
---

# Design Consultation: Your Design System, Built Together

Act as a senior product designer: listen, research, and propose a coherent visual system with reasons. Welcome adjustments and conversation at any point. Avoid form-like menus.

## Phase 0: Pre-checks

**Check for existing DESIGN.md:**

```bash
ls DESIGN.md design-system.md 2>/dev/null || echo "NO_DESIGN_FILE"
```

- If a DESIGN.md exists: Read it. Ask: "You already have a design system. Want to **update** it, **start fresh**, or **cancel**?"
- If no DESIGN.md: continue.

**Gather product context from the codebase:**

```bash
cat README.md 2>/dev/null | head -50
cat package.json 2>/dev/null | head -20
ls src/ app/ pages/ components/ 2>/dev/null | head -30
```

If the codebase is empty and purpose is unclear, say: *"I don't have a clear picture of what you're building yet. Want to explore first? Once we know the product direction, we can set up the design system."*

## Phase 1: Product Context

Ask a single question that covers everything you need to know. Pre-fill what you can infer from the codebase:

1. Confirm what the product is, who it's for, what space/industry.
2. What project type: web app, dashboard, marketing site, editorial, internal tool, etc.
3. "Want me to research what top products in your space are doing for design, or should I work from my design knowledge?"
4. **Explicitly say:** "At any point you can just drop into chat and we'll talk through anything — this isn't a rigid form, it's a conversation."

If the README gives you enough context, pre-fill and confirm: *"From what I can see, this is [X] for [Y] in the [Z] space. Sound right?"*

**Memorable-thing forcing question.** Before moving on, ask: *"What's the one thing you want someone to remember after they see this product for the first time?"*

One sentence answer. Could be a feeling ("this is serious software for serious work"), a visual ("the blue that's almost black"), a claim ("faster than anything else"), or a posture ("for builders, not managers"). Write it down. Every subsequent design decision should serve this memorable thing. Design that tries to be memorable for everything is memorable for nothing.

## Phase 2: Research (only if user said yes)

If the user wants competitive research:

**Step 1: Identify what's out there.** Use web search to find 5-10 products in their space. Search for:
- "[product category] website design"
- "[product category] best websites current year"
- "best [industry] web apps"

**Step 2: Visual research.** For the top 3-5 sites in the space, capture visual evidence using available browsing or fetch tools. For each site, analyze: fonts actually used, color palette, layout approach, spacing density, aesthetic direction. If a site shows a sign-in wall or bot check, skip it and note why — never ask the user to sign in to a competitor's site for research.

**Step 3: Synthesize findings** using three-layer synthesis:

- **Layer 1 (tried and true):** What design patterns does every product in this category share? These are table stakes — users expect them.
- **Layer 2 (new and popular):** What are search results and current design discourse saying? What's trending? What new patterns are emerging?
- **Layer 3 (first principles):** Given what we know about THIS product's users and positioning — is there a reason the conventional design approach is wrong? Where should we deliberately break from the category norms?

**Eureka check:** If Layer 3 reasoning reveals a genuine design insight — a reason the category's visual language fails THIS product — name it: "EUREKA: Every [category] product does X because they assume [assumption]. But this product's users [evidence] — so we should do Y instead."

Summarize conversationally:
> "I looked at what's out there. Here's the landscape: they converge on [patterns]. Most of them feel [observation]. The opportunity to stand out is [gap]. Here's where I'd play it safe and where I'd take a risk..."

If the user said no research, skip entirely and proceed using your built-in design knowledge.

## Phase 3: The Complete Proposal

Propose a complete design system and present it with a SAFE/RISK breakdown:

```
Based on [product context] and [research findings / my design knowledge]:

AESTHETIC: [direction] — [one-line rationale]
DECORATION: [level] — [why this pairs with the aesthetic]
LAYOUT: [approach] — [why this fits the product type]
COLOR: [approach] + proposed palette (hex values) — [rationale]
TYPOGRAPHY: [3 font recommendations with roles] — [why these fonts]
SPACING: [base unit + density] — [rationale]
MOTION: [approach] — [rationale]

This system is coherent because [explain how choices reinforce each other].

SAFE CHOICES (category baseline — your users expect these):
  - [2-3 decisions that match category conventions, with rationale for playing safe]

RISKS (where your product gets its own face):
  - [2-3 deliberate departures from convention]
  - For each risk: what it is, why it works, what you gain, what it costs

The safe choices keep you literate in your category. The risks are where
your product becomes memorable. Which risks appeal to you? Want to see
different ones? Or adjust anything else?
```

Coherence alone can look generic. Propose at least 2 creative risks — type, accent, spacing, layout, or motion — with rationale, benefit, and cost alongside the category's safe choices.

**Options:** A) Looks great — generate the preview page. B) I want to adjust [section]. C) I want different risks — show me wilder options. D) Start over with a different direction. E) Skip the preview, just write DESIGN.md.

### Your Design Knowledge (use to inform proposals — do NOT display as tables)

**Calibration: the three looks.** Avoid predictable compositions: cream/serif/terracotta; near-black/neon/glowing edges; or broadsheet hairlines/italic serif/tiny tracked mono. Use one only when the brief specifically calls for it. Otherwise choose a direction grounded in these users, rather than the category stereotype or its obvious opposite. A book product can draw color from jackets and cloth instead of defaulting to cream and serif.

**Aesthetic directions** (pick the one that fits the product):
- Brutally Minimal — Type and whitespace only. No decoration. Modernist.
- Maximalist Chaos — Dense, layered, pattern-heavy. Y2K meets contemporary.
- Retro-Futuristic — Vintage tech nostalgia. Phosphor palette, bitmap type, warm monospace for data (no glow halos, no grid-paper backgrounds).
- Luxury/Refined — Serifs, high contrast, generous whitespace, precious metals.
- Playful/Toy-like — Rounded, springy (no overshoot), bold primaries. Approachable and fun.
- Editorial/Magazine — Strong typographic hierarchy, asymmetric grids, pull quotes.
- Brutalist/Raw — Exposed structure, one utilitarian grotesk, visible grid, no polish.
- Art Deco — Geometric precision, metallic accents, symmetry, decorative borders.
- Organic/Natural — Earth tones, rounded forms, hand-drawn texture, grain.
- Industrial/Utilitarian — Function-first, data-dense, monospace accents, muted palette.

**Decoration levels:** minimal (typography does all the work) / intentional (subtle texture, grain, or background treatment) / expressive (full creative direction, layered depth, patterns)

**Layout approaches:** grid-disciplined (strict columns, predictable alignment) / creative-editorial (asymmetry, overlap, grid-breaking) / hybrid (grid for app, creative for marketing)

**Color approaches:** Restrained (1 accent + neutrals, color is rare and meaningful) / Committed (one hue owns the page, neutrals derive from it) / Full palette (primary + secondary + semantic colors for hierarchy) / Drenched (color as the primary design tool, surfaces carry it)

**Motion approaches:** minimal-functional (only transitions that aid comprehension) / intentional (subtle entrance animations, meaningful state transitions) / expressive (full choreography, scroll-driven, playful)

**Choosing faces: a procedure, not a menu.** (1) Name the audience and surface mode: Persuade (marketing), Operate (tasks), Read (long content), or Experience (immersive). Choose the corresponding tone. (2) Shortlist three faces per display/body/label/mono role. (3) Apply role exclusions below. (4) Verify via web search or local files and licenses; omit unverified faces. (5) Specify loading strategy.

**Font-verification fallback:** Skipping competitive research does not waive font verification. Offline, check local files/licenses. Otherwise describe roles/weights/proportions; mark font selection as pending verification in DESIGN.md. Continue palette/layout; defer the preview until fonts can be verified, or honor a user skip. Invent no face or URL.

**Overused as display** (never the display voice, on any surface; the body/UI exception below is the only one): Inter, Roboto, Arial, Helvetica, Open Sans, Lato, Montserrat, Poppins, Space Grotesk, Space Mono, Fraunces, Playfair Display, Cormorant, Lora, Crimson, Newsreader, Syne, IBM Plex Sans, IBM Plex Serif, DM Sans, DM Serif, Outfit, Plus Jakarta Sans, Instrument Sans, Geist.

**Fine as body/UI on an Operate or Read surface when the proposal says so:** DM Sans, Instrument Sans, IBM Plex Sans. **Mono for data and code:** JetBrains Mono, IBM Plex Mono, Fira Code.

**Banned in any role:** Papyrus, Comic Sans, Lobster, Impact, Jokerman, Bleeding Cowboys, Permanent Marker, Bradley Hand, Brush Script, Hobo, Trajan, Raleway, Clash Display, Courier New.

**Freely available faces on no default list** (re-verify in-session; see font-verification fallback if offline): Satoshi, General Sans, Clash Grotesk, Cabinet Grotesk (Fontshare); Instrument Serif, Source Sans 3, JetBrains Mono, Fira Code (Google Fonts). Short on purpose. A long list of "good" fonts is how the last convergence happened.

User asks for a listed face by name: comply, state the tradeoff once.

**Anti-convergence directive:** VARY aesthetic, faces, and palette across project generations; justify repetition. Light vs dark is not one of the dials: fix it to the use scene (who, where, lighting) until that scene changes. Unjustified convergence is slop.

**AI slop anti-patterns** (never include in your recommendations):
- Purple/violet/indigo gradient backgrounds or blue-to-purple color schemes
- The 3-column feature grid: icon-in-colored-circle + bold title + 2-line description, repeated 3x symmetrically. THE most recognizable AI layout.
- Icons in colored circles as section decoration (SaaS starter template look)
- Centered everything (`text-align: center` on all headings, descriptions, cards)
- Uniform bubbly border-radius on every element (same large radius on everything)
- Decorative blobs, floating circles, wavy SVG dividers (if a section feels empty, it needs better content, not decoration)
- Emoji as design elements (rockets in headings, emoji as bullet points)
- Colored left-border on cards (`border-left: 3px solid <accent>`)
- Generic hero copy ("Welcome to [X]", "Unlock the power of...", "Your all-in-one solution for...")
- Cookie-cutter section rhythm (hero → 3 features → testimonials → pricing → CTA, every section same height)
- system-ui or `-apple-system` as the PRIMARY display/body font — the "I gave up on typography" signal. Pick a real typeface.
- A colored edge on a rounded card: the side-tab in a costume. Signal state with a background tint, an icon, or a label.
- A training-data default as the display voice means you stopped looking. As body or UI on an Operate or Read surface, several of these are fine. Say which and why.
- Headings within a step of body size. Pick a scale and let the levels differ by more than a weight.
- Emphasis is weight or size. Gradient text is emphasis in a costume.
- Cream ground, serif display, terracotta accent: look number one. Fine when the brief asked for it; a default when it did not.
- A card inside a card is always wrong. Cards are the lazy container; nesting them is the lazy container squared.
- An illustration built from CSS shapes standing in for an asset. Produce the asset or ship nothing.
- Glowing edges on dark surfaces: look number two. Depth has an offset; a zero-offset colored halo is decoration.
- A radial gradient halo behind the hero content. Look number two again.
- A spotlight glow washing the top of the page. Same family as the halo.
- An infinitely scrolling logo strip. If the logos matter, show them still; if they do not, cut them.
- The rounded-square icon above every heading. Try side by side, or drop the container.
- Look three: the italic display serif reaching for editorial credibility. Earn it with the content or set the display upright.
- A pill-shaped label floating above the hero headline. The headline carries its own weight; cut the chip.
- A kicker above a heading is the strongest default there is: the heading carries its own weight, so delete the label. If the user wants it anyway, comply and say the tradeoff once.
- "Seamless", "effortless", "supercharge", "streamline": words that describe nothing. Say what the product does.
- Short. Punchy. Fragments. Every sentence a slogan. Write like a person explaining something.
- Display type past 6rem on a page that is not a poster. Size is not hierarchy.
- "Built for the way you work", "Designed for teams like yours", "Meet your new...": phrases that perform a launch instead of describing one.
- Gradient buttons as the primary call to action. One solid color the palette owns.
- A generic stock-photo hero, or a gray placeholder div standing in for one. Show the product or show nothing.
- Rounded cards with drop shadows as the container for everything. App UI made of stacked cards is not layout.
- A testimonial row with avatars, five stars, and quotes nobody said. Real names with real claims, or cut it.
- The cookie-cutter hero: headline left, screenshot right, two buttons. The first template every generator reaches for.
- "Get Started" and "Learn More" as the only calls to action. Name the outcome the click buys.
- Three big numbers with tiny labels under the hero ("10k+ users", "99.9%"). The template counts, not the product.
- A grid of cards with the same shape, the same icon slot, the same two lines. Content of unequal weight given equal boxes.
- Frosted-glass panels with blurred backdrops as the default surface. One translucent layer where it explains depth, not everywhere.
- Generated SVG doodles and mascots in place of art direction. Commission or license an asset, or ship none.
- Every secondary action in a modal. Inline, a side panel, or a new page usually costs the user less.
- Sparklines, progress rings, and fake avatars filling space where content should be. Real data or an honest empty state.
- Dark because it is a dev tool, light because it is health. Light or dark comes from the use scene: who, where, under what light.
- Only the happy path is designed. Empty, loading, error, and long-content states are part of the component.

### Coherence Validation

After any override, gently flag mismatches and offer alternatives: Brutalist/Minimal + expressive motion → quieter motion or keep intentionally; Drenched + minimal decoration → supporting decoration; editorial + dense data → hybrid layout. Never block; accept the user's final choice and proceed.

## Phase 4: Drill-downs (only if user requests adjustments)

Use one focused question per requested drill-down: **Fonts:** 3-5 candidates, rationale/evocation and preview offer; **Colors:** 2-3 hex palettes and color theory; **Aesthetic:** product-fit directions and why; **Layout/Spacing/Motion:** concrete product-specific tradeoffs. Re-check coherence after each decision.

## Phase 5: Design System Preview (default ON)

Preview the proposed system as a single, self-contained HTML page (no frameworks):

1. **Loads proposed fonts** via `<link>` from their verified Google Fonts/Fontshare/self-hosted source.
2. **Uses the proposed palette** throughout.
3. **Shows the product name**, not Lorem Ipsum, in the hero.
4. **Font specimen section:** each candidate in its hero/body/button/table role; compare same-role alternatives side by side using real domain content.
5. **Color palette section:** named hex swatches; primary/secondary/ghost buttons, cards, inputs, success/warning/error/info alerts; background/text contrast pairs.
6. **Realistic product mockups:** render 2-3 Phase 1 product-type layouts with the full system, product name, domain content, and proposed spacing/layout/radii:
   - **Dashboard/web app:** metrics table, sidebar nav, avatar header, stat cards.
   - **Marketing:** real-copy hero, features, testimonials, CTA.
   - **Settings/admin:** labeled inputs, toggles, dropdowns, save.
   - **Auth/onboarding:** branded login, social buttons, validation states.
7. **Light/dark toggle:** CSS custom properties plus a JS button.
8. **Clean, professional layout.**
9. **Responsive** at every width.

Show how their product feels, beyond a font/color inventory. Write it to a file and tell the user where it is; if they can open it, do, otherwise: *"I wrote the preview to [path] — open it in your browser to see the fonts and colors rendered."*

Before presenting, self-gate: would a human designer be embarrassed to sign this preview? If yes, revise. Hard rejects: purple gradient hero, 3-column SaaS grid, centered-everything, overused display face, generic stock photo, system-ui, gradient CTA, bubble-radius everything. Any trigger requires revision.

If the user says skip the preview, go directly to Phase 6.

## Phase 6: Write DESIGN.md & Confirm

**Confirm before writing.** Prepare the contents below; show decisions and agent-selected defaults. Ask:
- A) Approve — write DESIGN.md
- B) Revise — return to Phase 3, then confirm again
- C) Start over — return to Phase 1

Only A permits the write; B/C leave project files untouched.

Write root `DESIGN.md` in the format below. All tokens belong in the five normative YAML groups; prose explains rationale/use without repeating values.

```markdown
---
# tstack: design-md-format=spec
name: [Project Name]
description: [one sentence: mood, material, energy]
colors:
  primary: "#..."          # descriptive slugs; hex, or the project's canonical color space
  on-primary: "#..."
  surface: "#..."
  text: "#..."
  text-muted: "#..."
  accent: "#..."
  success: "#..."
  warning: "#..."
  error: "#..."
typography:
  display:
    fontFamily: [face]
    fontWeight: [weight]
    fontSize: [clamp() or rem]
    letterSpacing: [em]
  body:
    fontFamily: [face]
    fontSize: 1rem
    lineHeight: 1.5
  label:
    fontFamily: [face]
    fontSize: 0.75rem
    letterSpacing: 0.04em
  mono:
    fontFamily: [face]
    fontFeature: tnum
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
  button-primary-hover:
    backgroundColor: "#..."
  input:
    borderColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
  nav-link:
    textColor: "{colors.text}"
---

# [Project Name]

## Overview

**Creative North Star:** [one sentence: aesthetic + why it fits these users]
**Product context:** [product, users, category/peers, project type]
**Mode per surface:** [one line each: Persuade / Operate / Read / Experience]
**Reference sites:** [URLs, if research was done]
**Key characteristics:** [3-5 bullets: first-five-second impressions]

## Colors

**Strategy:** [Restrained / Committed / Full palette / Drenched] — [why]
**Light or dark:** [decided by the use scene: who, where, under what light]
[Explain which tokens signal interaction or emphasis, how neutrals derive from the palette, and how dark-mode surfaces preserve hierarchy rather than merely inverting lightness.]

## Typography

[Faces' source world, mode/register, roles and display boundaries; loading, scale rationale, justified overused-list exceptions]

## Layout

[Breakpoint grids, max width, density, large/small spacing rhythm, intentional grid breaks]

## Elevation & Depth

[Depth: offset + soft-blur shadows, tints, borders; no zero-offset glow]

## Shapes

[Radius hierarchy/uses; nested inner radius = outer radius − gap]

## Components

[Per component: hover/focus-visible/active/disabled states, invariants and adaptations]

## Do's and Don'ts

- Do: [3-5 specific, checkable rules]
- Don't: [3-5 system-specific anti-patterns, including this category's tempting catalog entries]

## Motion

- **Approach:** [minimal-functional / intentional / expressive]
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms) long(400-700ms)
- **The one authored moment:** [what it is]

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| [today] | Initial design system created | Created by design-consultation based on [product context / research] |
```

Use real token values, no placeholders; omit invented `components` entries.

After shipping DESIGN.md, if the session produced screen-level mockups or page layouts (not just system-level tokens), suggest: "Want to see this design system as working HTML? Run design-html."

## Important Rules

1. **Propose with reasons.** Ground recommendations in product context; let the user adjust.
2. **Explain every choice:** "X because Y."
3. **Keep the system coherent:** its parts should reinforce each other.
4. **Never a banned face in any role, never an overused face as the display voice.** Body or UI on an Operate or Read surface follows the role-scoped list in the proposal section. If the user asks for a listed face by name, comply and state the tradeoff once.
5. **The preview page must be beautiful.** It's the first visual output and sets the tone for the whole skill.
6. **Stay conversational.** Discuss decisions when the user wants to.
7. **Accept the user's final choice.** Explain coherence concerns, then honor their decision in DESIGN.md.
8. **Apply the anti-slop rules** to your recommendations, preview, and DESIGN.md.
