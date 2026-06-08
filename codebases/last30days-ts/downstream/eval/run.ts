#!/usr/bin/env node
/**
 * Live eval runner for last30days-ts.
 * Runs evals against real (or mocked) sources and writes artifacts to eval-output/.
 *
 * Usage:
 *   cd skills/last30days/scripts/last30days
 *   bunx tsx ../../../../eval/run.ts          Run all available evals
 *   bunx tsx ../../../../eval/run.ts --offline Run only non-network smoke evals
 */

import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { getConfig } from "../skills/last30days/scripts/last30days/src/config.js";
import { getDateRange, formatDate } from "../skills/last30days/scripts/last30days/src/dates.js";

const DOWNSTREAM_DIR = resolve(process.cwd(), "../../../..");
const EVAL_OUTPUT_DIR = resolve(DOWNSTREAM_DIR, "eval-output");
const isOffline = process.argv.includes("--offline");

function ensureDir(dir: string) {
  mkdirSync(dir, { recursive: true });
}

const OPTIONAL_SOURCE_ENV_KEYS = [
  "EXA_API_KEY",
  "BRAVE_API_KEY",
  "SERPER_API_KEY",
  "PARALLEL_API_KEY",
  "OPENROUTER_API_KEY",
  "XAI_API_KEY",
  "GROK_API_KEY",
  "BSKY_HANDLE",
  "BSKY_APP_PASSWORD",
  "TRUTHSOCIAL_TOKEN",
  "SCRAPECREATORS_API_KEY",
  "APIFY_API_TOKEN",
  "GITHUB_TOKEN",
];

function withOnlySearchEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of OPTIONAL_SOURCE_ENV_KEYS) {
    if (key === "EXA_API_KEY" || key === "BRAVE_API_KEY") continue;
    delete env[key];
  }
  return env;
}

function runCli(args: string[], env?: NodeJS.ProcessEnv): { stdout: string; stderr: string; exitCode: number } {
  // Run the bundled TypeScript CLI directly with Bun from scripts/last30days.
  const result = spawnSync("bun", ["run", "src/cli.ts", ...args], {
    cwd: process.cwd(),
    env: env || process.env,
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

function resultStatus(result: EvalResult): "PASS" | "WARN" | "FAIL" | "SKIPPED" {
  if (result.skipped) return "SKIPPED";
  if (result.passed) return "PASS";
  return result.judgment.startsWith("WARN:") ? "WARN" : "FAIL";
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

  if (/Total items:\s*0\b/i.test(output) || /Clusters:\s*0\b/i.test(output)) {
    warnings.push("No evidence items or clusters");
    return { passed: false, warnings, judgment: "FAIL: No evidence items or clusters" };
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

function hasSource(output: string, sourceLabel: string): boolean {
  return output.toLowerCase().includes(sourceLabel.toLowerCase());
}

async function runEvals(): Promise<void> {
  ensureDir(EVAL_OUTPUT_DIR);
  const config = getConfig();
  const { from, to } = getDateRange(30);
  const timestamp = formatDate(new Date()).replace(/-/g, "");

  const results: EvalResult[] = [];

  // --- Web-search eval (required baseline; Exa preferred, Brave fallback) ---
  console.log("\n=== Web Search Eval ===\n");
  const topic0 = "TypeScript Go compiler Project Corsa";
  const webSearchEnv = withOnlySearchEnv();
  const baselineSource = webSearchEnv.EXA_API_KEY ? "exa" : webSearchEnv.BRAVE_API_KEY ? "brave" : "";
  const cli0 = baselineSource
    ? runCli([topic0, "--format", "compact", "--depth", "quick", "--lookback", "37", "--include-sources", baselineSource], webSearchEnv)
    : { stdout: "", stderr: "Missing EXA_API_KEY or BRAVE_API_KEY", exitCode: 1 };

  const zeroKeyDir = join(EVAL_OUTPUT_DIR, `web-search-${timestamp}`);
  ensureDir(zeroKeyDir);
  writeFileSync(join(zeroKeyDir, "compact.md"), cli0.stdout);
  writeFileSync(join(zeroKeyDir, "stderr.txt"), cli0.stderr);

  let zeroKeyJudgment = baselineSource
    ? judgeOutput(topic0, cli0.stdout)
    : { passed: false, warnings: ["Missing EXA_API_KEY or BRAVE_API_KEY"], judgment: "FAIL: EXA_API_KEY or BRAVE_API_KEY is required for web-search eval" };
  if (zeroKeyJudgment.passed && !hasSource(cli0.stdout, "Web")) {
    zeroKeyJudgment = { passed: false, warnings: [`${baselineSource} produced no web results`], judgment: "FAIL: Web search did not produce inspectable results" };
  }
  writeFileSync(join(zeroKeyDir, "judgment.md"), `# Eval Judgment: Web Search\n\n**Topic:** ${topic0}\n**Source:** ${baselineSource || "none"}\n**Date:** ${formatDate(new Date())}\n**Passed:** ${zeroKeyJudgment.passed}\n\n## Judgment\n${zeroKeyJudgment.judgment}\n\n## Warnings\n${zeroKeyJudgment.warnings.join("\n") || "None"}\n\n## Command\n\`bun run last30days -- "${topic0}" --format compact --depth quick --lookback 37 --include-sources ${baselineSource || "exa"}\`\n`);

  results.push({
    name: "web-search",
    topic: topic0,
    passed: zeroKeyJudgment.passed,
    skipped: false,
    exitCode: cli0.exitCode,
    warnings: zeroKeyJudgment.warnings,
    outputSnippet: cli0.stdout.slice(0, 500),
    judgment: zeroKeyJudgment.judgment,
    artifacts: [join(zeroKeyDir, "compact.md"), join(zeroKeyDir, "judgment.md")],
  });

  console.log(`  Web search eval: ${zeroKeyJudgment.passed ? "PASS" : "FAIL"}`);

  // --- JSON output eval ---
  console.log("\n=== JSON Output Eval ===\n");
  const cliJson = baselineSource
    ? runCli([topic0, "--format", "json", "--depth", "quick", "--lookback", "37", "--include-sources", baselineSource], webSearchEnv)
    : { stdout: "", stderr: "Missing EXA_API_KEY or BRAVE_API_KEY", exitCode: 1 };

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

  writeFileSync(join(jsonDir, "judgment.md"), `# Eval Judgment: JSON Output\n\n**Topic:** ${topic0}\n**Valid JSON:** ${jsonValid}\n\n## Command\n\`bun run last30days -- "${topic0}" --format json --depth quick --lookback 37 --include-sources ${baselineSource || "exa"}\`\n`);

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
    // X eval
    if (config.xaiApiKey || config.grokApiKey) {
      console.log("\n=== Keyed Eval: X/Twitter via xAI ===\n");
      const cliX = runCli(["AI news this week", "--format", "compact", "--depth", "quick", "--debug", "--include-sources", "x"]);
      const xDir = join(EVAL_OUTPUT_DIR, `x-${timestamp}`);
      ensureDir(xDir);
      writeFileSync(join(xDir, "compact.md"), cliX.stdout);
      writeFileSync(join(xDir, "stderr.txt"), cliX.stderr);
      let xJudgment = judgeOutput("AI", cliX.stdout);
      if (!hasSource(cliX.stdout, "X:")) {
        xJudgment = { passed: false, warnings: ["X adapter produced no X items"], judgment: "WARN: X source did not produce inspectable results" };
      }
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
      const cliPerp = runCli(["latest AI research papers", "--format", "compact", "--depth", "quick", "--debug", "--include-sources", "perplexity"]);
      const perpDir = join(EVAL_OUTPUT_DIR, `perplexity-${timestamp}`);
      ensureDir(perpDir);
      writeFileSync(join(perpDir, "compact.md"), cliPerp.stdout);
      writeFileSync(join(perpDir, "stderr.txt"), cliPerp.stderr);
      let perpJudgment = judgeOutput("AI", cliPerp.stdout);
      if (!hasSource(cliPerp.stdout, "Perplexity")) {
        perpJudgment = { passed: false, warnings: ["Perplexity adapter produced no Perplexity items"], judgment: "WARN: Perplexity source did not produce inspectable results" };
      }
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
      const cliBrave = runCli(["AI agent frameworks 2026", "--format", "compact", "--depth", "quick", "--debug", "--include-sources", "brave"]);
      const braveDir = join(EVAL_OUTPUT_DIR, `brave-${timestamp}`);
      ensureDir(braveDir);
      writeFileSync(join(braveDir, "compact.md"), cliBrave.stdout);
      writeFileSync(join(braveDir, "stderr.txt"), cliBrave.stderr);
      let braveJudgment = judgeOutput("AI agent", cliBrave.stdout);
      if (!hasSource(cliBrave.stdout, "Web")) {
        braveJudgment = { passed: false, warnings: ["Brave adapter produced no web items"], judgment: "WARN: Brave source did not produce inspectable results" };
      }
      writeFileSync(join(braveDir, "judgment.md"), `# Eval Judgment: Brave\n\n**Passed:** ${braveJudgment.passed}\n\n## Judgment\n${braveJudgment.judgment}\n`);
      results.push({ name: "brave", topic: "AI agent frameworks 2026", passed: braveJudgment.passed, skipped: false, exitCode: cliBrave.exitCode, warnings: braveJudgment.warnings, outputSnippet: cliBrave.stdout.slice(0, 500), judgment: braveJudgment.judgment, artifacts: [join(braveDir, "compact.md")] });
      console.log(`  Brave eval: ${braveJudgment.passed ? "PASS" : "WARN"}`);
    } else {
      console.log("\n  Brave eval: SKIPPED (no BRAVE_API_KEY)");
      results.push({ name: "brave", topic: "", passed: false, skipped: true, skipReason: "BRAVE_API_KEY not configured", exitCode: 0, warnings: [], outputSnippet: "", judgment: "SKIPPED", artifacts: [] });
    }
  }

  // --- Summary ---
  console.log("\n=== Eval Summary ===\n");
  const summaryPath = join(EVAL_OUTPUT_DIR, `summary-${timestamp}.md`);
  const passedCount = results.filter(r => resultStatus(r) === "PASS").length;
  const warningCount = results.filter(r => resultStatus(r) === "WARN").length;
  const skippedCount = results.filter(r => resultStatus(r) === "SKIPPED").length;
  const failedCount = results.filter(r => resultStatus(r) === "FAIL").length;

  let summary = `# Eval Summary\n\n**Date:** ${formatDate(new Date())}\n**Date Range:** ${from} to ${to}\n**Offline Mode:** ${isOffline}\n\n## Results\n\n`;
  summary += `| Eval | Topic | Status | Judgment |\n`;
  summary += `|------|-------|--------|----------|\n`;

  for (const r of results) {
    const status = resultStatus(r);
    summary += `| ${r.name} | ${r.topic || "-"} | ${status} | ${r.judgment} |\n`;
  }

  summary += `\n## Summary\n\n- **Passed:** ${passedCount}\n- **Warnings:** ${warningCount}\n- **Failed:** ${failedCount}\n- **Skipped:** ${skippedCount}\n\n`;
  summary += `To enable more evals, copy \`.env.example\` to \`.env\` and fill in source-specific keys.\n`;

  writeFileSync(summaryPath, summary);
  console.log(summary);
  console.log(`Eval artifacts written to ${EVAL_OUTPUT_DIR}/`);
}

runEvals().catch(err => {
  console.error("Eval runner error:", err);
  process.exit(1);
});
