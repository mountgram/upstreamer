#!/usr/bin/env bash
set -euo pipefail

downstream="${1:-}"

if [ -z "$downstream" ]; then
  echo "ERROR: usage: $0 <downstream-dir>" >&2
  exit 2
fi

if [ ! -d "$downstream" ]; then
  echo "ERROR: downstream directory does not exist: $downstream" >&2
  exit 1
fi

require_file() {
  if [ ! -f "$downstream/$1" ]; then
    echo "ERROR: missing required file: $1" >&2
    exit 1
  fi
}

require_dir() {
  if [ ! -d "$downstream/$1" ]; then
    echo "ERROR: missing required directory: $1" >&2
    exit 1
  fi
}

require_file "README.md"
require_file "upstreamer-changelog.md"
require_file "LICENSE"
require_file "package.json"
require_file "tsconfig.json"
require_dir "src"

ts_files=$(find "$downstream/src" -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l | tr -d ' ')
if [ "$ts_files" -eq 0 ]; then
  echo "ERROR: no TypeScript source files found under src/" >&2
  exit 1
fi

python_files=$(find "$downstream" -type f \( -name '*.py' -o -name 'pyproject.toml' -o -name 'uv.lock' -o -name 'requirements.txt' \))
if [ -n "$python_files" ]; then
  echo "ERROR: Python files or packaging were kept:" >&2
  echo "$python_files" >&2
  exit 1
fi

if find "$downstream" -type d -name '__pycache__' | grep -q .; then
  echo "ERROR: Python __pycache__ directory found" >&2
  exit 1
fi

if ! grep -RInE 'duckduckgo|DuckDuckGo' "$downstream/README.md" "$downstream/src" >/dev/null; then
  echo "ERROR: DuckDuckGo source is not documented or implemented" >&2
  exit 1
fi

if ! grep -RInE 'EXA_API_KEY|Exa|exa' "$downstream/README.md" "$downstream/src" >/dev/null; then
  echo "ERROR: Exa source or EXA_API_KEY is not documented or implemented" >&2
  exit 1
fi

if grep -RInE -- '--sources' "$downstream/README.md" "$downstream/src" >/dev/null; then
  echo "ERROR: downstream exposes --sources as the primary source-selection interface" >&2
  grep -RInE -- '--sources' "$downstream/README.md" "$downstream/src" >&2
  exit 1
fi

if ! grep -RInE 'yt-dlp|ytdlp' "$downstream/README.md" "$downstream/src" >/dev/null; then
  echo "ERROR: YouTube adapter does not document or use the upstream yt-dlp binary approach" >&2
  exit 1
fi

for key in BRAVE_API_KEY SERPER_API_KEY PARALLEL_API_KEY SCRAPECREATORS_API_KEY OPENROUTER_API_KEY; do
  if ! grep -RIn "$key" "$downstream/README.md" "$downstream/src" >/dev/null; then
    echo "ERROR: optional source environment variable is not documented or implemented: $key" >&2
    exit 1
  fi
done

if ! grep -RInE 'setup|configure|configuration' "$downstream/README.md" "$downstream/src" >/dev/null; then
  echo "ERROR: optional setup/configuration helper is not documented or implemented" >&2
  exit 1
fi

if grep -RInE 'python3|pytest|uv run|pip install' "$downstream/README.md" "$downstream/package.json" "$downstream/src" >/dev/null; then
  echo "ERROR: downstream still documents Python runtime commands:" >&2
  grep -RInE 'python3|pytest|uv run|pip install' "$downstream/README.md" "$downstream/package.json" "$downstream/src" >&2
  exit 1
fi

echo "last30days-ts verifier passed"
