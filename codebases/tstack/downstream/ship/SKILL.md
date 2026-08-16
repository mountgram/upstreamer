---
name: ship
description: |
  Ship workflow: detect base branch, run tests, review diff, bump VERSION,
  update CHANGELOG, commit, push, create PR. Use when asked to "ship", "deploy",
  "push to main", "create a PR", or "get it deployed". Proactively invoke when
  code is ready.
triggers:
  - ship it
  - create a pr
  - push to main
  - deploy this
---

# Ship: Release Checklist

You are running the ship workflow. This is a non-interactive, fully automated workflow. Do NOT ask for confirmation at each step. Run straight through and output the PR URL at the end.

**Only stop for:**
- On the base branch (abort)
- Merge conflicts that can't be auto-resolved
- Test failures from your branch changes
- Pre-landing review finds issues requiring user judgment

**Never stop for:**
- Uncommitted changes (always include them)
- Version bump choice (auto-pick PATCH)
- CHANGELOG content (auto-generate from diff)
- Commit message approval

## Voice

TStack voice: mountgram-shaped product and engineering judgment, compressed for runtime. Lead with the point. Be concrete. Name files, functions, line numbers, commands, and real numbers. Be direct about quality. No em dashes. No AI vocabulary.

## Step 0: Detect Platform and Base Branch

Detect the git hosting platform:

```bash
git remote get-url origin 2>/dev/null
```

- If the URL contains "github.com" → platform is **GitHub**
- If the URL contains "gitlab" → platform is **GitLab**

Determine the base branch:

**GitHub:**
```bash
gh pr view --json baseRefName -q .baseRefName 2>/dev/null || gh repo view --json defaultBranchRef -q .defaultBranchRef.name 2>/dev/null
```

**Git-native fallback:**
```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's|refs/remotes/origin/||' || echo "main"
```

## Step 0.9: Apple Target Detection

Shipping to the App Store is not landing a PR. If the repository contains an `.xcodeproj`, `.xcworkspace`, or a Swift package with an app product AND the user's ask is store distribution (App Store, TestFlight, "release my app"), **STOP and read the "App Store Release" section below FIRST** — before the branch gate and any preflight. Store distribution proceeds from whatever branch the user is on (a clean tree on the base branch is the solo developer's normal case, not an error). The branch gate and repository-landing pipeline below apply ONLY to repository-landing asks, including on Apple repos.

## Step 1: Pre-flight

1. Check the current branch. If on the base branch, **abort**: "You're on the base branch. Ship from a feature branch."

2. Gather context:

```bash
git status
git diff <base>...HEAD --stat
git log <base>..HEAD --oneline
```

3. Check for uncommitted changes — always include them, no need to ask.

4. Check for TODOs that would block shipping:

```bash
grep -r "TODO\|FIXME\|HACK" --include="*.ts" --include="*.js" --include="*.rb" --include="*.py" --include="*.go" . | grep -v node_modules | head -20
```

## Step 2: Distribution Pipeline Check

If the diff introduces a new standalone artifact (CLI binary, library package, tool), verify that a distribution pipeline exists:

```bash
git diff origin/<base> --name-only | grep -E '(cmd/.*/main\.go|bin/|Cargo\.toml|setup\.py|package\.json)' | head -5
ls .github/workflows/ 2>/dev/null | grep -iE 'release|publish|dist'
```

If no release pipeline exists and a new artifact was added, flag it.

## Step 3: Merge Base Branch

Fetch and merge the base branch so tests run against the merged state:

```bash
git fetch origin <base> && git merge origin/<base> --no-edit
```

**If there are merge conflicts:** Try to auto-resolve if simple (VERSION, CHANGELOG ordering). If conflicts are complex or ambiguous, **STOP** and show them.

**If already up to date:** Continue silently.

## Step 4: Detect and Run Tests

Detect the test framework:

```bash
[ -f package.json ] && grep -q '"test"' package.json && echo "TEST: npm test"
[ -f pyproject.toml ] && grep -q "pytest" pyproject.toml && echo "TEST: pytest"
[ -f Cargo.toml ] && echo "TEST: cargo test"
[ -f go.mod ] && echo "TEST: go test ./..."
[ -f Gemfile ] && echo "TEST: bundle exec rake test"
```

Run tests:

```bash
# Use the detected test command
```

**If failures:** Determine ownership. Check if the failing test files were modified on this branch:

```bash
git diff origin/<base>...HEAD --name-only
```

- **In-branch failures:** **STOP.** Fix your broken tests before shipping.
- **Pre-existing failures:** Flag them but they do not block shipping unless critical.

## Step 5: Pre-Landing Review

Review the diff for structural issues:

```bash
git diff origin/<base>
```

Check for:
- **Security issues:** SQL injection, XSS, exposed secrets, missing auth checks
- **Data safety:** Missing validations, unsafe migrations, data loss risks
- **Error handling:** Uncaught exceptions, missing error boundaries, silent failures
- **Performance:** N+1 queries, missing indexes, large payloads, blocking operations

Every finding includes a confidence score (1-10) and severity (P0-P3).

## Step 6: Bump VERSION

Check and bump VERSION if it exists:

```bash
cat VERSION 2>/dev/null || echo "NO_VERSION_FILE"
```

If VERSION exists and was not modified on this branch, auto-bump PATCH:

```bash
awk -F. '{print $1"."$2"."$3+1}' VERSION > VERSION.tmp && mv VERSION.tmp VERSION
```

If VERSION was already bumped, use as-is.

## Step 7: Update CHANGELOG

If CHANGELOG.md exists, prepend an entry for this version:

```bash
git diff <base>...HEAD --stat
git log <base>..HEAD --oneline
```

Generate a CHANGELOG entry from the diff and commit messages. Lead with what the user can now do. Internal changes go in a "For contributors" subsection.

## Step 8: Commit and Push

```bash
git status
git add -A
git commit -m "release: v$(cat VERSION)

$(git log <base>..HEAD --oneline | sed 's/^/- /')"
git push origin HEAD
```

## Step 9: Create Pull Request

**GitHub:**

```bash
gh pr create \
  --base <base> \
  --title "v$(cat VERSION)" \
  --body "$(cat <<'EOF'
## Summary

$(git log <base>..HEAD --oneline | sed 's/^/- /')

## Test Results

Tests passed locally.

## Changed Files

$(git diff <base>...HEAD --stat)
EOF
)"
```

**GitLab:**

```bash
glab mr create \
  --target-branch <base> \
  --title "v$(cat VERSION)" \
  --description "$(git log <base>..HEAD --oneline | sed 's/^/- /')"
```

**GitHub REST fallback:** on some repos `gh pr edit` hard-errors with a GraphQL deprecation mentioning `repository.pullRequest.projectCards` ("Projects (classic) is being deprecated..."). That is a `gh` GraphQL-path problem, not a permissions problem — do not re-ask for auth. Fall back to the REST endpoint, which never touches the deprecated field, using the SAME already-scanned body file: `PR_NUMBER=$(gh pr view --json number -q .number)` then `gh api "repos/{owner}/{repo}/pulls/$PR_NUMBER" -X PATCH -F body=@"$PR_BODY_FILE"`.

Output the PR/MR URL.

## App Store Release

Applies when the ship target is an Apple platform app (`.xcodeproj`, `.xcworkspace`, or a Swift package with an app product) and the user asked for store distribution. This extends ship's judgment to the App Store journey end to end. Store distribution is its own release path, not repository landing: the branch/PR ceremony above applies only when the user asked to land repository changes. Never abort an App Store release over branch topology.

One tool runs the entire release: machine-level `fastlane` — `produce` (app record and bundle ID), `cert` and `sigh` (signing), `gym` (archive and signed export), `pilot` (TestFlight), `deliver` (metadata, screenshots, Submit for Review), `frameit` (device frames). Install it when missing (`brew install fastlane`) with a one-line announcement, not a question — the release authorization covers machine-tool installs. Never mention API keys, `.p8` files, sessions, or any credential format to the user.

A Mac is required only for the build legs. Archiving, signing, and the binary upload ride Xcode's macOS-only toolchain — Apple ships it nowhere else. On a non-macOS host, say so plainly, then route exactly those legs through a macOS CI runner (a GitHub Actions `macos` runner executing the same `gym` and `deliver`/`pilot` commands, with the minted upload key supplied as a CI secret); sign-in, key minting, metadata, screenshots, pricing, and submission judgment are plain API work that stays on the user's machine. Never claim the whole release is impossible off a Mac, and never pretend the build leg is possible there.

### The one authorization moment

The whole journey permits exactly two interactions, and no others. FIRST, up front: confirm the user holds a paid Apple Developer Program membership (US$99/year — the App Store and TestFlight both require it) and authorize the release. Pricing belongs to this same breath, once per app EVER: ask free or paid (and the price if paid) inside the authorization question — never as a separate interruption — and remember the answer for this app so no later release re-asks (a paid answer names the one-time Paid Apps banking/tax agreement honestly right there, since nothing sells until it is signed). Apple sign-in happens inside this same moment: run `fastlane spaceauth -u <apple-id>` through the host's interactive command path so the user's password and two-factor code go directly to Apple in-session. Keep the printed session token out of the transcript — the cached cookie in `~/.fastlane/spaceship/` is the credential fastlane actually uses. Immediately after the first sign-in, mint the permanent upload key from the session; when that key already exists and no new app record is needed, skip sign-in entirely — repeat releases authorize and proceed with zero sign-in. SECOND, only when preflight finds the icon or screenshots missing: the store-assets question below. Everything else — tool installs, upload, storefront, submission — is covered by the authorization and proceeds without asking.

No membership: STOP the App Store path. Offer to walk enrollment at developer.apple.com (a purchase the user completes themselves; activation can take a day or two), and name the free-account ceiling honestly: personal-team installs on the user's own devices only, expiring after 7 days, no TestFlight, no App Store.

### Release preflight

Resolve and verify before archiving. Fix what the authorization authorizes; report everything else as a blocking finding.

- Signing: development team on the app target; `cert` and `sigh` mint the distribution certificate and App Store profile when none exist.
- Versioning: a marketing version users should see and a build number strictly greater than any build already uploaded for that version.
- Dependencies: `xcodebuild -resolvePackageDependencies` succeeds; if a `Podfile` or `Cartfile` exists, its install step has been run and lockfiles are current.
- App Store validation blockers: complete app icon set including the 1024pt marketing icon, launch screen, a usage-description string for every privacy-gated API the app touches, required privacy manifests, an export-compliance answer (`ITSAppUsesNonExemptEncryption`), and a sane deployment target.

### Store assets

Only when preflight finds the icon or screenshots missing, ask once — the journey's second and final permitted question — then act on the choice without further prompts. Once per app, EVER; after the user answers, remember it so no future run asks again. Offer:

- **App icon**: SnapAI (`npx snapai`, the app-icon agent skill) generates the single 1024×1024 with the user's own image-generation key; Xcode 15+ derives every size from that one image.
- **Marketing screenshots, free and local, no API key**: a screenshot deck editor skill — scaffold it, prefill its deck JSON with simulator captures and benefit headlines, and export one bundle covering every required iPhone size. Marketing-grade does NOT require an image backend; never claim screenshots need an API key while such a skill is available.
- **Plain frames, free and local**: capture the built app in the simulator and frame with fastlane `frameit` — the minimal option when no designed deck is wanted.
- **AI-enhanced marketing screenshots**: an app-store screenshot agent skill (benefit headlines, breakout panels, exact App Store dimensions) — the only option that needs the user's own image-generation key.
- **User-supplied files**: always a valid answer; validate dimensions and move on.

Build this question's options from a LIVE check of installed skills at ask time — never from memory. Assets already present skip this entirely. Announce what was generated at exit.

### Archive and upload

1. Archive and export the signed Release build with `gym` (it drives xcodebuild and the signing minted in preflight). The output is an App Store-signed `.ipa`.
2. The upload is an external effect: run `pilot` (TestFlight) or `deliver` (App Store) under the durable-effect contract. Before executing, append the key `appstore.upload.<bundle-id>.<build>` to a local effects log (e.g. `~/.appstoreconnect/effects.log`); if the key is already present from a prior run (crash, retry), treat the upload as possibly-done and do NOT re-run it. Never re-upload on ambiguity; inspect App Store Connect for the build first.
3. The cached session, the minted key, and every credential file are env- or file-level secrets: never argv, never echoed, never committed.
4. NEVER demand an app-specific password — the session MINTS the upload key instead. Apple's binary-upload tool (iTMSTransporter, which `deliver`/`pilot` shell out to for the `.ipa`) does not accept the web session: it takes only an App Store Connect API key or an app-specific password, and Apple's error `-22938` is Transporter saying exactly this. That is not a gate and not a question, because the web session creates the key itself, silently: through fastlane's bundled spaceship (`Spaceship::Tunes.login(<apple-id>)` reuses the cached cookie), `POST https://appstoreconnect.apple.com/iris/v1/apiKeys` with a JSON:API body, then `GET .../iris/v1/apiKeys/<id>?fields[apiKeys]=privateKey` — the `privateKey` attribute is base64 of the COMPLETE PEM file: decode it exactly once and write `~/.appstoreconnect/private_keys/AuthKey_<id>.p8` (0600) immediately, it is downloadable only at creation. The issuer ID is `provider.publicProviderId` from `GET https://appstoreconnect.apple.com/olympus/v1/session`. Record key id, issuer id, and key content as a fastlane api-key JSON and run `deliver`/`pilot` with `api_key_path` from then on. The key never expires, so every later release skips sign-in; the session stays necessary only for `produce` and for re-minting if the key is ever revoked. CLASSIFY the error before touching credentials: an error is an authentication failure ONLY when it says so (401/403, session invalid or expired, "sign in", "app-specific password"). A `Spaceship::UnexpectedResponse`, missing/invalid attribute, validation, or precheck error is a METADATA problem — fix the payload and retry. Treating a metadata error as a credential problem is a contract violation.

**On an upload-auth error, escalate in this order — never jump straight to a password:**
- a. **Mint (or re-mint) the upload key from the session** per step 4 and retry the upload with `api_key_path`. An upload-auth error with no key on disk means the mint was skipped, not that the user owes a credential.
- b. **If minting itself fails with a session error**, ask the user to sign in again (the same `fastlane spaceauth -u <apple-id>` moment as the original authorization), re-mint, and retry.
- c. **Only when a FRESH session still cannot mint a key** — a permissions refusal because the signed-in Apple ID is not Admin or Account Holder on its team — does the app-specific-password path open, and its only shape is self-service: the user generates the password on any device and enters it through the host's in-session masked prompt into the macOS keychain (`fastlane fastlane-credentials add --username <apple-id>`), then the upload is retried. NEVER offer or recommend a browser drive to create credentials.
5. App Review contact details (name, email, phone) are required metadata for submission: infer name and email from the signed-in Apple ID and git config, collect the phone number once inside the authorization moment, and never re-ask. Contact details are metadata, not a blocking gate to announce mid-run.

### Storefront completion

`produce` already created the app record and bundle ID during the run — never call the app record a manual gate. Apply the pricing settled in the authorization moment through the App Store Connect price-schedule endpoint (`POST /v1/appPriceSchedules` via the session or the minted key): fastlane's `price_tier` option is broken against the current API ("'prices' is not a relationship on 'apps'"), so never route pricing through it or call its failure an account problem. `deliver` owns everything else the store listing needs: description, keywords, localizations, screenshot upload per device size, attaching the uploaded build, and Submit for Review; `pilot` manages TestFlight groups and testers as an intermediate round when the user asked for one. Submission follows the same durable-effect contract with key `appstore.submit.<bundle-id>.<version>` — on ambiguity, inspect App Store Connect before re-running. Monitor review status from the CLI afterward.

What remains web-only, ever: the paid Apple Developer Program membership purchase itself (a precondition, not a release step) and, for PAID apps only, the one-time Paid Apps agreement with banking and tax — the user completes these in a browser. A free app needs no browser at any point. After submission, report that App Review typically answers within a day or two and close the run; review outcome is not a gate this workflow can hold open.

## Important Rules

- **Never ship from the base branch.** Feature branches only.
- **Uncommitted changes are always included.** No need to ask.
- **Always run tests before shipping.** Pre-existing failures are flagged but not blocking.
- **Version bumps are automatic.** PATCH for fixes, ask for MINOR or MAJOR.
- **CHANGELOG is auto-generated from diff.** Polish wording but preserve content.
- **App Store release is a separate path.** Apple store distribution bypasses the branch/PR ceremony and runs the fastlane adapter above.
