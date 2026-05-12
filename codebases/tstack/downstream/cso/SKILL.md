---
name: cso
description: |
  Run a comprehensive Chief Security Officer audit against a codebase,
  infrastructure, or deployment. Multi-phase security review covering secrets,
  supply chain, OWASP Top 10, STRIDE threat modeling, API surface, auth,
  data security, cloud posture, and compliance readiness.
triggers:
  - "security audit"
  - "cso review"
  - "security review"
  - "infrastructure security"
  - "run a security audit"
  - "security assessment"
  - "audit our security"
  - "how secure is this"
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

Commands:
```bash
find . -name "docker-compose*.yml" -o -name "*.tf" -o -name "*.tfvars" -o -name "kubernetes*.yml" -o -name "*.yaml" | head -20
find . -name "Dockerfile" -o -name "Dockerfile.*"
ls -la .env* 2>/dev/null; ls -la **/*.env* 2>/dev/null
```

### Phase 1: Secrets Archaeology

Search for secrets that should not be in the repository:

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

**Flag:** Any real credential in source or history is a Critical finding.
Credentials in git history must be rotated immediately — removing the commit
is not sufficient.

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

Evaluate:
- Are dependencies pinned to exact versions?
- Are lockfiles committed?
- Are there dependencies with no updates in 12+ months?
- Are there dependencies from unverified sources (direct Git URLs, private
  registries without verification)?

### Phase 3: CI/CD Pipeline Posture

```bash
find . -path "*/.github/workflows/*" -name "*.yml" -o -name "*.yaml"
find . -name ".gitlab-ci.yml" -o -name "Jenkinsfile" -o -name "Makefile"
```

Check:
- Are secrets passed to builds via a secrets manager or injected as
  environment variables (never hardcoded in pipeline config)?
- Do pipeline configs reference untrusted third-party actions or images?
- Are artifact attestations or signatures verified?
- Do deployments require manual approval for production?
- Are build logs scrubbed of secrets?

### Phase 4: OWASP Top 10 Assessment

Evaluate the codebase against the current OWASP Top 10. For each category,
describe whether the codebase appears vulnerable and cite specific files.

| # | Category | Check |
|---|---|---|
| A01 | Broken Access Control | Are authorization checks consistent across all endpoints? Is there horizontal/vertical privilege escalation risk? |
| A02 | Cryptographic Failures | Is any sensitive data transmitted in cleartext? Are deprecated algorithms (MD5, SHA1, DES) in use? |
| A03 | Injection | Are there unsanitized inputs to SQL, OS commands, LDAP, or template engines? |
| A04 | Insecure Design | Are security controls absent from the design phase? Are threat models documented? |
| A05 | Security Misconfiguration | Are debug modes enabled? Are default credentials in use? Are unnecessary features enabled? |
| A06 | Vulnerable Components | Are there dependencies with known CVEs? |
| A07 | Auth Failures | Are password policies enforced? Is MFA available? Are session tokens secure? |
| A08 | Software/Data Integrity | Are artifacts verified before deployment? Are deserialization sources trusted? |
| A09 | Logging/Monitoring | Are auth events logged? Are logs tamper-proof? Is there alerting for suspicious activity? |
| A10 | SSRF | Are server-side requests validated? Are URL allowlists enforced? |

Commands for targeted searches:
```bash
# SQL injection patterns
grep -rInE '(execute|query|raw)\s*\(\s*(f["\x27]|["\x27]|`)\s*(SELECT|INSERT|UPDATE|DELETE)' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.rb" . 2>/dev/null

# OS command injection patterns
grep -rInE '(exec|system|popen|subprocess|os\.system|shell_exec|eval)\s*\(' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.rb" --include="*.php" . 2>/dev/null
```

### Phase 5: STRIDE Threat Modeling

Apply STRIDE per-element for each system component identified in Phase 0.
Document threats in a table:

| Component | Spoofing | Tampering | Repudiation | Info Disclosure | DoS | Elevation |
|---|---|---|---|---|---|---|
| API Gateway | _ | _ | _ | _ | _ | _ |
| Auth Service | _ | _ | _ | _ | _ | _ |
| Database | _ | _ | _ | _ | _ | _ |
| ... | | | | | | |

For each cell with a plausible threat, describe the attack vector and the
existing or missing mitigation.

### Phase 6: API Surface Audit

```bash
# Find route definitions
grep -rInE '(app\.(get|post|put|delete|patch)|@(Get|Post|Put|Delete|Patch)Mapping|router\.(get|post|put|delete))' \
  --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.java" --include="*.rb" . 2>/dev/null
```

For each endpoint group, check:
- Is authentication enforced on every endpoint (or is there an allowlist
  approach that risks leaving endpoints exposed)?
- Is authorization checked after authentication?
- Are input validations present on all user-controlled parameters?
- Are rate limits in place?
- Are response schemas consistent (no data leakage via verbose errors)?

### Phase 7: Authentication Deep Dive

- How are passwords stored? (bcrypt, argon2, PBKDF2 — not SHA, not MD5)
- Is MFA supported and enforced for privileged accounts?
- How are sessions managed? (HttpOnly, Secure, SameSite cookies; token
  expiry and rotation)
- Is there a credential reset flow? Is it resistant to enumeration?
- Are there hardcoded or default credentials anywhere in the system?
- Is there an account lockout or rate-limiting policy for auth endpoints?

### Phase 8: Data Security

- What data is classified as sensitive? (PII, financial, health, credentials)
- Is sensitive data encrypted at rest? What key management is in place?
- Is sensitive data encrypted in transit? (TLS version, cipher suites)
- Are there data retention and deletion policies?
- Is sensitive data logged or written to error output?
- Are database backups encrypted?

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

### Phase 11: Cloud Configuration

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

### Phase 12: Endpoint Security

For client-side code (web, mobile, desktop):
- Are Content Security Policy headers configured?
- Are CORS settings restrictive (not `Access-Control-Allow-Origin: *` with
  credentials)?
- Are there XSS vulnerabilities in user-rendered content?
- Is HTTPS enforced (HSTS headers)?
- Are cookies configured with Secure, HttpOnly, and SameSite flags?

### Phase 13: Social Engineering Surface

Review the non-technical attack surface:
- Is there a public org chart or team page that reveals reporting structure?
- Are employee email formats guessable from public information?
- Is there a public bug bounty or vulnerability disclosure program?
- Are there documented incident response contacts and procedures?
- Do onboarding docs or public READMEs expose internal tool names, versions,
  or architecture?

### Phase 14: Compliance Landscape

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

```markdown
# Security Audit Report: <Project/System Name>

**Audit Date:** <date>
**Scope:** <repo, services, infrastructure reviewed>
**Overall Risk Level:** Critical / High / Medium / Low

## Critical Findings (must fix before next production deploy)
| # | Finding | Impact | Affected Component | Remediation |
|---|---|---|---|---|
| C1 | _ | _ | _ | _ |

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

## Top 5 Things To Do This Week
1. _
2. _
3. _
4. _
5. _
```
