# Upstreamer Changelog

## Latest Sync

- Re-expanded 12 skills from their upstream templates to restore full operational workflows that had been over-compressed in prior conversions:
  - **qa**: Restored the full 10-phase test-fix-verify loop with tiers, regression tests, WTF-likelihood self-regulation, and structured report format.
  - **qa-only**: Restored the report-only boundary with six QA phases, structured evidence format, and health scoring.
  - **spec**: Restored the 5-phase interrogation workflow, 14 quality standards, 3 issue templates, testing plan, rollback strategy, and anti-patterns.
  - **document-generate**: Restored the Diataxis framework with 9 steps, codebase archaeology, concept maps, all four quadrant templates with rules, quality gates, and cross-linking.
  - **canary**: Restored the 7-phase post-deploy monitor with baseline capture, page discovery, 60-second monitoring loop, alert tiers, transient tolerance, and health report.
  - **ios-design-review**: Restored the 10-dimension Apple HIG scoring rubric with 0-10 scoring and screen-by-screen review loop.
  - **ios-fix**: Restored the 5-phase fix loop with iron law, root cause investigation, atomic commits, verification, and regression test generation.
  - **design-consultation**: Restored product context gathering, memorable-thing forcing question, three-layer research synthesis, and full design system proposal workflow.
  - **design-html**: Restored input detection, refinement loop, anti-slop blacklist, framework detection, and DESIGN.md token extraction.
  - **design-shotgun**: Restored context gathering, anti-convergence directive, variant generation workflow, comparison board, and feedback loop.
  - **codex**: Restored the three-mode wrapper (review with pass/fail gate, adversarial challenge, consult) with filesystem boundary, verbatim output, and error handling.
  - **scrape**: Restored the match/prototype two-path design, read-only refusal rules, JSON output discipline, and failure handling.
- All adaptations correctly replace upstream-specific infrastructure (browse daemon, usage tracking, state paths, helper binaries) with standard agent tools and shell commands.
- Every skill remains a single `SKILL.md` with no helper binaries, generated templates, package manager files, or host-specific setup.
