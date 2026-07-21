# Upstreamer Changelog

## Latest Sync

- Updated `ios-qa` skill: refreshed to match upstream's `// @Snapshotable` generator marker comment workflow, updated Phase 2 bridge bootstrap with the new wiring pattern (`DebugBridgeManager.shared.start(appState:register:)`), expanded daemon behavior documentation, and updated the failure modes table with current error handling.
- Updated `ios-clean` skill: refreshed to reference the new `// @Snapshotable` generator marker comment format instead of the obsolete property wrapper, restored the full 3-phase (Inventory / Remove / Verify) operational model from upstream for more precise cleanup guidance.
- `ios-sync` remains dropped: its core workflow still depends on a codegen binary that is specific to the upstream toolchain and cannot be replaced with standard commands.
- All 36 skills verified clean: no upstream branding leaks, no helper scripts, no banned infrastructure references. Mechanical verification and qualitative eval passed (3 contract-backed warnings in design-html, design-shotgun, and spec — all involve external binaries intentionally removed per the KISS philosophy).
