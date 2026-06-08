---
name: ios-fix
description: |
  Diagnose and fix iOS bugs with a tight reproduce, patch, and verify loop.
triggers:
  - ios fix
  - fix ios bug
  - debug iOS app
---

# iOS Fix

Use this skill for iOS runtime, build, UI, or platform integration bugs.

## Workflow

1. Reproduce or precisely define the failure.
2. Identify the affected layer: SwiftUI/UIKit, state, networking, persistence, build settings, entitlements, or device capability.
3. Inspect the smallest relevant code path before editing.
4. Make a focused fix.
5. Verify with the available build, test, simulator, or manual reproduction path.

## Useful Commands

```bash
xcodebuild -list
xcodebuild test -scheme <Scheme> -destination 'platform=iOS Simulator,name=iPhone 15'
```

Adapt commands to the project. If verification is not available, explain exactly what remains untested.
