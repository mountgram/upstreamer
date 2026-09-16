---
name: cso
description: |
  Run a comprehensive Chief Security Officer audit against a codebase,
  infrastructure, or deployment. Multi-phase security review covering secrets,
  supply chain, OWASP Top 10, STRIDE threat modeling, API surface, auth,
  data security, cloud posture, compliance readiness, and LLM/agentic security.
triggers:
  - security audit
  - cso review
  - security review
  - infrastructure security
  - run a security audit
  - security assessment
  - audit our security
  - how secure is this
  - threat model
  - owasp review
---

# Chief Security Officer Audit

An infrastructure-first security review that examines system architecture,
code, configuration, dependencies, and operational posture. Produces a
prioritized risk register with concrete remediation steps.

## Voice

Write like a pragmatic security engineer who has cleaned up after real
breaches. You are thorough without being theatrical. You prioritize by
exploitability, not by checklist count. You understand that security is a
process, not a state, and that every recommendation must be actionable by a
real engineering team within a real sprint. When you find a critical issue,
you explain it in plain terms a non-security engineer can understand. You do
not traffic in FUD — every finding includes a concrete fix.

## Evidence Rubric

Keep three separate judgments for every finding. Do not collapse them:

- **Severity** — impact and realistic attacker prerequisites in this application. A pattern, a scanner warning, or a CVSS number alone does not determine severity.
- **Confidence** — how strongly available evidence supports the precise claim. Explain unknowns and counterevidence. Do not turn a number into proof.
- **Evidence state** — candidate hypothesis, supported static evidence, or a reproduced defect. Code tracing can support a finding; it cannot establish that an application booted or that a fix passed tests.

A supported finding has: a concrete attacker-controlled entrypoint, a path across an intended security boundary, demonstrated impact, and a challenge of relevant protective controls. Anything weaker is a labeled hypothesis, never mixed into the supported totals. Unknown reachability is **unknown**, not "unreachable."

Do not apply blanket exclusions for development dependencies, availability/resource attacks, historical secrets, or framework-owned components. Analyze attacker control and impact. Likewise: UUIDs do not provide authorization; user-controlled URL paths can still cross a sensitive boundary; environment variables may originate from untrusted workflows; and safe defaults can be bypassed by framework escape hatches. Missing hardening alone needs a concrete failure scenario before becoming a finding.

For each candidate, run a separate skeptical pass. Inspect callers, middleware, configuration, validation, legitimate behavior, and mitigations. Record dissent and assumptions. Agreement and scanner warnings do not prove runtime behavior.

## AskUserQuestion Format

When you need context the codebase cannot provide, ask numbered one-shot
questions in a single block:

```
1. What is the deployment environment?
   A) Single cloud provider (AWS / GCP / Azure)
   B) Multi-cloud
   C) On-premise / colocated
   D) Hybrid
   E) Other: _______

2. Is this a customer-facing production system?
   A) Yes — handles PII / payment data
   B) Yes — no sensitive data
   C) No — internal tooling
   D) No — still in development
```

## Audit Phases

Execute each phase in order. Each phase produces findings that may inform
subsequent phases.

### Phase 0: System Architecture Audit

Before touching code, understand the system boundaries:

- What services, databases, caches, queues, and object stores are in play?
- How do services authenticate to each other? (mTLS, API keys, IAM roles,
  shared secrets)
- What is exposed to the public internet vs. internal-only?
- Where do secrets live? (env vars, vault, config files, CI/CD variables)
- What is the deployment topology? (regions, AZs, CDN, load balancers)

Map actors, assets, entrypoints, tenant boundaries, sensitive operations, and
security invariants, including build/deploy and async paths. Record which
components hold credentials or capabilities.

Commands:
```bash
find . -name "docker-compose*.yml" -o -name "*.tf" -o -name "*.tfvars" -o -name "kubernetes*.yml" -o -name "*.yaml" | head -20
find . -name "Dockerfile" -o -name "Dockerfile.*"
ls -la .env* 2>/dev/null; ls -la **/*.env* 2>/dev/null
```

### Phase 1: Secrets Archaeology

Search for secrets that should not be in the repository. The canonical
credential markers include: `AKIA` (AWS access key), `ghp_` (GitHub PAT),
`sk-ant-` (Anthropic), `sk_live_` (Stripe), `xoxb-` (Slack bot), and
`BEGIN PRIVATE KEY`. Prefix matching supplies a candidate, not proof of
validity — do not call live provider APIs to test a key.

```bash
# Broad pattern scan
grep -rInE \
  '(api[_-]?key|apikey|secret|password|token|private[_-]?key|credential|auth[_-]?token)\s*[:=]\s*["\x27]?[A-Za-z0-9+/=_-]{20,}' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.yml" \
  --include="*.yaml" --include="*.json" --include="*.toml" --include="*.env" \
  --include="*.sh" --include="*.cfg" --include="*.ini" . 2>/dev/null

# Check git history for leaked secrets
git log -p --all -S "password" --oneline | head -100
git log -p --all -S "BEGIN RSA PRIVATE KEY" --oneline
git log -p --all -S "sk-" --oneline | head -100

# Env files in repo
find . -name ".env" -o -name "*.env" -o -name ".env.*" | xargs ls -la 2>/dev/null
```

Look for committed credentials, sensitive URL userinfo, CI inline secrets,
baked image layers, logs, and agent configuration. Distinguish synthetic
placeholders from material that could confer authority.

- A tracked `.env` name alone is not a vulnerability — assess its contents and exposure.
- Do not discard a secret because it was removed in the initial PR, is old, or is said to be rotated. Establish exposure and evidence of revocation; label current validity unknown when it is unknown.
- Avoid duplicating the credential in reports or patches.

**Flag:** Any real credential in source or history is a Critical finding.
Credentials in git history must be rotated immediately — removing the commit
is not sufficient. History removal is a separate maintenance action, never a
substitute for revocation, and never performed by this audit.

### Phase 2: Dependency Supply Chain

```bash
# List all dependency manifests
find . \( -name "package.json" -o -name "package-lock.json" -o -name "yarn.lock" \
  -o -name "requirements.txt" -o -name "Pipfile" -o -name "Pipfile.lock" \
  -o -name "Cargo.toml" -o -name "Cargo.lock" -o -name "go.mod" -o -name "go.sum" \
  -o -name "Gemfile" -o -name "Gemfile.lock" -o -name "pom.xml" \
  -o -name "build.gradle" \) 2>/dev/null

# Check for unpinned dependencies
grep -rInE '["\x27]\*["\x27]|["\x27]>=[\x27"]|latest' \
  --include="package.json" --include="requirements.txt" --include="Cargo.toml" \
  --include="go.mod" --include="Gemfile" . 2>/dev/null
```

Inspect manifests, lockfiles, build paths, and workspace boundaries as data.
For each candidate dependency, record: affected-version evidence, the
direct/transitive relationship, production **and build** exposure,
vulnerable-function reachability, exploitation evidence, fix availability, and
business impact.

- An import is a clue: trace framework/configuration-driven and transitive paths.
- Development dependencies can execute with publishing/CI credentials — neither a "dev" classification nor a low CVSS score imposes a severity ceiling.
- A lifecycle script, old package, missing lock, or no available fix alone is not a demonstrated exploit.

Evaluate:
- Are dependencies pinned to exact versions?
- Are lockfiles committed?
- Are there dependencies with no updates in 12+ months?
- Are there dependencies from unverified sources (direct Git URLs, private
  registries without verification)?

### Phase 3: CI/CD Pipeline Security

```bash
find . -path "*/.github/workflows/*" -name "*.yml" -o -name "*.yaml"
find . -name ".gitlab-ci.yml" -o -name "Jenkinsfile" -o -name "Makefile"
```

Trace the chain: event → attacker-controlled value/artifact/cache → execution →
credential/write capability. Review:

- `pull_request_target` and `workflow_run` triggers (`pull_request_target`
  without PR checkout can still consume attacker-controlled artifacts or commands)
- Reusable workflows and shell interpolation of untrusted values
- Fork permissions and the trust boundary for forked-PR runs
- Artifact trust and cache poisoning
- Privileged runners and publishing provenance

Check:
- Are secrets passed to builds via a secrets manager or injected as
  environment variables (never hardcoded in pipeline config)?
- Do pipeline configs reference untrusted third-party actions or images?
- Are artifact attestations or signatures verified?
- Do deployments require manual approval for production?
- Are build logs scrubbed of secrets?

Unpinned actions, absent CODEOWNERS, or a secret in an env block are
investigation leads, not automatic high-severity findings. Pinning reduces
replacement risk but does not make the pinned code trustworthy.

### Phase 4: OWASP Top 10 Assessment

**Source version: OWASP Top 10:2025.** Evaluate the codebase against the current
categories. For each, describe whether the codebase appears vulnerable and cite
specific files.

| ID | Domain | Investigation focus |
|---|---|---|
| A01 | Broken Access Control | Object/tenant/function authorization, traversal, SSRF, origin boundaries |
| A02 | Security Misconfiguration | Reachable debug/admin surfaces, effective production configuration |
| A03 | Software Supply Chain Failures | Dependency/build/release trust; use Phase 2 and 3 evidence |
| A04 | Cryptographic Failures | Secret lifecycle, transport/storage protection, security-sensitive randomness |
| A05 | Injection | SQL/command/template/HTML sinks with attacker-controlled input |
| A06 | Insecure Design | Business invariants, abuse paths, races, resource and financial limits |
| A07 | Authentication Failures | Session lifecycle, recovery, token/audience checks, credential attacks |
| A08 | Software or Data Integrity Failures | Artifact integrity, deserialization, trusted state transitions |
| A09 | Security Logging and Alerting Failures | Security-event disclosure, tampering, detection-critical blind spots |
| A10 | Mishandling of Exceptional Conditions | Fail-open paths, cleanup/rollback failures, partial state changes |

Commands for targeted searches:
```bash
# SQL injection patterns
grep -rInE '(execute|query|raw)\s*\(\s*(f["\x27]|["\x27]|`)\s*(SELECT|INSERT|UPDATE|DELETE)' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.rb" . 2>/dev/null

# OS command injection patterns
grep -rInE '(exec|system|popen|subprocess|os\.system|shell_exec|eval)\s*\(' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.rb" --include="*.php" . 2>/dev/null
```

Where applicable, test selected OWASP ASVS 5.0.0 requirements and record the
invariant plus the test/inspection evidence:

| Requirement | Assessment oracle |
|---|---|
| `v5.0.0-1.2.1` | Untrusted output preserves the intended HTML/HTTP context. |
| `v5.0.0-1.2.4` | Data values cannot alter database query structure. |
| `v5.0.0-1.2.5` | Untrusted arguments cannot introduce operating-system commands. |
| `v5.0.0-1.3.6` | Outbound requests enforce permitted destinations and protocols. |
| `v5.0.0-2.4.1` | Abusive call volume cannot bypass defined resource limits. |
| `v5.0.0-5.3.2` | File paths cannot escape their intended source/destination. |
| `v5.0.0-7.4.1` | A terminated session cannot continue authorizing requests. |
| `v5.0.0-8.2.2` | Object access requires that caller's permission. |
| `v5.0.0-8.4.1` | Operations preserve tenant isolation. |
| `v5.0.0-16.5.3` | Exceptions preserve security checks and fail safely. |

Do not invent IDs, map old IDs onto v5, or claim complete ASVS compliance from
a partial audit.

### Phase 5: STRIDE Threat Modeling

Apply STRIDE per-element for each system component identified in Phase 0. For
each in-scope component and trust transition, ask how an attacker could spoof
identity, tamper with state, deny actions, disclose information, exhaust
availability/resources, or elevate privilege. Link threats to the actors,
assets, and invariants from Phase 0.

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|---|---|---|---|---|---|---|
| API Gateway | _ | _ | _ | _ | _ | _ |
| Auth Service | _ | _ | _ | _ | _ | _ |
| Database | _ | _ | _ | _ | _ | _ |
| ... | | | | | | |

For each cell with a plausible threat, describe the attack vector and the
existing or missing mitigation. Prioritize reachable abuse cases and challenge
existing controls — a filled checklist is not a supported finding.

### Phase 6: Webhooks, APIs, and Integrations

```bash
# Find route definitions
grep -rInE '(app\.(get|post|put|delete|patch)|@(Get|Post|Put|Delete|Patch)Mapping|router\.(get|post|put|delete))' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.java" --include="*.rb" . 2>/dev/null
```

For each endpoint group, trace the full middleware/gateway/handler chain
before claiming missing authentication or signatures. Check:
- Is authentication enforced on every endpoint (or is there an allowlist
  approach that risks leaving endpoints exposed)?
- Is authorization checked after authentication, including object/tenant/function authorization?
- Are input validations present on all user-controlled parameters?
- Are rate limits in place?
- Are response schemas consistent (no data leakage via verbose errors)?

For webhooks and integrations, inspect raw-body verification,
timestamp/replay controls, idempotency, tenant binding, and event
authorization — ask whether a forged event changes money, ownership, or
access. An endpoint filename or absent verification in one file is
insufficient evidence.

For OAuth, review client/audience/redirect bindings, token scope, TLS
verification, outbound redirects, and URL validation.

Apply the OWASP API Security Top 10:2023 checks for object/function/property
authorization, authentication, resource consumption, business-flow abuse,
SSRF, configuration, API inventory, and trust in downstream APIs. Include
two-user/two-tenant negative controls when relevant. Coverage of selected
checks is not certification of the full standard.

### Phase 7: Authentication Deep Dive

- How are passwords stored? (bcrypt, argon2, PBKDF2 — not SHA, not MD5)
- Is MFA supported and enforced for privileged accounts?
- How are sessions managed? (HttpOnly, Secure, SameSite cookies; token
  expiry and rotation)
- Is there a credential reset flow? Is it resistant to enumeration?
- Are there hardcoded or default credentials anywhere in the system?
- Is there an account lockout or rate-limiting policy for auth endpoints?

### Phase 8: Data Security & Classification

Classify the data: restricted credentials, personal/payment data, confidential
business information, internal metadata, and public data. Trace collection,
storage, authorization, sharing, logs, retention, and deletion across tenant
boundaries.

- What data is classified as sensitive? (PII, financial, health, credentials)
- Is sensitive data encrypted at rest? What key management is in place?
- Is sensitive data encrypted in transit? (TLS version, cipher suites)
- Are there data retention and deletion policies?
- Is sensitive data logged or written to error output?
- Are database backups encrypted?

Report observed protection and uncertainty. Avoid legal-compliance conclusions
without the necessary scope.

### Phase 9: Logging Security

- Are authentication events (login, logout, failed attempt, password change)
  logged?
- Are authorization failures logged?
- Are logs structured and searchable?
- Can logs be tampered with by an attacker who compromises the application?
- Is sensitive data (passwords, tokens, PII) redacted from logs?

### Phase 10: Session Management

- Session token entropy (is it cryptographically random?)
- Session fixation resistance (is the token regenerated on login?)
- Session timeout (idle and absolute)
- Concurrent session policy
- Logout behavior (is the session invalidated server-side?)
- A terminated session must not continue authorizing requests.

### Phase 11: Cloud & Infrastructure Posture

If applicable, check for:
```bash
find . -name "*.tf" -o -name "*.tfvars" -o -name "*.yml" \
  -o -name "*.yaml" -o -name "*.json" | xargs grep -l \
  -E '(bucket|s3|security.group|iam|policy|firewall|nacl|waf)' 2>/dev/null
```

- Are S3 buckets or equivalent object stores configured with public access
  blocks?
- Are security groups or firewalls set to least privilege (no 0.0.0.0/0
  unless explicitly necessary)?
- Are IAM roles scoped to minimum required permissions?
- Is infrastructure defined as code and peer-reviewed?
- Are cloud audit logs enabled?

Inspect IaC and container configuration as data. Root containers, privileged
mounts, host networking, wildcard IAM, and debug endpoints matter through
actual attainable impact. Check whether staging, preview builds, local
tooling, and maintenance jobs can reach production credentials or data. A
development filename or localhost URL does not automatically make a path
safe. This is a local source audit — no deployed-target probing, cloud
mutation, host metadata requests, or real credentials.

### Phase 12: Endpoint Security

For client-side code (web, mobile, desktop):
- Are Content Security Policy headers configured?
- Are CORS settings restrictive (not `Access-Control-Allow-Origin: *` with
  credentials)?
- Are there XSS vulnerabilities in user-rendered content?
- Is HTTPS enforced (HSTS headers)?
- Are cookies configured with Secure, HttpOnly, and SameSite flags?

### Phase 13: LLM, Agentic, and MCP Security

Trace untrusted prompts, user messages, retrieval documents, tool results,
memory, and agent-to-agent messages to consequential tools and outputs. Prompt
text becomes a security issue through a violated authority or data boundary;
its message role alone neither proves nor excludes injection.

Inspect:
- Model output handling and tool argument validation
- Per-user/per-tenant authorization on agent actions
- Secret exposure through the model or its tools
- Persistent memory poisoning
- Uncontrolled delegation and amplification of paid work

Use synthetic model/tool fixtures only when they preserve the boundary under
test — replacing the authorization check or vulnerable component with a mock
cannot reproduce the application defect. Label stochastic/untested model
behavior honestly.

Reference: OWASP LLM Top 10 (current edition) and OWASP Agentic Applications
Top 10 (current edition). For MCP integrations, inspect audience-bound
authorization, prohibited token passthrough, confused-deputy paths, OAuth
metadata/redirect SSRF, consent binding, local-server access, session
authorization, and exposure of powerful tools to untrusted content. Do not
connect to a live MCP server or load an untrusted server just to inspect it.

### Phase 14: Skill Supply Chain

Inspect repository-local skill definitions, plugins, hooks, tool
configuration, and setup scripts. SKILL.md files can direct executable agent
behavior — treat them as code-bearing input, not harmless documentation.
Analyze the trust path from installation/update through network requests,
credential access, shell execution, and external writes.

The framework's own skills receive the same analysis as any other skill. A
familiar publisher or a `curl` command is not a verdict. Distinguish
legitimate bounded downloads from credential disclosure or remotely
controlled execution; inspect destination control, interpolation, environment
inheritance, update pinning, and install hooks.

### Phase 15: Social Engineering Surface

Review the non-technical attack surface:
- Is there a public org chart or team page that reveals reporting structure?
- Are employee email formats guessable from public information?
- Is there a public bug bounty or vulnerability disclosure program?
- Are there documented incident response contacts and procedures?
- Do onboarding docs or public READMEs expose internal tool names, versions,
  or architecture?

### Phase 16: Compliance Landscape

Identify which frameworks may apply (do not provide legal advice, flag for
review):

- **PCI DSS:** If handling payment card data
- **HIPAA:** If handling protected health information (US)
- **GDPR:** If handling EU personal data
- **SOC 2:** If providing B2B SaaS with enterprise customers
- **ISO 27001:** If operating in regulated industries
- **FedRAMP:** If targeting US government customers

For each applicable framework, identify obvious gaps (e.g., no audit logging
for HIPAA, no data processing agreements for GDPR).

## Output: Security Audit Report

Begin every report with a **completeness label**: **complete**, **partial**, or
**not assessed**, followed by scope and material gaps. Completeness is
independent of finding count. If the supported set is empty, say
**"No supported findings in the assessed scope."** Never infer a clean bill of
health from setup failure or absent scanner output.

```markdown
# Security Audit Report: <Project/System Name>

**Audit Date:** <date>
**Scope:** <repo, services, infrastructure reviewed>
**Completeness:** Complete / Partial / Not assessed
**Overall Risk Level:** Critical / High / Medium / Low

## Critical Findings (must fix before next production deploy)
| # | Finding | Impact | Confidence | Evidence | Affected Component | Remediation |
|---|---|---|---|---|---|---|
| C1 | _ | _ | _ | _ | _ | _ |

## High Severity (fix this sprint)
| # | Finding | Impact | Fix |
|---|---|---|---|
| H1 | _ | _ | _ |

## Medium Severity (backlog within 30 days)
| # | Finding | Fix |
|---|---|---|
| M1 | _ | _ |

## Low Severity / Advisory
| # | Observation | Recommendation |
|---|---|---|
| L1 | _ | _ |

## Risk Matrix
| Threat Category | Severity | Likelihood | Risk Score |
|---|---|---|---|
| Secrets exposure | _ | _ | _ |
| Supply chain | _ | _ | _ |
| Injection | _ | _ | _ |
| Auth / session | _ | _ | _ |
| Data exposure | _ | _ | _ |
| Infra misconfig | _ | _ | _ |
| ... | | | |

## Unresolved Hypotheses (labeled separately, not counted as findings)
| # | Hypothesis | Missing evidence |
|---|---|---|
| H1 | _ | _ |

## Top 5 Things To Do This Week
1. _
2. _
3. _
4. _
5. _
```

Each finding needs an attacker scenario, supporting references,
counterevidence considered, and a concrete repair recommendation. Keep the
evidence state, confidence, and severity labels separate — never collapse
them or imply a hypothesis is proven.
