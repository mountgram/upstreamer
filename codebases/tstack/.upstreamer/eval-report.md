# TStack Eval Result: PASS WITH WARNINGS

## Summary

- The downstream is operational and instruction-faithful. All 14 high-risk skills that prior conversions over-compressed preserve their required operational elements (devex-review's TTHW + TESTED/PARTIAL/INFERRED + 0-10 scorecard; qa's full test→fix→verify loop with regression tests and WTF self-regulation; qa-only's report-only boundary; scrape's read-only + single-JSON/no-partial-result discipline; spec's phase gates + code evidence + acceptance criteria + testing plan + rollback + out-of-scope; canary's baseline + monitoring cadence + alert tiers + transient tolerance + rollback; codex's three modes + fail-closed gate; hackernews-frontpage's structured top-story JSON; document-generate's Diataxis structure + accuracy/completeness gates). No gstack infrastructure references remain (the only `codex exec`/`devicectl`/`xcodebuild` hits are standard third-party/Apple CLIs, which the contract explicitly permits). No rich workflow was collapsed into a generic checklist, and no core task was changed. Four minor findings (a freeze/unfreeze state-file path mismatch, text-only design-shotgun variants, a slight README mischaracterization of hackernews-frontpage, and ios-qa's retained device-bridge description) are worth follow-up but do not block.

## Findings

1. [WARNING] [freeze/guard/unfreeze] Freeze boundary state-file path is inconsistent, so freeze and unfreeze do not interoperate when TMPDIR is set.
Evidence: `freeze/SKILL.md:36` writes `echo "$FREEZE_DIR" > "${TMPDIR:-/tmp}/freeze-dir.txt"`, while `guard/SKILL.md:29-30` writes and `unfreeze/SKILL.md:22-24` read `/tmp/tstack/freeze-dir.txt`.
Why it matters: A boundary set by `/freeze` will not be found (and therefore not cleared) by `/unfreeze` unless TMPDIR happens to be `/tmp`. The safety-scoping skills lose their handoff, which is the entire point of the freeze→unfreeze pair.
Required fix: Use one canonical path in all three skills (e.g. `${TMPDIR:-/tmp}/tstack/freeze-dir.txt`), or have freeze and unfreeze resolve the same file unconditionally.

2. [WARNING] [design-shotgun] Variants are text descriptions instead of rendered visual mockups.
Evidence: upstream `design-shotgun/SKILL.md.tmpl:237-299` generates per-variant PNGs via the `$D` design binary and opens a comparison board; downstream `design-shotgun/SKILL.md:133-142` produces "a concrete design description" per variant and defers rendering to design-html.
Why it matters: The workflow (concept → confirm → compare → feedback → confirm → save) and the anti-convergence directive are preserved, but "visual brainstorming" is reduced to prose concepts; the actual visual comparison is deferred to a separate skill. This is a contract-backed removal of the custom binary, but the loss of a visual preview loop is worth noting.
Required fix: Optional — have Step 3c offer a lightweight static HTML/CSS variant (plain markup, no dependencies) as an alternative to the text description, or state explicitly that design-html is the required next step for any visual comparison.

3. [WARNING] [README] The README mischaracterizes hackernews-frontpage.
Evidence: `README.md:26` describes it as "Summarize Hacker News front-page patterns from accessible page content," but `hackernews-frontpage/SKILL.md:17-18` makes structured JSON story extraction the primary output and the theme summary optional ("The primary output is machine-readable data; the summary is secondary").
Why it matters: A user scanning the README will invoke the skill expecting a summary, not a JSON dataset. The skill itself is correct and operational; the one-line README description understates its core task.
Required fix: Update the README line to "Extract the top Hacker News stories as structured JSON, with optional theme summary."

4. [WARNING] [ios-qa] Retains the device-bridge/StateServer architecture description that cannot be replicated with standard tools.
Evidence: downstream `ios-qa/SKILL.md:15-97` still describes DebugBridge SPM targets, an embedded StateServer, and a "Mac-side daemon" with token rotation; upstream depends on the `gstack-ios-qa-daemon` broker (per upstream `AGENTS.md`).
Why it matters: The core task (drive a real iPhone via an in-app bridge) is inherently custom infrastructure. No `gstack-*` binary is named, and the changelog correctly drops the codegen-dependent `ios-sync`, so this is a defensible judgment call rather than a leftover gstack reference. But the workflow cannot actually run without that bridge, which the downstream does not ship.
Required fix: Either (a) add a one-line note that the DebugBridge/daemon must be provided by the app-under-test toolchain, or (b) reframe the skill as a bridge-protocol specification rather than an executable runbook.

## Sampled Skills

- `devex-review`: PASS - TTHW, TESTED/PARTIAL/INFERRED, 0-10 scoring, scorecard, 8 dimensions, plan-vs-reality, findings format, and next steps all preserved.
- `qa`: PASS - full test/fix/verify loop, 10 phases, tiers, issue taxonomy, weighted health rubric, regression-test generation, test bootstrap, WTF self-regulation, safety/consent rules preserved.
- `qa-only`: PASS - report-only boundary ("never fix"), methodology phases, health rubric, evidence/repro rules, and output template preserved.
- `ios-design-review`: PASS - 10-dimension HIG rubric, 0-10 scoring, "what would make it a 10", review loop, and failure modes preserved; device screenshots adapted to static code review.
- `ios-fix`: PASS - Iron Law, reproduce→root-cause→fix→verify→regression-test loop, minimal-diff and commit discipline, and failure modes preserved; device snapshot fixture adapted to source-level pre-bug capture.
- `design-consultation`: PASS - 6 phases, memorable-thing question, three-layer synthesis + eureka check, SAFE/RISK breakdown, anti-slop list, font verification, preview spec, and full DESIGN.md template preserved.
- `design-html`: PASS - UX doctrine, input detection, reflow guarantee (standard CSS + ResizeObserver), AI-slop blacklist, refinement loop, and token-extraction handoff preserved; Pretext library correctly replaced with standard CSS.
- `design-shotgun`: WARNING - concept/confirm/compare/feedback/save loop and anti-convergence preserved, but variants are text descriptions rather than rendered mockups.
- `document-generate`: PASS - research-first archaeology, Diataxis partitioning matrix, four quadrant templates, cross-linking, and accuracy/completeness/voice gates preserved.
- `hackernews-frontpage`: PASS - structured top-30 JSON extraction, tr.athing parsing, failure handling, and no-partial-result rule preserved from the browser-skill source.
- `scrape`: PASS - read-only boundary, refuse-mutating rule, match/prototype paths, single-JSON stdout discipline, and no-partial-result rule preserved.
- `spec`: PASS - phase gates, code-evidence-before-questions, dedupe, 4.5a/4.5b secret+PII scans, codex quality gate, full issue templates (standard/epic/audit), rollback, and out-of-scope preserved.
- `canary`: PASS - baseline, page discovery, 60s monitoring cadence, alert tiers, transient tolerance (2+ checks), alert/report templates, and rollback guidance preserved.
- `codex`: PASS - three modes (review/challenge/consult), mutual exclusivity, fail-closed gate, filesystem boundary, verbatim output, and error handling preserved.
- `design-review`: PASS - 10-category checklist, P0-P3 severity, A-F dual scoring, 6-phase workflow, and goodwill meter preserved; screenshot workflow correctly removed.
- `health`: PASS - tool auto-detection, weighted 0-10 rubric, composite scoring, trend analysis, and read-only recommendation output preserved.
- `review`: PASS - critical-pass categories, confidence calibration, specialist dispatch, fix-first loop, and adversarial second-model pass preserved.
- `careful` / `freeze` / `guard` / `unfreeze`: PASS (with WARNING for the freeze/unfreeze path mismatch in Finding 1) - destructive-pattern table, hard-deny tier, safe exceptions, and edit-boundary enforcement preserved as inline advisory prose.
- `ios-clean`: PASS - Inventory/Remove/Verify phases, confirmation gates, and release-build verification preserved.

## Recommendation

- Accept with follow-up. The conversion is high quality and the state update should proceed. Address the four warnings, at minimum Finding 1 (freeze/unfreeze path mismatch, a small real bug) and Finding 3 (README accuracy), before or in the next sync. None of the findings is a FAIL condition: no rich workflow was collapsed, no gstack infra reference was retained, and no core task was changed.

## Post-eval fixes applied

- Finding 1 (freeze/unfreeze path mismatch): canonicalized the boundary state file to `${TMPDIR:-/tmp}/tstack/freeze-dir.txt` across `freeze`, `guard`, and `unfreeze`, so the pair interoperates regardless of `TMPDIR`.
- Finding 3 (README accuracy): updated the `hackernews-frontpage` README line to "Extract the top Hacker News stories as structured JSON, with optional theme summary."
- Finding 4 (ios-qa): added a note that the DebugBridge package and Mac-side daemon are a protocol provided by the app-under-test toolchain, not shipped by TStack.
- Finding 2 (design-shotgun text-only variants) remains an accepted contract-backed reduction: the `$D` render binary is barred by KISS, and design-html is named as the required next step for visual comparison.

Mechanical verification re-ran clean after the fixes.
