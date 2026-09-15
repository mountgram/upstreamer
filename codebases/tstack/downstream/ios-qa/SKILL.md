---
name: ios-qa
description: |
  Exercise an iOS app with focused manual and automated QA using standard platform tools
  (xcodebuild test, XCTest/XCUITest, devicectl, Simulator). Reads Swift source to understand
  each screen, runs the app, finds bugs, captures evidence and reproduction steps, and reports
  a before/after health picture. Use when asked to "test the iPhone app", "QA the iOS app",
  or "find bugs on the device".
triggers:
  - ios qa
  - test the iphone app
  - test my ios app
  - find bugs on the device
  - qa the ios app
---

# iOS QA

Exercise a SwiftUI/UIKit app on a real device or the Simulator using the standard Xcode toolchain. You read Swift source to understand every screen, run the app, then drive a verify loop: reproduce, capture evidence, and report — with automated coverage from XCTest/XCUITest where it exists.

No private bridge, embedded server, or daemon. Interaction is through XCTest UI automation, `devicectl`, the Simulator, and the accessibility tree the platform already provides.

## Prerequisites

- macOS with Xcode and the Swift toolchain installed.
- A device paired via USB, or a booted Simulator.
- The app source on disk and an Xcode project/package that builds.

## Phase 1: Scope Capture

1. Identify the target: device or Simulator, the scheme, and the bundle id.
2. Read the app source to enumerate screens and flows. Note the main entry (`@main` App), navigation structure, and the state-bearing types (`@Observable` classes, view models).
3. Ask the user for the QA scope if it is not already clear: which flows to exercise, whether to test for regressions only or do a full pass, and any known-risky areas.

Record the scope as a checklist of flows before touching anything.

## Phase 2: Build and Run

Build and install the app, then launch it:

```bash
xcodebuild -scheme <SchemeName> -destination 'platform=iOS Simulator,name=iPhone 16' build
xcrun simctl install booted <path-to-app>
xcrun simctl launch booted <bundle-id>
```

For a physical device:

```bash
xcodebuild -scheme <SchemeName> -destination 'platform=iOS,id=<UDID>' build install
devicectl device process launch --device <UDID> <bundle-id>
```

Confirm the app reaches a running, interactive state before proceeding.

## Phase 3: Automated Coverage

Run the existing test suite first as a baseline:

```bash
xcodebuild test -scheme <SchemeName> -destination 'platform=iOS Simulator,name=iPhone 16'
```

If XCUITest targets exist, run them to cover the flows they exercise. Note which flows are covered by automation and which are not, so the manual pass fills the gaps. A passing suite is coverage evidence, not a health certificate.

## Phase 4: Manual Flow Exercise

For each flow in the scope checklist:

1. Drive the app to the screen — via `simctl` UI interaction where possible, or by stepping through in the Simulator/device.
2. Inspect the accessibility tree for what is on screen.
3. Exercise the happy path, then the edge cases: empty state, invalid input, rapid taps, background/foreground, rotation, and interruption.
4. Capture evidence for anything unexpected: a screenshot, the accessibility snapshot, the exact steps, and the observed vs expected behavior.
5. Record the finding with a severity (P0 crash/blocker, P1 major, P2 minor, P3 cosmetic).

Use a screenshot capture as the gold-standard evidence where the environment can produce one.

## Phase 5: Bug Triage and Reproduction

For each finding:

- Reduce it to a minimal reproduction path: "To reproduce: 1) … 2) … 3) … Expected: X, Actual: Y."
- Note whether it reproduces on device, Simulator, or both.
- Capture console/log output (`xcrun simctl spawn booted log stream` or the device console) around the failure.
- Do not "fix" during QA — this skill reports. Hand reproducible defects to `/ios-fix`.

## Phase 6: Regression Thinking

Before the final report, consider what each finding implies:

- What state led to it, and could the same state class trigger other defects?
- Did any "fix" observed earlier actually just move the symptom?
- Are there sibling flows with the same pattern that should be spot-checked?

## Health and Report

Produce a before/after health picture and a report:

```text
iOS QA REPORT — <app>
═══════════════════════════
Device/Simulator:  <target>
Scope:             <flows exercised>
Automated tests:   <N passed / M failed>
Manual flows:      <N exercised>
Findings:          <P0/P1/P2/P3 counts>

Findings (most severe first):
1. [P1] <title>
   Flow: <flow>
   Repro: 1) … 2) … 3) …
   Expected vs actual: <…>
   Evidence: <screenshot/log/accessibility snapshot path>
   Severity rationale: <…>

Health before: <state>  →  after: <state>
Recommendation: <ship / fix P0-P1 first / needs full pass>
```

Sort findings by severity and likelihood. Untested areas and blockers are listed explicitly.

## Failure Modes

| Symptom | Action |
|---|---|
| Build fails | Report the compile error; QA cannot start. |
| Device not reachable | Fall back to Simulator, or ask the user to reconnect and pair. |
| No test target | Note automation gap; rely on the manual pass. |
| Flow cannot be reached | Report it as untested rather than guessing. |

## Cleanup

No app changes are made by this skill. If a prior integration added debug wiring, `/ios-clean` removes it before a release build.
