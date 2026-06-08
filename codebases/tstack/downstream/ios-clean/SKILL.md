---
name: ios-clean
description: |
  Remove temporary iOS debugging scaffolds and leave the app ready for review or release.
triggers:
  - ios clean
  - clean ios debug code
  - remove ios scaffolding
---

# iOS Clean

Use this skill before review or release when temporary iOS debug code may have accumulated.

## Check

- Debug-only UI, overlays, menus, or gestures.
- Local network permissions that are no longer needed.
- Test-only endpoints, credentials, or sample data.
- Conditional compilation flags and debug build settings.
- Simulator-only assumptions in app code.

## Workflow

1. Inspect recent diffs and project search results for debug terms.
2. Remove temporary code that is not part of the product.
3. Preserve intentional diagnostics behind appropriate build flags.
4. Run the available iOS build and tests when feasible.
5. Report what was removed and what remains intentionally.
