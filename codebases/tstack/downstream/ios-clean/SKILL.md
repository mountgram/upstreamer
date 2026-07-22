---
name: ios-clean
description: |
  Remove temporary iOS debugging scaffolds and leave the app ready for review or release.
triggers:
  - ios clean
  - clean ios debug code
  - remove ios scaffolding
  - strip debugbridge
  - clean the ios debug bridge
---

# iOS Clean

## Purpose

Remove the DebugBridge SPM package and all `#if DEBUG` wiring from an iOS app. Cleans up StateServer, DebugOverlay, accessor codegen output, and app-side hooks installed by the iOS QA workflow.

This is a convenience flow, not a safety mechanism. The structural guard against shipping DebugBridge in Release builds is the `Package.swift` conditional (`.when(configuration: .debug)`) plus CI's `swift build -c release` check.

## What it removes

Confirm each step with the user before acting:

1. The `DebugBridge` SPM targets from `Package.swift`.
2. The `#if DEBUG` block in the app's `@main` entry that calls `DebugBridgeManager.shared.start()`.
3. Any standalone `// @Snapshotable` generator marker comments on the canonical app state class.
4. Generated `StateAccessor.swift` files anywhere under the app source.

## What it does NOT touch

- App business logic, view models, view code.
- Anything outside `#if DEBUG` blocks.
- Other test or QA infrastructure.

## Phase 1: Inventory

1. Glob for `import DebugBridge` across the app source.
2. Glob for `#if DEBUG ... DebugBridgeManager` blocks.
3. Glob for `// Auto-generated state accessor` headers in `StateAccessor.swift` files.
4. Parse `Package.swift` for the DebugBridge dependency entries.
5. Present the user with what's about to be removed (file list and line counts). Confirm: proceed, dry-run, or abort.

## Phase 2: Remove

For each item the user approved:

1. Strip the import and the `#if DEBUG` block from the app's `@main` entry point. Keep surrounding code intact.
2. Remove DebugBridge `.package(...)` entries from `Package.swift` and any target references to `"DebugBridge"`, `"DebugBridgeCore"`, `"DebugBridgeTouch"`, or `"DebugBridgeUI"`.
3. Delete generated `StateAccessor.swift` files.
4. Build in Release configuration to verify:
   ```bash
   xcodebuild -scheme <SchemeName> \
     -destination 'platform=iOS,id=<UDID>' \
     build install -configuration Release
   ```
   If the build fails on a missing DebugBridge symbol, removal was incomplete. STOP and report.

## Phase 3: Verify

Run these checks:

```bash
! grep -r "DebugBridge" <app-source-dir>
! grep -r "// @Snapshotable" <app-source-dir>
swift build -c release

# Confirm no DebugBridge symbols in the binary:
nm -j <app-binary> | grep -i debugbridge
```

The last command should produce no output. Report the cleanup result with a one-line summary of what was removed.

## Reversibility

Every edit and delete is a git operation. The user can `git restore` to undo. Never force-push, never amend, never delete the SPM cache on this skill's behalf — those are user choices.
