#!/usr/bin/env bash
set -euo pipefail

DOWNSTREAM="${1:-codebases/last30days-ts/downstream}"

echo "=== Verification: last30days-ts ==="
echo ""

# Check required files and structure
check_file() {
  local path="$1"
  local label="$2"
  if [ -f "$path" ]; then
    echo "  PASS: $label exists"
  else
    echo "  FAIL: $label missing at $path"
    FAILURES=$((FAILURES + 1))
  fi
}

check_not_found() {
  local pattern="$1"
  local label="$2"
  local hits
  hits=$(find "$DOWNSTREAM" -not -path '*/node_modules/*' -not -path '*/dist/*' -type f \( -name '*.ts' -o -name '*.md' -o -name '*.json' -o -name '*.example' \) -exec grep -l "$pattern" {} \; 2>/dev/null || true)
  if [ -z "$hits" ]; then
    echo "  PASS: $label not found in source"
  else
    echo "  FAIL: $label found: $hits"
    FAILURES=$((FAILURES + 1))
  fi
}

check_grep() {
  local pattern="$1"
  local label="$2"
  local hits
  hits=$(grep -RIl "$pattern" "$DOWNSTREAM" --include='*.ts' --include='*.md' --include='*.example' 2>/dev/null | grep -v node_modules | grep -v dist || true)
  if [ -n "$hits" ]; then
    echo "  PASS: $label found ($(echo "$hits" | wc -l | tr -d ' ') files)"
  else
    echo "  FAIL: $label not found"
    FAILURES=$((FAILURES + 1))
  fi
}

check_regex() {
  local pattern="$1"
  local label="$2"
  local hits
  hits=$(grep -RIlE "$pattern" "$DOWNSTREAM" --include='*.ts' --include='*.md' --include='*.json' --include='*.example' 2>/dev/null | grep -v node_modules | grep -v dist || true)
  if [ -n "$hits" ]; then
    echo "  PASS: $label found ($(echo "$hits" | wc -l | tr -d ' ') files)"
  else
    echo "  FAIL: $label not found"
    FAILURES=$((FAILURES + 1))
  fi
}

check_frontmatter_doc() {
  local path="$1"
  local label="$2"
  if [ ! -f "$path" ]; then
    echo "  FAIL: $label missing at $path"
    FAILURES=$((FAILURES + 1))
    return
  fi

  local first_line has_description has_title_or_name
  first_line=$(awk 'NR == 1 { print; exit }' "$path")
  has_description=$(awk 'NR <= 25 && /^description:/ { found=1 } END { print found ? "yes" : "" }' "$path")
  has_title_or_name=$(awk 'NR <= 25 && /^(title|name):/ { found=1 } END { print found ? "yes" : "" }' "$path")

  if [ "$first_line" = "---" ] && [ -n "$has_description" ] && [ -n "$has_title_or_name" ]; then
    echo "  PASS: $label has frontmatter"
  else
    echo "  FAIL: $label lacks required frontmatter"
    FAILURES=$((FAILURES + 1))
  fi
}

FAILURES=0

echo "Structural checks:"
check_file "$DOWNSTREAM/README.md" "Downstream README"
check_file "$DOWNSTREAM/LICENSE" "License"
check_file "$DOWNSTREAM/upstreamer-changelog.md" "Changelog"
check_file "$DOWNSTREAM/skills/last30days/SKILL.md" "Agent SKILL.md"
check_file "$DOWNSTREAM/skills/last30days/references/INSTALL.md" "Install reference"
check_file "$DOWNSTREAM/skills/last30days/references/planning.md" "Planning reference"
check_file "$DOWNSTREAM/skills/last30days/references/reranking.md" "Reranking reference"
check_file "$DOWNSTREAM/skills/last30days/references/comparison-search.md" "Comparison-search reference"
check_file "$DOWNSTREAM/skills/last30days/references/all-time-search.md" "All-time search reference"
check_file "$DOWNSTREAM/skills/last30days/references/browser-research.md" "Browser research reference"
check_file "$DOWNSTREAM/skills/last30days/references/source-sdk-guide.md" "Source SDK guide reference"
check_file "$DOWNSTREAM/skills/last30days/scripts/last30days/package.json" "package.json"
check_file "$DOWNSTREAM/skills/last30days/scripts/last30days/tsconfig.json" "tsconfig.json"
check_file "$DOWNSTREAM/skills/last30days/scripts/last30days/.env.example" ".env.example"
check_file "$DOWNSTREAM/skills/last30days/scripts/last30days/.gitignore" ".gitignore in script pkg"
check_file "$DOWNSTREAM/eval/run.ts" "eval runner outside skill dir"

echo ""
echo "Markdown frontmatter:"
check_frontmatter_doc "$DOWNSTREAM/skills/last30days/SKILL.md" "Agent SKILL.md"
for reference_doc in "$DOWNSTREAM"/skills/last30days/references/*.md; do
  check_frontmatter_doc "$reference_doc" "$(basename "$reference_doc")"
done

echo ""
echo "Python/prohibited files:"
python_hits=$(find "$DOWNSTREAM" -not -path '*/node_modules/*' -type f \( -name '*.py' -o -name 'pyproject.toml' -o -name 'uv.lock' -o -name 'requirements.txt' \) | head -5)
if [ -z "$python_hits" ]; then
  echo "  PASS: no Python files found"
else
  echo "  FAIL: Python files found: $python_hits"
  FAILURES=$((FAILURES + 1))
fi

echo ""
echo "Banned auth mechanisms:"
check_not_found "AUTH_TOKEN" "AUTH_TOKEN in source"
check_not_found "CT0" "CT0 in source"
check_not_found "logged.in.Twitter" "logged-in Twitter references"
check_not_found "search_parameters" "legacy xAI search_parameters usage"
check_not_found "tool_results" "legacy xAI tool_results parsing"

echo ""
echo "Required source implementations:"
check_grep "EXA_API_KEY" "Exa references"
check_grep "BRAVE_API_KEY" "Brave references"
check_grep "OPENAI_API_KEY" "OpenAI web grounding references"
check_grep "GEMINI_API_KEY" "Gemini grounding references"
check_grep "yt-dlp" "yt-dlp references"
check_grep "x_search" "xAI x_search tool references"
check_grep "web_search" "xAI web_search tool references"
check_grep "searchOpenAIWeb" "OpenAI web source SDK"
check_grep "searchGeminiYouTube" "Gemini YouTube source SDK"
check_grep "searchGeminiMaps" "Gemini Maps source SDK"

echo ""
echo "SDK and timeframe contract:"
check_grep "searchInternet" "public orchestrated SDK export"
check_regex "search[A-Z][A-Za-z0-9_]*" "direct source search functions"
check_regex "timeframe.*all|--timeframe all|all-time" "all-time timeframe support"
check_regex "browser|agent-browser|Rotunda|LinkedIn" "browser research guidance"
check_regex "Sonar|Perplexity|perplexity" "Perplexity/Sonar documentation"
check_regex "expensive.*opt-in|opt-in.*expensive|webBackend === \"perplexity\"|--web-backend perplexity" "Perplexity/Sonar opt-in cost control"
check_regex "source \.env|repo-root \.env|set -a; source \.env; set \+a" "repo-root .env setup guidance"
check_regex "one-off|scratch|custom-pars|custom pars|TypeScript or JavaScript file" "custom SDK script guidance"

echo ""
echo "Banned web-search:"
ddg_hits=$(grep -RIl "duckduckgo" "$DOWNSTREAM" --include='*.ts' --include='*.md' 2>/dev/null | grep -v node_modules | grep -v dist | grep -v upstreamer-changelog || true)
if [ -z "$ddg_hits" ]; then
  echo "  PASS: DuckDuckGo not in runtime code or docs"
else
  echo "  WARN: DuckDuckGo mentioned in non-runtime files: $ddg_hits"
fi

echo ""
echo "Skill directory shape:"
extra_files=$(find "$DOWNSTREAM/skills/last30days" -mindepth 2 -maxdepth 2 -not -path '*/scripts/*' -not -path '*/references/*' -not -name 'SKILL.md' -type f 2>/dev/null || true)
if [ -z "$extra_files" ]; then
  echo "  PASS: skill dir has only expected files"
else
  echo "  WARN: extra files in skill dir: $extra_files"
fi

nested_files=$(find "$DOWNSTREAM/skills/last30days" -mindepth 3 -maxdepth 3 -type f ! -name 'SKILL.md' 2>/dev/null || true)
if [ -z "$nested_files" ]; then
  echo "  PASS: no extra nested files in skill dirs"
else
  echo "  INFO: allowed nested files in refs/scripts: $(echo "$nested_files" | wc -l | tr -d ' ') files"
fi

echo ""
echo "Eval isolation:"
eval_in_skill=$(echo "$DOWNSTREAM/skills/last30days/eval" 2>/dev/null || true)
if [ -d "$DOWNSTREAM/eval" ] && [ ! -d "$DOWNSTREAM/skills/last30days/eval" ]; then
  echo "  PASS: eval lives outside installed skill"
else
  echo "  FAIL: eval is inside skill dir or missing"
  FAILURES=$((FAILURES + 1))
fi

echo ""
if [ "$FAILURES" -eq 0 ]; then
  echo "=== Verification: PASSED ($FAILURES failures) ==="
  exit 0
else
  echo "=== Verification: FAILED ($FAILURES failures) ==="
  exit 1
fi
