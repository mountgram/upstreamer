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

# freeze — Restrict Edits to a Directory

Lock file edits to a specific directory. Any Edit or Write operation targeting
a file outside the allowed path is blocked. The agent must check the target
file against the freeze boundary before every edit.

## Setup

1. Ask the user which directory to restrict edits to.

2. Resolve the supplied path to an absolute path:

```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
```

3. Normalize with a trailing slash and persist it to a small session state file
   the agent re-reads before each edit:

```bash
FREEZE_DIR="${FREEZE_DIR%/}/"
mkdir -p "${TMPDIR:-/tmp}/tstack"
echo "$FREEZE_DIR" > "${TMPDIR:-/tmp}/tstack/freeze-dir.txt"
echo "Freeze boundary set: $FREEZE_DIR"
```

Tell the user: "Edits are now restricted to `<path>/`. Any Edit or Write
outside this directory will be blocked. Run `/unfreeze` to remove the boundary."

## Enforcement

**Before every Edit or Write operation**, the agent must:

1. Read the freeze boundary from the state file. If none is set, proceed normally.

2. If a boundary is set, check that the target file path starts with the freeze
   directory (the trailing `/` prevents `/src` from matching `/src-old`).

3. If the target file is **within** the boundary: proceed normally.

4. If the target file is **outside** the boundary: block it and tell the user
   the boundary and the path that fell outside it. The user can override by
   explicitly approving the out-of-bounds edit.

The boundary logic is fail-closed:

- **Unparseable target is denied, not allowed.** A boundary that fails open is
  not a boundary. If the agent cannot determine the file path of an Edit or
  Write, it denies the operation rather than guessing.
- **Non-file tools are allowed.** A payload with no file path (a Read, Bash,
  Glob, Grep, or similar) is not an edit and is not blocked.
- **Symlinks resolve through their final component.** An in-boundary symlink
  that points outside the boundary is checked against its target, so a link
  inside the directory cannot smuggle edits to a file outside it.
- **Boundaries containing spaces are supported.** Quote the path everywhere it
  is compared.

## Notes

- Freeze applies to Edit and Write tools only. Read, Bash, Glob, and Grep are unaffected.
- This prevents accidental edits, not a security boundary. Bash commands like `sed` or `mv` can still modify files outside the boundary.
- To change the boundary, run freeze again with a new path.
- To deactivate, run `/unfreeze` or end the conversation.
