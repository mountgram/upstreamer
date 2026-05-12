---
name: unfreeze
description: |
  Clear the freeze boundary set by freeze or guard. Removes directory edit
  restrictions so all directories are editable again.
triggers:
  - unfreeze edits
  - unlock all directories
  - remove edit restrictions
  - unfreeze
  - allow all edits
---

# unfreeze -- Clear Freeze Boundary

Remove the edit restriction set by `/freeze` or `/guard`, allowing edits to
all directories again.

## Clear the boundary

```bash
if [ -f /tmp/tstack/freeze-dir.txt ]; then
  PREV=$(cat /tmp/tstack/freeze-dir.txt)
  rm -f /tmp/tstack/freeze-dir.txt
  echo "Freeze boundary cleared (was: $PREV). Edits are now allowed everywhere."
else
  echo "No freeze boundary was set."
fi
```

Tell the user the result:

- If a boundary was cleared: "Freeze boundary removed. All directories are now editable. The previous boundary was `<path>`."
- If no boundary was set: "No freeze boundary is active. All directories are already editable."

To re-freeze, run `/freeze` or `/guard` again.
