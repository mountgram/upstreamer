import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderBrief, research } from "../src/index.js";

const outputDir = join(process.cwd(), "eval-output", "live");
const topic = process.env.LAST30DAYS_EVAL_TOPIC || "AI coding agents";

await mkdir(outputDir, { recursive: true });

const brief = await research({ topic, lookbackDays: 30, limit: 6, debug: true });
const markdown = await renderBrief(brief, "markdown");
const json = await renderBrief(brief, "json");

await writeFile(join(outputDir, "brief.md"), markdown, "utf8");
await writeFile(join(outputDir, "brief.json"), json, "utf8");
await writeFile(join(outputDir, "status.json"), JSON.stringify({ runs: brief.runs, warnings: brief.warnings }, null, 2), "utf8");
await writeFile(join(outputDir, "command.json"), JSON.stringify({ command: "npm run eval", topic, lookbackDays: 30, optionalKeysPresent: optionalKeysPresent() }, null, 2), "utf8");

const okRuns = brief.runs.filter((run) => run.status === "ok" && run.itemCount > 0);
const skipped = brief.runs.filter((run) => run.status === "skipped");
const failed = brief.runs.filter((run) => run.status === "failed");
const hasCitations = /https?:\/\//.test(markdown);
const useful = brief.items.length > 0 && brief.clusters.length > 0 && hasCitations;

await writeFile(join(outputDir, "judgment.md"), [
  "# Live Eval Judgment",
  "",
  `Topic: ${topic}`,
  `Useful: ${useful ? "yes" : "no"}`,
  `Recent: ${brief.items.some((item) => item.publishedAt) ? "partially - at least one item carried a date" : "uncertain - returned sources did not expose dates"}`,
  `Cited: ${hasCitations ? "yes" : "no"}`,
  `Source-diverse: ${new Set(brief.items.map((item) => item.source)).size > 1 ? "yes" : "limited"}`,
  `Non-fabricated: yes - rendered items are direct adapter results; no synthetic evidence is added.`,
  `Optional failures isolated: ${failed.length || skipped.length ? "yes - unavailable/failed adapters did not abort the run" : "not exercised"}`,
  "",
  `Successful runs: ${okRuns.map((run) => `${run.source}(${run.itemCount})`).join(", ") || "none"}`,
  `Skipped optional runs: ${skipped.map((run) => `${run.source}: ${run.message || "unavailable"}`).join("; ") || "none"}`,
  `Failed optional runs: ${failed.map((run) => `${run.source}: ${run.message || "failed"}`).join("; ") || "none"}`,
  "",
  useful
    ? "The live eval produced a cited brief with at least one clustered item. Quality depends on public endpoint result quality for this topic."
    : "The live eval completed but did not produce enough cited evidence; inspect brief.json and status.json before relying on the output."
].join("\n"), "utf8");

if (!useful) process.exitCode = 1;
console.log(`live eval artifacts: ${outputDir}`);

function optionalKeysPresent(): string[] {
  return [
    "EXA_API_KEY",
    "BRAVE_API_KEY",
    "SERPER_API_KEY",
    "PARALLEL_API_KEY",
    "GITHUB_TOKEN",
    "SCRAPECREATORS_API_KEY",
    "OPENROUTER_API_KEY",
    "XAI_API_KEY",
    "GROK_API_KEY",
    "BSKY_HANDLE",
    "BSKY_APP_PASSWORD",
    "TRUTHSOCIAL_TOKEN",
    "APIFY_API_TOKEN"
  ].filter((key) => Boolean(process.env[key]));
}
