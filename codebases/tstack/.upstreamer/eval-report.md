# TStack Eval Result: PASS WITH WARNINGS

## Summary

- The conversion is high-fidelity: every high-risk skill keeps its phases, scorecards, evidence labels, output templates, and safety/refusal rules. The only reductions are contract-backed removals of browser/device-daemon/helper-binary infrastructure. Two warnings (canary console-error detection, cso assurance labels) were addressed as follow-up edits.

## Findings

1. WARNING (resolved) `canary` — client-side console-error detection was initially HTTP-only. Fixed: added a tiered-evidence rule so a native browsing/fetch tool captures console errors and visible-content changes, and a report must state "console-error coverage unavailable" when only `curl` is available. A deploy that 200s but throws in the browser can no longer be reported HEALTHY without that caveat.

2. WARNING (resolved) `cso` — runtime-assurance label taxonomy was initially collapsed. Fixed: added an "Assurance labels" rule in Phase 12 requiring that self-run reproductions stay `self_reported` and that `runtime_tested`/`tested` are never claimed without an independent witness. The evidence-before-assurance core (severity/confidence/evidence as separate judgments, supported vs labeled hypotheses, no blanket exclusions, independent challenge, OWASP 2025 + ASVS 5.0.0, LLM/agentic + skill-supply-chain phases, scanner-evidence contract) is preserved.

## Sampled Skills

- `devex-review`: PASS — TTHW, TESTED/PARTIAL/INFERRED, 0-10 scoring, scorecard, plan-vs-reality, findings format.
- `qa`: PASS — test/fix/verify loop, tiers, regression tests, WTF-likelihood, health delta report.
- `qa-only`: PASS — report-only boundary, phases, severity rubric, structured report.
- `spec`: PASS — 5 phase gates, code-evidence-first, quality standards, acceptance/testing/rollback/out-of-scope.
- `scrape`: PASS — read-only, refuse-mutating, JSON-on-stdout, no-partial-results.
- `hackernews-frontpage`: PASS — structured rank/title/url/points/comments JSON (not a summary skill).
- `codex` / `claude-code`: PASS — modes, filesystem boundary, read-only, PASS/FAIL gate, verbatim + synthesis.
- `cso`: WARNING (resolved) — evidence-before-assurance intact; assurance-label guard re-added.
- `review`: PASS — simplification lens, reuse ladder, adversarial pass, scope drift, plan completion, fix-first.
- `ios-qa`: PASS — rewritten around xcodebuild/XCTest/simctl/devicectl; scope capture, evidence, repro, regression thinking, health report preserved.
- `ios-design-review` / `ios-fix`: PASS — Apple HIG 10-dimension rubric and reproduce→root-cause→fix→verify→regression loop preserved.
- `design-consultation` / `design-html` / `design-shotgun`: PASS — context gathering, three-looks calibration, font procedure, AI-slop list, DESIGN.md handoff preserved.
- `document-generate`: PASS — research-first, Diataxis quadrants, accuracy/completeness/voice gates, cross-linking.
- `canary`: WARNING (resolved) — baseline/cadence/transient-tolerance/rollback preserved; console-error detection re-added.

## Recommendation

- Accept the conversion. Both warnings were addressed with focused follow-up edits; mechanical verification passes and no rich workflow was collapsed.
