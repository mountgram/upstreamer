---
name: investigate
description: |
  Systematic debugging and root cause analysis. Follow a disciplined four-phase
  process to investigate, trace, hypothesize, and fix — never patch symptoms
  without understanding the underlying cause.
triggers:
  - "investigate this error"
  - "debug this"
  - "why is this broken"
  - "root cause analysis"
  - "troubleshoot this"
  - "what's causing this bug"
  - "find the root cause"
  - "help me debug"
---

# Systematic Debugging

A disciplined, repeatable process for investigating software failures. No
fixes without root cause. No guessing. No thrashing.

## Iron Law

**Never apply a fix until you understand the root cause.** A symptom patch
that quiets the error without addressing the cause is technical debt with a
timer. If you cannot explain why the fix works to a colleague in one
sentence, you have not found the root cause.

## Voice

Be a surgical diagnostician. Calm, methodical, evidence-driven. Do not
speculate without data. When you have a hypothesis, state it clearly, then
test it. When you are uncertain, say so and explain what additional
information would resolve the uncertainty.

## Four Phases

### Phase 1: Investigate — Gather the Full Error Context

Collect everything before forming any opinions:

1. **The error itself.** Capture the full stack trace, error message, exit
   code, and log output. Do not truncate. Do not paraphrase. The exact text
   matters.

2. **Reproduction context.**
   - What command, request, or action triggered the error?
   - Can you reproduce it deterministically? If not, what is the failure
     rate?
   - What is the environment? (OS, runtime version, shell, environment
     variables)

3. **Recent changes.** The most common cause of a new error is a recent
   change. Gather:
   ```bash
   git log --since="24 hours ago" --oneline
   git diff HEAD~5 --stat
   ```

4. **Environment state.**
   ```bash
   env | sort
   which <relevant-binary>
   <relevant-binary> --version
   ```

5. **Logs and artifacts.** Check application logs, system logs, and any
   relevant output files. Look for warnings that preceded the error — they
   often contain the real signal.

### Phase 2: Analyze — Trace the Code Path

With the error context in hand, trace the code from entry point to failure:

1. **Identify the entry point.** What function, handler, or script was
   invoked? Start there.

2. **Follow the execution path.** Walk through each function call, condition
   branch, and data transformation from entry to the point of failure. Use:
   ```bash
   grep -rn "function_name" --include="*.py" --include="*.js" --include="*.ts" --include="*.go" --include="*.rs" .
   grep -rn "error message text" --include="*" .
   ```

3. **Reproduce mentally (or actually).** Reconstruct the exact state that
   produced the error. What values were in play? What assumptions did the
   code make that were violated?

4. **Identify the gap.** Find the precise line where expected behavior
   diverges from actual behavior. This is the failure point — not
   necessarily the root cause, but the location where the root cause
   manifests.

### Phase 3: Hypothesize — Form and Test a Hypothesis

1. **State the hypothesis in one sentence:**
   > "The error occurs because [X] causes [Y] at [line/file], which leads to [Z]."

2. **Test the hypothesis.** Prefer a minimal reproduction over debugging in
   place. Create the smallest possible input or scenario that isolates the
   cause:
   ```bash
   # Example: isolate a failing function
   node -e "const { failingFunc } = require('./module'); failingFunc(suspectInput)"
   ```

3. **Validate or reject.** If the hypothesis is confirmed, you know the root
   cause. If rejected, return to Phase 2 with new information. Do not skip
   to Phase 4 with an unvalidated hypothesis.

### Phase 4: Implement — Fix the Root Cause

Only now, with a validated root cause, write the fix:

1. **State what the fix changes and why it addresses the root cause.**
2. **Apply the minimal change** that resolves the cause.
3. **Verify the fix** by reproducing the original error and confirming it no
   longer occurs.
4. **Check for regressions.** Run the existing test suite. Check related
   code paths that might be affected.
5. **If applicable, add a regression test** that would have caught this
   failure.

## Anti-Loop Rule

If you have tried **three different fixes** and none has worked, **stop
immediately.** Do not attempt a fourth fix. You are thrashing. Return to
Phase 1 with fresh eyes:

- Re-read the error message. You may have fixated on the wrong detail.
- Re-examine your assumptions. Which one is least certain?
- Add instrumentation (logging, print statements, debugger breakpoints)
  rather than more fixes.
- Narrow the scope: isolate a smaller component and test it independently.
- Ask for a second perspective.

Thrashing wastes time and introduces new bugs. A disciplined reset is faster
than a fourth guess.

## Common Pitfalls

Watch for these in yourself during investigation:

- **Confirmation bias.** You formed a hypothesis early and are now looking
  only for evidence that supports it. Actively seek disconfirming evidence.
- **Premature abstraction.** You are debugging the architecture you wish
  existed, not the code that actually runs. Read the file on disk, not your
  mental model of it.
- **Version mismatch.** The error is in production but you are debugging
  locally against a different version. Verify with `git log -1` on both
  sides.
- **Environment drift.** A dependency, environment variable, or config file
  differs between environments. Compare them explicitly.
- **Heisenbugs.** The error disappears when you add logging or run under a
  debugger. These are timing, concurrency, or memory issues. Add
  non-invasive tracing rather than breakpoints.

## Reporting

When you have found and fixed the root cause, produce a concise report:

```markdown
## Root Cause Analysis: <brief title>

**Error:** <exact error message>

**Root Cause:** <one-sentence explanation of what caused the error>

**Failure Point:** <file:line where the error manifested>

**Why it happened now:** <trigger — recent change, environment shift, edge case>

**Fix:** <what was changed and why>

**Verification:** <how the fix was confirmed>

**Prevention:** <test, guard, or process change to prevent recurrence>
```
