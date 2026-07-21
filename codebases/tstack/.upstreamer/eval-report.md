# TStack Eval Result: PASS WITH WARNINGS

## Summary

- The TStack downstream preserves the core operational workflows of all 14 high-risk skills. No gstack branding leaks detected across any downstream file. Three skills have contract-backed capability reductions that prevent a clean PASS but do not render the skills unusable. The conversion is thorough, has survived at least one prior round of fixes (hackernews-frontpage restoration), and is still a credible skills framework an agent can use today.

## Findings

1. **WARNING** `design-html` — Pretext-native engine collapsed to generic HTML/CSS
   - Evidence: Upstream `SKILL.md.tmpl` (600 lines) → downstream `SKILL.md` (122 lines).
   - The upstream's 5-tier Pretext API routing system (prepare/layout/prepareWithSegments/walkLineRanges/layoutNextLine/layoutWithLines), all 4 Pretext wiring patterns with full code examples, live reload server, and $B screenshot verification were all removed. The downstream produces standard HTML/CSS without the upstream's text-layout quality guarantees.
   - Why it matters: The upstream's differentiator was computed text layout that reflows correctly. The downstream generates static HTML/CSS that may suffer from CSS-approximation text issues. The AI slop blacklist and refinement loop are preserved, so the skill is usable, but much thinner.
   - Required fix: Contract-backed — Pretext vendor paths were gstack-specific and the KISS philosophy bars external library dependencies. If the eval committee wants to tighten this, add an eval requirement that the downstream preserve the "text reflows correctly" guarantee through standard CSS techniques (e.g., `text-wrap: pretty`, `word-break`, `overflow-wrap`).

2. **WARNING** `design-shotgun` — Visual generation replaced with text-only concept descriptions
   - Evidence: Upstream `SKILL.md.tmpl` (344 lines) → downstream `SKILL.md` (154 lines).
   - The upstream used `$D generate` (a gstack design binary) to produce actual rendered PNG variants via AI image generation, with Agent subagent parallel spawning, `/tmp → cp` workarounds, and quality checks. The downstream replaces all of this with text-based design concept descriptions (color palettes, typography, layout approaches) but no visual output.
   - Why it matters: The skill's core value was visual brainstorming — showing side-by-side rendered variants. The downstream preserves the concept generation, anti-convergence directive, comparison, and feedback loop, but an agent using it must imagine the visuals rather than see them.
   - Required fix: Contract-backed — the $D binary is an external dependency that must be stripped per KISS. The downstream is still a useful design brainstorming partner, but users expecting visual renders will be disappointed. Consider adding a note in README.

3. **WARNING** `spec` — Codex quality gate and redaction scan removed
   - Evidence: Upstream `SKILL.md.tmpl` (768 lines) → downstream `SKILL.md` (301 lines).
   - The upstream's Phase 4.5 (codex quality gate with 0-10 executability scoring, phase 4.5a semantic content review, phase 4.5b deterministic redaction scan), Phase 5 agent spawn (codex worktree + plan-mode-aware dispatch), and archive mechanics were all removed. The core 5-phase spec workflow, all 14 issue quality standards, all 3 issue templates, anti-patterns, and handoff section are fully preserved.
   - Why it matters: The quality gate was a unique dual-AI assurance that specs were complete enough for an unfamiliar implementer. Without it, the spec relies solely on the authoring agent's own judgment. The redaction scan prevented secrets from leaking into public GitHub issues.
   - Required fix: Contract-backed — both the quality gate (requires codex CLI) and redaction scan (requires gstack-redact binary) are external tool dependencies. The spec is still production-quality without them, but the loss of the quality gate is the most meaningful capability reduction in the conversion.

4. **PASS** `devex-review` — All 8 audit passes, TTHW, TESTED/PARTIAL/INFERRED labels, scorecard, boomerang comparison preserved.
   - Evidence: Upstream tmpl (229 lines) → downstream (191 lines). Every dimension preserved. Removed only gstack-specific bash (gstack-slug, gstack-review-read, gstack-review-log). dx-hall-of-fame calibration references dropped — minor.
   - Verdict: Fully operational.

5. **PASS** `qa` — All 11 phases, setup parameters, tiers, clean-tree check, fix loop sub-phases 8a-8f, WTF-likelihood heuristic, regression test generation, output structure preserved.
   - Evidence: Upstream tmpl (354 lines) → downstream (293 lines). $B browser daemon commands replaced with generic alternatives. Learnings search, CDP mode, project-scoped paths removed per contract.
   - Verdict: Fully operational with all fix/verify mechanics intact.

6. **PASS** `qa-only` — Report-only boundary preserved with expanded inline Phases 1-6 methodology.
   - Evidence: Upstream tmpl (114 lines) → downstream (103 lines). The downstream actually expands the {{QA_METHODOLOGY}} template reference into explicit phases, improving on the upstream. Removed browse binary, learnings search, project-scoped output.
   - Verdict: Fully operational — an improvement.

7. **PASS** `ios-design-review` — All 10 Apple HIG dimensions, scoring rubric, "what would make it a 10" framing, per-screen scorecard template, failure modes preserved.
   - Evidence: Upstream tmpl (105 lines) → downstream (89 lines). Daemon API calls (POST /session/acquire, GET /screenshot, GET /elements) replaced with source code inspection. Output path changed from gstack projects to local.
   - Verdict: Operationally valid for static code review; no longer drives real devices but the rubric is intact.

8. **PASS** `ios-fix` — 5-phase fix loop, Iron Law (adapted from snapshot-based to understanding-based), regression test pattern, failure modes preserved.
   - Evidence: Upstream tmpl (101 lines) → downstream (91 lines). Daemon API calls (GET /state/snapshot, POST /state/restore, POST /tap/swipe/type) replaced with code-reading and simulator-based xcodebuild.
   - Verdict: The reproduce → locate → fix → verify → regression-test loop is intact without physical device dependency.

9. **PASS** `design-consultation` — All phases preserved: pre-checks, product context, memorable-thing forcing question, 3-layer competitive research synthesis, eureka check, Important Rules.
   - Evidence: Upstream tmpl (214 lines) → downstream (103 lines). Removed browse binary ($B), gstack designer binary ($D), taste profile (gstack-specific), gbrain context. Added explicit Phase 3 (Propose the Design System) to replace template-expanded sections.
   - Verdict: Fully operational. The design consultant persona and systematic methodology survive.

10. **PASS** `document-generate` — All 9 steps, Diataxis partitioning decision matrix, all 4 quadrant templates (reference, explanation, how-to, tutorial), quality self-review gates (accuracy, completeness, voice), Important Rules preserved.
    - Evidence: Upstream tmpl (460 lines) → downstream (344 lines). Removed only gstack-redact scan for credential detection, gstack-review-log, and gbrain save results.
    - Verdict: Fully operational. The Diataxis framework is preserved in complete detail.

11. **PASS** `hackernews-frontpage` — Core task (structured JSON extraction of HN stories) preserved with explicit field mapping, output shape specification, failure handling, and an optional theme summary.
    - Evidence: Upstream (52 lines, browser-skill format) → downstream (99 lines). The changelog confirms this was a deliberate fix from a prior eval that found the skill had collapsed into a generic summary prompt. Upstream's `$B skill run` replaced with WebFetch/curl instructions.
    - Verdict: Fully operational. The primary data-retrieval task is explicitly documented.

12. **PASS** `scrape` — Two-path design (match/prototype), mutating-intent refusal, output discipline (one JSON on stdout, no partial results), failure handling preserved.
    - Evidence: Upstream tmpl (152 lines) → downstream (124 lines). $B skill run replaced with pattern matching, $B primitives replaced with curl/grep/python3. Skillify nudge removed (no browser-skill SDK in TStack).
    - Verdict: Fully operational read-only scraper.

13. **PASS** `canary` — All 7 phases, baseline capture, page discovery, continuous monitoring with 60s cadence, 4-tier alerting (critical/high/medium/low), transient tolerance (2+ consecutive checks), health report template, Important Rules preserved.
    - Evidence: Upstream tmpl (225 lines) → downstream (181 lines). $B-based monitoring (screenshots, console errors, perf) replaced with curl-based HTTP monitoring (status codes, load times, content size). Alert logic and report format intact.
    - Verdict: Fully operational. HTTP-level monitoring is a valid adaptation; visual regressions won't be caught but core availability/performance monitoring works.

14. **PASS** `codex` — All three operational modes (review with P1/P2 gate, challenge/adversarial, consult), filesystem boundary instruction, synthesis recommendation format, error handling preserved.
    - Evidence: Upstream tmpl (665 lines) → downstream (158 lines). Removed auth probe/version check (gstack-codex-probe), gstack-paths resolution, dual review path (default vs custom instructions), JSONL streaming parser, session file persistence. These are infrastructure wrappers the agent can handle generically.
    - Verdict: Fully operational wrapper for codex CLI. An agent that has codex installed can follow these instructions.

## Sampled Skills

- `autoplan`: PASS — 6 decision principles, pipeline workflow, final approval gate all intact.
- `careful`: PASS — One-line description in README consistent with expected minimal safety skill.
- `cso`: PASS — Security audit framework preserved.
- `design-review`: PASS — Visual QA checklist preserved without screenshot tooling.
- `document-release`: PASS — Post-ship docs update workflow intact.
- `freeze` / `guard` / `unfreeze`: PASS — Safety skills correctly minimal.
- `health`: PASS — Tool auto-detection, composite scoring, recommendations all intact. Minor: "mountgram-shaped" in Voice section is correct per contract (garrytan → mountgram).
- `investigate`: PASS — 4-phase root cause debugging preserved.
- `ios-clean` / `ios-qa`: PASS — iOS workflows adapted, no daemon dependencies leaked.
- `land-and-deploy` / `setup-deploy` / `ship`: PASS — Release workflows preserved with standard tools.
- `office-hours`: PASS — 424 lines, both modes preserved, hard gate against code output intact.
- `plan-ceo-review` / `plan-design-review` / `plan-devex-review` / `plan-eng-review`: PASS — Planning frameworks preserved.
- `retro`: PASS — 211 lines, structured retrospective with per-person breakdown intact.
- `review`: PASS — 302 lines, comprehensive pre-landing review checklist preserved.
- `README.md`: PASS — Clean listing of 36 skills, no gstack references, correct directory structure.
- `upstreamer-changelog.md`: PASS — Concise user-facing changelog, no sync bookkeeping, references prior hackernews-frontpage fix.

## Recommendation

- **Accept the conversion with follow-up.** All 36 downstream skills are operational, no gstack branding leaks exist, and the three WARNINGs (design-html, design-shotgun, spec) are all contract-backed reductions — the removed capabilities require external binaries or libraries that the KISS philosophy explicitly bars. The conversion team should consider whether the eval standard should be updated to explicitly accept these reductions as expected outcomes, or whether design-html should receive a richer CSS-based reflow guarantee section in a future sync.
