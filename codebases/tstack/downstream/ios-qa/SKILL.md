---
name: ios-qa
description: |
  Exercise an iOS app with focused manual and automated QA using available platform tools.
triggers:
  - ios qa
  - test the iphone app
  - test my ios app
  - find bugs on the device
  - qa the ios app
---

# iOS QA

Live-device iOS QA for SwiftUI apps. Connects to a real iPhone via USB, reads Swift source to understand every screen, then runs a vision-driven agent loop: screenshot, analyze, decide, act, verify, repeat. All interaction happens via HTTP to an embedded StateServer in the app under test.

## Architecture

```
       ┌──────────────────┐   USB CoreDevice (IPv6)   ┌──────────────────┐
       │ Mac-side daemon   │ ────────────────────────▶ │ iOS app          │
       │                   │                           │ StateServer      │
       │ - token rotation  │                           │ (loopback only)  │
       │ - session control │                           │ - /tap /swipe    │
       │ - proxy + auth    │                           │ - /type /state   │
       └──────────────────┘                           │ - /screenshot    │
                                                      └──────────────────┘
```

The iOS app's StateServer binds loopback only (`::1` and `127.0.0.1`). The Mac-side daemon proxies requests over the USB CoreDevice tunnel.

## Prerequisites

- macOS (the tooling uses `devicectl` from Xcode).
- iPhone connected via USB, paired, and trusted.
- Xcode and Swift toolchain installed (`swift --version` reports >= 5.9).
- App source available on disk, with at least one `@Observable` class.

## Phase 0: Session warm-start (optional)

If a session cache from a previous run exists and the device is still connected, skip Phases 1–2 and jump to Phase 3. Invalidate the cache when:

- The user requests a cold start.
- The UDID no longer matches a connected device.
- An accessor hash mismatch is detected on the first state query.

## Phase 1: Read source, plan codegen

1. Walk the app source (passed by the user or discovered via project inspection) and identify all `@Observable` classes. Note any property immediately preceded by the generator marker comment `// @Snapshotable` — those are the snapshot-eligible fields.

   The marker is a comment so it composes with the `@Observable` macro. Each marked field must belong to a file-scope observable class and be a writable instance `var` with an explicit type and an internal or public setter. Snapshot types are JSON-native scalars (`String`, `Bool`, integer widths, `Float`, `Double`, `CGFloat`), arrays, String-keyed dictionaries, and their Optional compositions. Keys must be unique across observable classes.

   Codegen stops with a source diagnostic instead of emitting a broken or lossy harness when any of these constraints is violated.

2. Present the accessor list to the user and confirm whether to install the DebugBridge SPM dependency into their `Package.swift`.

## Phase 2: Bootstrap the device bridge

1. Generate the canonical local bridge package, typed accessors, and installed version marker. The regenerator writes a local `DebugBridge/` package into the app source tree and emits a `StateAccessor.swift` for the app target.

2. Add the generated `DebugBridge` local SPM dependency to the app's `Package.swift`. The package ships three Debug-config-only library products:
   - `DebugBridgeCore` (Swift, cross-platform) — StateServer and bridge protocols.
   - `DebugBridgeTouch` (Objective-C, iOS-only) — in-process touch synthesis with iOS 18+ SwiftUI hit-testing.
   - `DebugBridgeUI` (Swift, iOS-only) — Screenshot, Elements, and Mutation bridge implementations.

   The app target depends on `DebugBridgeUI` with `.when(configuration: .debug)`, which transitively pulls in Core and Touch. Release builds refuse to link these targets.

3. Wire the bridges from the `@main` App init, gated on `#if DEBUG`:
   ```swift
   #if DEBUG
   import DebugBridgeCore
   #if canImport(UIKit)
   import DebugBridgeUI
   DebugBridgeUIWiring.installAll()
   #endif
   DebugBridgeManager.shared.start(
       appState: appState,
       register: AppStateAccessor.register
   )
   #endif
   ```

4. Build and deploy to the device:
   ```bash
   xcodebuild -scheme <SchemeName> \
     -destination 'platform=iOS,id=<UDID>' build install
   ```

5. Launch via `devicectl`:
   ```bash
   devicectl device process launch --device <UDID> --console <bundle-id>
   ```
   Capture the boot token printed to `os_log` on first run.

6. Spawn the Mac-side daemon. The daemon acquires an exclusive lock on a PID file. If another daemon is alive, the second invocation discovers its port and connects.

7. The daemon immediately rotates the auth token with a fresh in-memory-only credential. The boot token becomes useless ~5s later. If a fresh daemon finds the app running after another daemon consumed the one-use token, it verifies the bundle owner, relaunches the target once, waits for the new token, verifies ownership again, and then rotates.

## Phase 3: Vision-driven agent loop

Each iteration:

1. `GET /screenshot` (via daemon) — save PNG.
2. `GET /elements` — accessibility tree.
3. `GET /state/snapshot` (only `// @Snapshotable` fields) — current state.
4. Decide next action based on what's on the screen vs the test goal.
5. `POST /session/acquire` to grab the device lock.
6. Execute `POST /tap`, `/swipe`, `/type`, or `POST /state/<key>` write.
7. Re-screenshot; compare; record finding if buggy.
8. `POST /session/release` once the iteration is done.

## Modes

**Local-USB mode (default).** Daemon binds loopback only. The spawning agent gets full-surface access. Best for solo development.

**Recording mode.** DebugOverlay renders a small diagonal "AGENT DEMO" watermark in a corner so screencasts are unambiguous about the device being agent-driven.

**Demo mode.** If the user says "demo", "demo mode", "show me", or "I want to see it working", run in DEMO MODE. When demo mode is active, drive every action through visible UI (`/tap`, `/swipe`, `/type`) and never use `POST /state/*` writes to skip steps. Viewers see the agent type every key, tap every button.

## Failure modes

| Symptom | Likely cause | Action |
|---|---|---|
| `curl: connection refused` to daemon | Daemon crashed | Re-run `/ios-qa`. Spawn-race lock will fail closed. |
| `403 identity_not_allowed` on `/auth/mint` | Identity missing from allowlist | Add the remote identity to the allowlist on the Mac. |
| `409 schema_mismatch` on `/state/restore` | Snapshot from older app build | Discard the snapshot; re-capture. |
| `503 device_disconnected` from proxy | USB route dropped or app relaunched | Daemon invalidates the stale tunnel and retries one fresh bootstrap. Reconnect or unlock the iPhone if it persists. |
| `429 rate_limited` on `/auth/mint` | >10 mints/min from one identity | Wait 60s; check audit log for anomalies. |
| `413 body_too_large` on `/state/restore` | Snapshot >1MB | Increase max body limit or trim the snapshot. |

## Cleanup

Use `/ios-clean` to remove the DebugBridge SPM dependency and all `#if DEBUG` wiring before a Release build. This is a convenience flow; the structural Release-build guard (`Package.swift` `.when(configuration: .debug)` plus CI `swift build -c release` check) is the safety-critical path.
