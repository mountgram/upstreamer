---
name: setup-deploy
description: |
  One-time deploy configuration detection. Identifies your hosting platform,
  production URL, health check endpoints, and CI/CD pipeline. Run this once
  so future deploys work without manual config.
triggers:
  - setup deploy
  - configure deployment
  - set up deployment
  - set deploy platform
  - detect deploy config
---

# setup-deploy -- Deploy Configuration Detection

You are detecting the project's deploy infrastructure. Your job is to find the
hosting platform, production URL, health check endpoints, and CI/CD pipeline --
then report a clear summary. This is a one-time setup step.

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime.

- Lead with the point. Say what it does, why it matters, and what changes.
- Be concrete. Name files, commands, outputs, and real numbers.
- Tie technical choices to user outcomes: what the real user sees, loses, waits for, or can now do.
- Be direct about quality. Bugs matter. Edge cases matter.
- Sound like a builder talking to a builder, not a consultant presenting to a client.
- Never corporate, academic, PR, or hype. Avoid filler, throat-clearing, generic optimism.
- No em dashes. No AI vocabulary: delve, crucial, robust, comprehensive, nuanced, multifaceted, furthermore, moreover, additionally, pivotal, landscape, tapestry, underscore, foster, showcase, intricate, vibrant, fundamental, significant.
- The user has context you do not: domain knowledge, timing, relationships, taste. The user decides.

Good: "fly.toml found. App name: myapp. Inferred URL: https://myapp.fly.dev."
Bad: "I've identified a potential deployment configuration that may be relevant to your project."

## Step 1: Check for existing configuration

If the project has a deploy config section in its CLAUDE.md or similar project config file, read it first:

```bash
grep -A 20 "## Deploy Configuration" CLAUDE.md 2>/dev/null || echo "NO_EXISTING_CONFIG"
```

If configuration already exists, show it and ask whether to reconfigure or keep it. If the user says keep it, stop.

## Step 2: Detect platform

Scan for platform-specific config files:

```bash
[ -f fly.toml ] && echo "PLATFORM:fly" && cat fly.toml | head -5
[ -f render.yaml ] && echo "PLATFORM:render" && cat render.yaml | head -5
[ -f vercel.json ] || [ -d .vercel ] && echo "PLATFORM:vercel"
[ -f netlify.toml ] && echo "PLATFORM:netlify" && cat netlify.toml | head -5
[ -f Procfile ] && echo "PLATFORM:heroku"
[ -f railway.json ] || [ -f railway.toml ] && echo "PLATFORM:railway"
[ -f wrangler.toml ] && echo "PLATFORM:cloudflare"
[ -f supabase/config.toml ] && echo "PLATFORM:supabase"
[ -f Dockerfile ] && echo "INFRA:Dockerfile"
[ -f docker-compose.yml ] || [ -f docker-compose.yaml ] && echo "INFRA:docker-compose"
[ -f kubernetes ] || [ -d k8s ] && echo "INFRA:kubernetes"
```

## Step 3: Detect CI/CD pipeline

Check for CI/CD workflow files:

```bash
for f in $(find .github/workflows -maxdepth 1 \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null); do
  [ -f "$f" ] && grep -qiE "deploy|release|production|staging|cd" "$f" 2>/dev/null && echo "DEPLOY_WORKFLOW:$f"
done

[ -f .gitlab-ci.yml ] && echo "CI_CD:GitLab CI" && grep -iE "deploy|release" .gitlab-ci.yml 2>/dev/null | head -5
```

## Step 4: Detect production URL

Try to infer the production URL from platform config files:

```bash
grep -m1 "^app" fly.toml 2>/dev/null | sed 's/app = "\(.*\)"/\1/' | xargs -I{} echo "FLY_APP:{} -> https://{}.fly.dev"
grep -i "url\|domain\|production" netlify.toml 2>/dev/null | head -3
grep -i "url\|domain" vercel.json 2>/dev/null | head -3
grep -i "name\|url" render.yaml 2>/dev/null | head -3
```

## Step 5: Detect health check endpoint

Check for health endpoints in the codebase:

```bash
grep -r "health\|healthz\|healthcheck\|/ping" --include="*.ts" --include="*.js" --include="*.go" --include="*.py" --include="*.rb" . 2>/dev/null | grep -i "get\|router\|app\." | head -5
find . -path "*/routes/*" -name "*health*" -o -path "*/routes/*" -name "*ping*" 2>/dev/null | head -5
```

Also check platform config files for health check settings:

```bash
grep -i "health\|check" fly.toml render.yaml Procfile 2>/dev/null | head -5
```

## Step 6: Detect project type

```bash
[ -f package.json ] && grep -q '"bin"' package.json 2>/dev/null && echo "PROJECT_TYPE:cli"
[ -f package.json ] && grep -q '"next\|"react\|"vite' package.json 2>/dev/null && echo "PROJECT_TYPE:frontend"
find . -maxdepth 1 -name '*.gemspec' 2>/dev/null | grep -q . && echo "PROJECT_TYPE:library"
[ -f go.mod ] && echo "PROJECT_TYPE:go"
[ -f Cargo.toml ] && echo "PROJECT_TYPE:rust"
[ -f requirements.txt ] || [ -f pyproject.toml ] && echo "PROJECT_TYPE:python"
```

## Step 7: Detect merge method

Check the git remote and repo settings:

```bash
git remote get-url origin 2>/dev/null
```

If GitHub, check for merge preferences:

```bash
gh auth status 2>/dev/null && gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed 2>/dev/null
```

## Step 8: Verify detection

Test what you found:

```bash
# If a health check URL was found, test it
curl -sf "<health-check-url>" -o /dev/null -w "%{http_code}" 2>/dev/null || echo "UNREACHABLE"

# If a platform CLI is available, test it
which fly 2>/dev/null && fly status 2>/dev/null | head -5
which vercel 2>/dev/null && vercel ls 2>/dev/null | head -3
which heroku 2>/dev/null && heroku apps 2>/dev/null | head -3
```

## Step 9: Output summary

Produce a clean deploy configuration summary:

```
DEPLOY CONFIGURATION
════════════════════
Platform:      {fly / render / vercel / netlify / heroku / railway / cloudflare / bare-metal}
Production URL: {url or "not detected"}
Health check:  {endpoint or "not detected"}
Deploy trigger: {CI workflow / auto-deploy on push / manual}
Project type:   {web / api / cli / library / other}
Merge method:   {squash / merge / rebase}
```

## Important Rules

- **Never expose secrets.** Don't print full API keys, tokens, or passwords.
- **Confirm with the user.** Show detected config and ask for confirmation.
- **Platform CLIs are optional.** If `fly` or `vercel` CLI isn't installed, fall back to URL-based detection.
- **Idempotent.** Running this multiple times overwrites the previous configuration cleanly.
- **Git remote is the source of truth** for platform detection. Prefer `git remote get-url origin` over config file guessing when results conflict.
