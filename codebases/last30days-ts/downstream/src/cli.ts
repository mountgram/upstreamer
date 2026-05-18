#!/usr/bin/env node
import { research, renderBrief, saveBrief } from "./index.js";
import { defaultOutputDir } from "./config.js";

interface CliArgs { topic: string; lookbackDays: number; limit: number; format: "markdown" | "json"; outputDir?: string; debug: boolean; save: boolean; webBackend: "auto" | "duckduckgo" | "exa" | "brave" | "serper" | "parallel" | "none" }

function parseArgs(argv: string[]): CliArgs {
  const args = [...argv];
  const topicParts: string[] = [];
  const parsed: CliArgs = { topic: "", lookbackDays: 30, limit: 10, format: "markdown", debug: false, save: false, webBackend: "auto" };
  while (args.length) {
    const arg = args.shift()!;
    if (arg === "--lookback" || arg === "--lookback-days") parsed.lookbackDays = Number(args.shift());
    else if (arg === "--limit" || arg === "--depth") parsed.limit = Number(args.shift());
    else if (arg === "--format") parsed.format = args.shift() === "json" ? "json" : "markdown";
    else if (arg === "--output-dir") parsed.outputDir = args.shift();
    else if (arg === "--debug" || arg === "--status") parsed.debug = true;
    else if (arg === "--save") parsed.save = true;
    else if (arg === "--web-backend") parsed.webBackend = (args.shift() || "auto") as CliArgs["webBackend"];
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: last30days <topic> [--lookback-days 30] [--limit 10] [--format markdown|json] [--output-dir DIR] [--save] [--debug]");
      process.exit(0);
    } else topicParts.push(arg);
  }
  parsed.topic = topicParts.join(" ").trim();
  if (!parsed.topic) throw new Error("A topic is required.");
  return parsed;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const brief = await research(args);
  const rendered = await renderBrief(brief, args.format);
  process.stdout.write(rendered);
  if (args.save && args.format === "markdown") {
    const path = await saveBrief(brief, rendered, args.outputDir || defaultOutputDir());
    if (args.debug) process.stderr.write(`saved ${path}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
