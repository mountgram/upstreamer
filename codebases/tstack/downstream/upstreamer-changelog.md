# Upstreamer Changelog

## Latest Sync

- **New skill: `claude-code`.** A second-opinion wrapper for the Claude Code CLI, mirroring the existing `codex` skill: review (pass/fail gate), challenge (adversarial), and consult (read-only) modes with verbatim output and synthesis.
- **`cso` rewritten to the evidence-before-assurance model.** Findings carry severity, confidence, and evidence as three separate judgments; supported findings are kept apart from labeled hypotheses; there are no blanket exclusions (dev dependencies, availability attacks, historical secrets, prompt injection, first-party skills). Adds an LLM/agentic/MCP security phase, a skill supply-chain phase, the OWASP Top 10 2025 and ASVS 5.0.0 mappings, an independent-challenge step, and a scanner-evidence contract (Gitleaks, OSV, Semgrep, zizmor, Trivy, Schemathesis).
- **`review`** gained a simplification lens (the five-tag vocabulary: delete / stdlib / native / speculative / shrink), a reuse ladder, and an always-on adversarial pass, with an outside-opinion handoff to `codex`/`claude-code`.
- **`ios-qa`** rewritten around standard tools (xcodebuild test, XCTest/XCUITest, devicectl, Simulator) instead of a private device daemon, keeping scope capture, evidence, reproduction steps, regression thinking, and the before/after health report.
- **`design-consultation`** expanded its built-in design knowledge: three-looks calibration, aesthetic/decoration/layout/color/motion directions, a font-selection procedure with overused and banned faces, and a full AI-slop anti-pattern list.
- **`design-html`** added the reuse ladder before writing layout or utility code.
- Most upstream churn this cycle was host tooling, helper programs, test/CI, and cross-machine memory sync, all of which stay out of TStack's markdown-only shape.
