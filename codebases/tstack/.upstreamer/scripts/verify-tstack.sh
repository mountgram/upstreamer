#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <downstream-dir>" >&2
  exit 2
fi

downstream_dir="$1"

if [ ! -d "$downstream_dir" ]; then
  echo "ERROR: downstream directory does not exist: $downstream_dir" >&2
  exit 2
fi

failures=0

check_empty() {
  local label="$1"
  shift
  local output

  output=$("$@" || true)

  if [ -z "$output" ]; then
    echo "PASS: $label"
  else
    echo "FAIL: $label" >&2
    if [ -n "${output:-}" ]; then
      printf '%s\n' "$output" >&2
    fi
    failures=$((failures + 1))
  fi
}

check_required_file() {
  local path="$1"

  if [ -f "$downstream_dir/$path" ]; then
    echo "PASS: $path exists"
  else
    echo "FAIL: missing $path" >&2
    failures=$((failures + 1))
  fi
}

check_required_file "README.md"
check_required_file "LICENSE"
check_required_file "VERSION"

check_empty "no non-SKILL files inside skill directories" \
  find "$downstream_dir" -mindepth 2 -maxdepth 2 -type f ! -name SKILL.md

check_empty "no nested files inside skill directories" \
  find "$downstream_dir" -mindepth 3 -type f

check_empty "no executable files" \
  find "$downstream_dir" -type f -perm -111

check_empty "no disallowed paths or files" \
  find "$downstream_dir" \( \
    -path '*/.github/*' -o \
    -path '*/bin/*' -o \
    -path '*/scripts/*' -o \
    -path '*/test/*' -o \
    -path '*/supabase/*' -o \
    -path '*/extension/*' -o \
    -path '*/hosts/*' -o \
    -path '*/lib/*' -o \
    -path '*/docs/*' -o \
    -name package.json -o \
    -name bun.lock -o \
    -name conductor.json -o \
    -name '*.tmpl' \
  \) -print

check_empty "no banned upstream infrastructure references" \
  grep -RInE 'gstack|garrytan|~/.gstack|~/.tstack|~/.claude/skills/(gstack|tstack)|bin/(gstack|tstack)-|gstack-config|gstack-update-check|gstack-telemetry-log|gstack-timeline-log|gstack-slug|gstack-learnings-search|telemetry|analytics|gbrain|benchmark|session tracking|checkpoint|routing|bun.lock' "$downstream_dir"

if [ "$failures" -ne 0 ]; then
  echo "Verification failed with $failures issue(s)." >&2
  exit 1
fi

echo "Verification passed."
