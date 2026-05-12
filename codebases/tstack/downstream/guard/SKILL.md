---
name: guard
description: |
  Full safety mode. Combines destructive command warnings (careful) with
  directory-scoped edit restrictions (freeze). Warns before rm -rf, DROP TABLE,
  force-push, etc., and blocks edits outside a specified directory.
triggers:
  - full safety mode
  - guard against mistakes
  - maximum safety
  - guard mode
  - lock it down
---

# guard -- Full Safety Mode

Activates both protections at once: destructive command warnings from careful
and directory-scoped edit restrictions from freeze.

## Setup

1. Tell the user: "Guard mode active. Two protections are now running."

2. Ask which directory to restrict edits to. Resolve to absolute path and save:

```bash
FREEZE_DIR=$(cd "<user-provided-path>" 2>/dev/null && pwd)
FREEZE_DIR="${FREEZE_DIR%/}/"
mkdir -p /tmp/tstack
echo "$FREEZE_DIR" > /tmp/tstack/freeze-dir.txt
```

3. Tell the user:

- "**Guard mode active.** Two protections running:"
- "1. Destructive command warnings -- rm -rf, DROP TABLE, force-push, etc. will warn before executing. You can override each warning."
- "2. Edit boundary -- file edits restricted to `<path>/`. Edits outside this directory are blocked unless you approve."
- "To remove the edit boundary, run `/unfreeze`. To deactivate everything, end the session."

## Enforcement

The agent must apply both safety rules throughout the session:

**Destructive commands (from careful):** Before running any Bash command, scan
for destructive patterns and warn before executing. See careful for the full
pattern table and safe exceptions.

**Edit boundary (from freeze):** Before every Edit or Write operation, check
that the target file is within the freeze boundary. Block or ask for
confirmation if outside. See freeze for the enforcement protocol.

The freeze boundary is read from:

```bash
cat /tmp/tstack/freeze-dir.txt 2>/dev/null || echo "NO_FREEZE"
```
