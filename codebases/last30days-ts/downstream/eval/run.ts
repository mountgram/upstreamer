#!/usr/bin/env node
/**
 * Live eval runner for last30days-ts.
 * Runs evals against real (or mocked) sources and writes artifacts to eval-output/.
 *
 * Usage:
 *   npm run eval          Run all available evals (skips missing keys)
 *   npm run eval:offline  Run only zero-key/no-network evals
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { getConfig } from "../src/config.js";
import { getDateRange, formatDate } from "../src/dates.js";

const EVAL_OUTPUT_DIR = resolve(process.cwd(), "eval-output");
const isOffline = process.argv.includes("--offline");

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

function runCli(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  // Use tsx to run the CLI directly
  const result = spawnSync("npx", ["tsx", "src/cli.ts", ...args], {
    cwd: process.cwd(),
    timeout: 120_000,
    encoding: "utf-8",
  });
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status ?? 1,
  };
}

interface EvalResult {
  name: string;
  topic: string;
  passed: boolean;
  skipped: boolean;
  skipReason?: string;
  exitCode: number;
  warnings: string[];
  outputSnippet: string;
  judgment: string;
  artifacts: string[];
}

function judgeOutput(topic: string, output: string): { passed: boolean; warnings: string[]; judgment: string } {
  const warnings: string[] = [];

  if (!output || output.trim().length === 0) {
    return { passed: false, warnings: ["Empty output"], judgment: "FAIL: No output produced" };
  }

  if (!output.includes(topic.slice(0, 10))) {
    warnings.push(`Topic "${topic}" not clearly present in output`);
  }

  if (output.includes("No results found")) {
    warnings.push("No results found");
    return { passed: false, warnings, judgment: "FAIL: No results for topic" };
  }

  if (!output.includes("KEY PATTERNS") && !output.includes("Ranked Evidence Clusters")) {
    warnings.push("Missing expected structure (KEY PATTERNS or Ranked Evidence Clusters)");
  }

  if (output.length < 50) {
    warnings.push("Output too short");
    return { passed: false, warnings, judgment: "FAIL: Output too short to be useful" };
  }

  // Check for fabricated content indicators
  if (output.includes("[object Object]") || output.includes("undefined") || output.includes("NaN")) {
    warnings.push("Output contains JavaScript artifacts");
    return { passed: false, warnings, judgment: "FAIL: Output contains rendering artifacts" };
  }

  const passed = warnings.length === 0;
  const judgment = passed
    ? "PASS: Output is well-structured with results"
    : `WARN: ${warnings.join("; ")}`;

  return { passed, warnings, judgment };
}

async function runEvals(): Promise<void> {
  ensureDir(EVAL_OUTPUT_DIR);
  const config = getConfig();
  const { from, to } = getDateRange(30);
  const timestamp = formatDate(new Date()).replace(/-/g, "");

  const results: EvalResult[] = [];

  // --- Zero-key eval (always runs) ---
  console.log("\n=== Zero-Key Eval: DuckDuckGo + No-Key Sources ===\n");
  const topic0 = "TypeScript 2026 features";
  const cli0 = runCli([topic0, "--format", "compact", "--depth", "quick"]);

  const zeroKeyDir = join(EVAL_OUTPUT_DIR, `zero-key-${timestamp}`);
  ensureDir(zeroKeyDir);
  writeFileSync(join(zeroKeyDir, "compact.md"), cli0.stdout);
  writeFileSync(join(zeroKeyDir, "stderr.txt"), cli0.stderr);

  const zeroKeyJudgment = judgeOutput(topic0, cli0.stdout);
  writeFileSync(join(zeroKeyDir, "judgment.md"), `# Eval Judgment: Zero-Key\n\n**Topic:** ${topic0}\n**Date:** ${formatDate(new Date())}\n**Passed:** ${zeroKeyJudgment.passed}\n\n## Judgment\n${zeroKeyJudgment.judgment}\n\n## Warnings\n${zeroKeyJudgment.warnings.join("\n") || "None"}\n\n## Command\n\`npx last30days "${topic0}" --format compact --depth quick\`\n`);

  results.push({
    name: "zero-key",
    topic: topic0,
    passed: zeroKeyJudgment.passed,
    skipped: false,
    exitCode: cli0.exitCode,
    warnings: zeroKeyJudgment.warnings,
    outputSnippet: cli0.stdout.slice(0, 500),
    judgment: zeroKeyJudgment.judgment,
    artifacts: [join(zeroKeyDir, "compact.md"), join(zeroKeyDir, "judgment.md")],
  });

  console.log(`  Zero-key eval: ${zeroKeyJudgment.passed ? "PASS" : "WARN"}`);

  // --- JSON output eval ---
  console.log("\n=== JSON Output Eval ===\n");
  const cliJson = runCli([topic0, "--format", "json", "--depth", "quick"]);

  const jsonDir = join(EVAL_OUTPUT_DIR, `json-${timestamp}`);
  ensureDir(jsonDir);
  writeFileSync(join(jsonDir, "output.json"), cliJson.stdout);
  writeFileSync(join(jsonDir, "stderr.txt"), cliJson.stderr);

  let jsonValid = false;
  try {
    JSON.parse(cliJson.stdout);
    jsonValid = true;
  } catch {
    // invalid JSON
  }

  writeFileSync(join(jsonDir, "judgment.md"), `# Eval Judgment: JSON Output\n\n**Topic:** ${topic0}\n**Valid JSON:** ${jsonValid}\n\n## Command\n\`npx last30days "${topic0}" --format json --depth quick\`\n`);

  results.push({
    name: "json-output",
    topic: topic0,
    passed: jsonValid,
    skipped: false,
    exitCode: cliJson.exitCode,
    warnings: jsonValid ? [] : ["Output is not valid JSON"],
    outputSnippet: cliJson.stdout.slice(0, 500),
    judgment: jsonValid ? "PASS: Valid JSON output" : "FAIL: Output is not valid JSON",
    artifacts: [join(jsonDir, "output.json"), join(jsonDir, "judgment.md")],
  });

  // --- Keyed evals (skip if credentials missing) ---
  if (!isOffline) {
    // Exa eval
    if (config.exaApiKey) {
      console.log("\n=== Keyed Eval: Exa ===\n");
      const cliExa = runCli(["AI agent frameworks 2026", "--format", "compact", "--depth", "quick"]);
      const exaDir = join(EVAL_OUTPUT_DIR, `exa-${timestamp}`);
      ensureDir(exaDir);
      writeFileSync(join(exaDir, "compact.md"), cliExa.stdout);
      writeFileSync(join(exaDir, "stderr.txt"), cliExa.stderr);
      const exaJudgment = judgeOutput("AI agent", cliExa.stdout);
      writeFileSync(join(exaDir, "judgment.md"), `# Eval Judgment: Exa\n\n**Passed:** ${exaJudgment.passed}\n\n## Judgment\n${exaJudgment.judgment}\n`);
      results.push({ name: "exa", topic: "AI agent frameworks 2026", passed: exaJudgment.passed, skipped: false, exitCode: cliExa.exitCode, warnings: exaJudgment.warnings, outputSnippet: cliExa.stdout.slice(0, 500), judgment: exaJudgment.judgment, artifacts: [join(exaDir, "compact.md")] });
      console.log(`  Exa eval: ${exaJudgment.passed ? "PASS" : "WARN"}`);
    } else {
      console.log("\n  Exa eval: SKIPPED (no EXA_API_KEY)");
      results.push({ name: "exa", topic: "", passed: false, skipped: true, skipReason: "EXA_API_KEY not configured", exitCode: 0, warnings: [], outputSnippet: "", judgment: "SKIPPED", artifacts: [] });
    }

    // X eval
    if (config.xaiApiKey || config.grokApiKey) {
      console.log("\n=== Keyed Eval: X/Twitter via xAI ===\n");
      const cliX = runCli(["AI news this week", "--format", "compact", "--depth", "quick"]);
      const xDir = join(EVAL_OUTPUT_DIR, `x-${timestamp}`);
      ensureDir(xDir);
      writeFileSync(join(xDir, "compact.md"), cliX.stdout);
      writeFileSync(join(xDir, "stderr.txt"), cliX.stderr);
      const xJudgment = judgeOutput("AI", cliX.stdout);
      writeFileSync(join(xDir, "judgment.md"), `# Eval Judgment: X\n\n**Passed:** ${xJudgment.passed}\n\n## Judgment\n${xJudgment.judgment}\n`);
      results.push({ name: "x", topic: "AI news this week", passed: xJudgment.passed, skipped: false, exitCode: cliX.exitCode, warnings: xJudgment.warnings, outputSnippet: cliX.stdout.slice(0, 500), judgment: xJudgment.judgment, artifacts: [join(xDir, "compact.md")] });
      console.log(`  X eval: ${xJudgment.passed ? "PASS" : "WARN"}`);
    } else {
      console.log("\n  X eval: SKIPPED (no XAI_API_KEY or GROK_API_KEY)");
      results.push({ name: "x", topic: "", passed: false, skipped: true, skipReason: "XAI_API_KEY/GROK_API_KEY not configured", exitCode: 0, warnings: [], outputSnippet: "", judgment: "SKIPPED", artifacts: [] });
    }

    // OpenRouter/Perplexity eval
    if (config.openrouterApiKey) {
      console.log("\n=== Keyed Eval: OpenRouter/Perplexity ===\n");
      const cliPerp = runCli(["latest AI research papers", "--format", "compact", "--depth", "quick"]);
      const perpDir = join(EVAL_OUTPUT_DIR, `perplexity-${timestamp}`);
      ensureDir(perpDir);
      writeFileSync(join(perpDir, "compact.md"), cliPerp.stdout);
      writeFileSync(join(perpDir, "stderr.txt"), cliPerp.stderr);
      const perpJudgment = judgeOutput("AI", cliPerp.stdout);
      writeFileSync(join(perpDir, "judgment.md"), `# Eval Judgment: Perplexity\n\n**Passed:** ${perpJudgment.passed}\n\n## Judgment\n${perpJudgment.judgment}\n`);
      results.push({ name: "perplexity", topic: "latest AI research", passed: perpJudgment.passed, skipped: false, exitCode: cliPerp.exitCode, warnings: perpJudgment.warnings, outputSnippet: cliPerp.stdout.slice(0, 500), judgment: perpJudgment.judgment, artifacts: [join(perpDir, "compact.md")] });
      console.log(`  Perplexity eval: ${perpJudgment.passed ? "PASS" : "WARN"}`);
    } else {
      console.log("\n  Perplexity eval: SKIPPED (no OPENROUTER_API_KEY)");
      results.push({ name: "perplexity", topic: "", passed: false, skipped: true, skipReason: "OPENROUTER_API_KEY not configured", exitCode: 0, warnings: [], outputSnippet: "", judgment: "SKIPPED", artifacts: [] });
    }

    // Brave eval
    if (config.braveApiKey) {
      console.log("\n=== Keyed Eval: Brave ===\n");
      const cliBrave = runCli(["climate tech startups 2026", "--format", "compact", "--depth", "quick"]);
      // ... similar pattern
      console.log("  Brave eval: ran");
    } else {
      console.log("\n  Brave eval: SKIPPED (no BRAVE_API_KEY)");
      results.push({ name: "brave", topic: "", passed: false, skipped: true, skipReason: "BRAVE_API_KEY not configured", exitCode: 0, warnings: [], outputSnippet: "", judgment: "SKIPPED", artifacts: [] });
    }
  }

  // --- Summary ---
  console.log("\n=== Eval Summary ===\n");
  const summaryPath = join(EVAL_OUTPUT_DIR, `summary-${timestamp}.md`);
  const passedCount = results.filter(r => r.passed).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const failedCount = results.filter(r => !r.passed && !r.skipped).length;

  let summary = `# Eval Summary\n\n**Date:** ${formatDate(new Date())}\n**Date Range:** ${from} to ${to}\n**Offline Mode:** ${isOffline}\n\n## Results\n\n`;
  summary += `| Eval | Topic | Status | Judgment |\n`;
  summary += `|------|-------|--------|----------|\n`;

  for (const r of results) {
    const status = r.skipped ? "SKIPPED" : r.passed ? "PASS" : "FAIL";
    summary += `| ${r.name} | ${r.topic || "-"} | ${status} | ${r.judgment} |\n`;
  }

  summary += `\n## Summary\n\n- **Passed:** ${passedCount}\n- **Failed:** ${failedCount}\n- **Skipped:** ${skippedCount}\n\n`;
  summary += `To enable more evals, copy \`.env.example\` to \`.env\` and fill in source-specific keys.\n`;

  writeFileSync(summaryPath, summary);
  console.log(summary);
  console.log(`Eval artifacts written to ${EVAL_OUTPUT_DIR}/`);
}

runEvals().catch(err => {
  console.error("Eval runner error:", err);
  process.exit(1);
});
