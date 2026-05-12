---
name: freeze
description: |
  Restrict file edits to a single directory. Blocks Edit and Write operations
  outside the allowed path. Use when debugging to avoid accidentally changing
  unrelated code, or when you want to scope changes to one module.
triggers:
  - freeze edits to directory
  - lock editing scope
  - restrict file changes
  - only edit this folder
  - lock down edits
---

# freeze -- Restrict Edits to a Directory

Lock file edits to a specific directory. Any Edit or Write operation targeting
a file outside the allowed path is blocked. The agent must check the target
file against the freeze boundary before every edit.

## Setup

1. Ask the user which directory to restrict edits to.

2. Resolve the supplied path to an absolute path:

```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
```

3. Normalize and save to a state file:

```bash
FREEZE_DIR="${FREEZE_DIR%/}/"
mkdir -p /tmp/tstack
echo "$FREEZE_DIR" > /tmp/tstack/freeze-dir.txt
echo "Freeze boundary set: $FREEZE_DIR"
```

Tell the user: "Edits are now restricted to `<path>/`. Any Edit or Write
outside this directory will be blocked. Run `/unfreeze` to remove the boundary."

## Enforcement

**Before every Edit or Write operation**, the agent must:

1. Read the freeze boundary:

```bash
cat /tmp/tstack/freeze-dir.txt 2>/dev/null || echo "NO_FREEZE"
```

2. If a boundary is set, check that the target file path starts with the freeze directory.

3. If the target file is **within** the boundary: proceed normally.

4. If the target file is **outside** the boundary: warn the user and ask for
   confirmation before proceeding. The user can bypass the restriction by
   explicitly approving the out-of-bounds edit.

## Notes

- The trailing `/` on the freeze directory prevents `/src` from matching `/src-old`.
- Freeze applies to Edit and Write tools only. Read, Bash, Glob, and Grep are unaffected.
- This prevents accidental edits, not a security boundary. Bash commands like `sed` or `mv` can still modify files outside the boundary.
- To change the boundary, run freeze again with a new path.
- To deactivate, run `/unfreeze` or end the conversation.
