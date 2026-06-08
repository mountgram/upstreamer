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

grep_project() {
  grep -RInE \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude-dir=eval-output \
    --exclude-dir=output \
    "$@"
}

require_file "README.md"
require_file "upstreamer-changelog.md"
require_file "LICENSE"
require_file ".gitignore"
require_dir "eval"
require_file "eval/run.ts"
require_dir "skills/last30days"
require_file "skills/last30days/SKILL.md"
require_file "skills/last30days/references/INSTALL.md"
require_file "skills/last30days/references/planning.md"
require_file "skills/last30days/references/reranking.md"
require_dir "skills/last30days/scripts/last30days"
require_file "skills/last30days/scripts/last30days/package.json"
require_file "skills/last30days/scripts/last30days/bun.lock"
require_file "skills/last30days/scripts/last30days/tsconfig.json"
require_file "skills/last30days/scripts/last30days/.env.example"
require_file "skills/last30days/scripts/last30days/.gitignore"
require_file "skills/last30days/scripts/last30days/LICENSE"
require_dir "skills/last30days/scripts/last30days/src"
require_dir "skills/last30days/scripts/last30days/test"

ts_files=$(find "$downstream/skills/last30days/scripts/last30days/src" -type f \( -name '*.ts' -o -name '*.tsx' \) | wc -l | tr -d ' ')
if [ "$ts_files" -eq 0 ]; then
  echo "ERROR: no TypeScript source files found under skills/last30days/scripts/last30days/src/" >&2
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

if find "$downstream/skills/last30days" -type d -name 'eval-output' | grep -q .; then
  echo "ERROR: generated eval-output directory must not be bundled in the installable skill" >&2
  find "$downstream/skills/last30days" -type d -name 'eval-output' >&2
  exit 1
fi

if find "$downstream/skills/last30days/scripts/last30days" -path '*/eval/*' -o -type d -name eval | grep -q .; then
  echo "ERROR: eval runner must live at downstream/eval, not inside the installed skill bundle" >&2
  find "$downstream/skills/last30days/scripts/last30days" -path '*/eval/*' -o -type d -name eval >&2
  exit 1
fi

if ! grep_project 'EXA_API_KEY|Exa|exa' "$downstream/README.md" "$downstream/skills/last30days" >/dev/null; then
  echo "ERROR: Exa source or EXA_API_KEY is not documented or implemented" >&2
  exit 1
fi

if grep_project 'duckduckgo|DuckDuckGo|duck-duck' "$downstream/README.md" "$downstream/skills" >/dev/null; then
  echo "ERROR: DuckDuckGo is still present in downstream runtime, README, skills, tests, or package metadata" >&2
  grep_project 'duckduckgo|DuckDuckGo|duck-duck' "$downstream/README.md" "$downstream/skills" >&2
  exit 1
fi

if grep_project -- '--sources' "$downstream/README.md" "$downstream/skills/last30days" >/dev/null; then
  echo "ERROR: downstream exposes --sources as the primary source-selection interface" >&2
  grep_project -- '--sources' "$downstream/README.md" "$downstream/skills/last30days" >&2
  exit 1
fi

if ! grep_project 'yt-dlp|ytdlp' "$downstream/README.md" "$downstream/skills/last30days" >/dev/null; then
  echo "ERROR: YouTube adapter does not document or use the upstream yt-dlp binary approach" >&2
  exit 1
fi

for key in BRAVE_API_KEY SERPER_API_KEY PARALLEL_API_KEY SCRAPECREATORS_API_KEY OPENROUTER_API_KEY; do
  if ! grep_project "$key" "$downstream/README.md" "$downstream/skills/last30days" >/dev/null; then
    echo "ERROR: optional source environment variable is not documented or implemented: $key" >&2
    exit 1
  fi
done

if ! grep_project 'setup|configure|configuration' "$downstream/README.md" "$downstream/skills/last30days" >/dev/null; then
  echo "ERROR: optional setup/configuration helper is not documented or implemented" >&2
  exit 1
fi

if grep_project 'python3|pytest|uv run|pip install' "$downstream/README.md" "$downstream/skills/last30days" >/dev/null; then
  echo "ERROR: downstream still documents Python runtime commands:" >&2
  grep_project 'python3|pytest|uv run|pip install' "$downstream/README.md" "$downstream/skills/last30days" >&2
  exit 1
fi

if ! grep_project 'bun install|bun run last30days|bun run test' "$downstream/README.md" "$downstream/skills/last30days/SKILL.md" "$downstream/skills/last30days/references/INSTALL.md" >/dev/null; then
  echo "ERROR: installed skill does not document Bun-based usage" >&2
  exit 1
fi

echo "last30days-ts verifier passed"
