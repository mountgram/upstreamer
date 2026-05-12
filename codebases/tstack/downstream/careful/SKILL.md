---
name: careful
description: |
  Warns before destructive commands. Checks every Bash command for patterns
  like rm -rf, DROP TABLE, force push, git reset --hard, and kubectl delete.
  Asks for explicit confirmation before execution. Use when touching prod,
  debugging live systems, or working in shared environments.
triggers:
  - be careful
  - warn before destructive
  - safety mode
  - careful mode
  - prod mode
---

# careful -- Destructive Command Warnings

Safety mode is now active. Every Bash command must be checked for destructive
patterns before running. If a destructive command is detected, warn the user
explicitly and ask for confirmation. The user can always override.

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime.

- Be direct. Name the exact command, what it will destroy, and what the fallout looks like.
- Don't just say "this is dangerous." Say "This will permanently delete the production database. No undo."
- The user decides. Your job is to make the stakes clear.

## Destructive Patterns

Before running any Bash command, scan the command string against these patterns:

| Pattern | Example | What it does |
|---------|---------|--------------|
| `rm -rf` / `rm -r` / `rm --recursive` | `rm -rf /var/data` | Recursively deletes files |
| `DROP TABLE` / `DROP DATABASE` | `DROP TABLE users;` | Destroys database tables/data |
| `DELETE FROM` (without `WHERE`) | `DELETE FROM orders;` | Deletes all rows from a table |
| `TRUNCATE` | `TRUNCATE orders;` | Deletes all rows, resets counters |
| `ALTER TABLE ... DROP` | `ALTER TABLE users DROP COLUMN email;` | Destroys schema structure |
| `git push --force` / `git push -f` | `git push -f origin main` | Overwrites remote history |
| `git reset --hard` | `git reset --hard HEAD~3` | Discards uncommitted work |
| `git checkout .` / `git restore .` | `git checkout .` | Discards all uncommitted changes |
| `kubectl delete` | `kubectl delete pod --all` | Removes Kubernetes resources |
| `docker rm -f` / `docker system prune` | `docker system prune -a` | Destroys containers/images |
| `chmod 777` | `chmod 777 /etc/passwd` | Opens files to all users |
| `aws <service> delete` | `aws s3 rb s3://bucket --force` | Destroys cloud resources |
| `gcloud <service> delete` | `gcloud sql instances delete db` | Destroys cloud resources |
| `terraform destroy` | `terraform destroy -auto-approve` | Tears down infrastructure |

## Safe Exceptions

These patterns are allowed without warning:

- `rm -rf node_modules` / `.next` / `dist` / `__pycache__` / `.cache` / `build` / `.turbo` / `coverage` / `target` / `.venv` / `vendor`
- `git push` without `--force` or `-f`
- `git reset` without `--hard`
- `git restore` with a specific file path (not `.`)

## Warning Protocol

When a destructive pattern is detected:

1. **STOP.** Do not execute the command.
2. Explain what the command will do in plain English.
3. State specifically what will be lost, destroyed, or made unrecoverable.
4. Ask: "This will {specific consequence}. Proceed?"
5. Wait for explicit user confirmation before running.

Example warning:
```
DETECTED: `rm -rf /var/lib/postgresql`
This will permanently delete your PostgreSQL data directory.
All databases, tables, and records will be unrecoverable.
Proceed?
```

## How it works

The agent checks each Bash command against the patterns above before executing.
This is an inline advisory check -- the agent reads these rules and applies them
at runtime. No external scripts, no hooks, no infrastructure.

To deactivate, end the conversation or start a new one.
