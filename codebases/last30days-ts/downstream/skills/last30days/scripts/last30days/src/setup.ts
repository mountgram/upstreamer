import { getConfig, type Config } from "./config.js";
import { spawnSync } from "node:child_process";

export interface SourceStatus {
  source: string;
  available: boolean;
  key: string | null;
  method: string;
}

export function diagnose(): SourceStatus[] {
  const config = getConfig();
  const results: SourceStatus[] = [];
  const hasDigg = !spawnSync("digg-pp-cli", ["--help"], { encoding: "utf-8", timeout: 5000 }).error;

  results.push({ source: "reddit", available: true, key: null, method: "keyless JSON/RSS public access" });
  results.push({ source: "hackernews", available: true, key: null, method: "Algolia public API" });
  results.push({ source: "polymarket", available: true, key: null, method: "public API" });
  results.push({ source: "github", available: true, key: config.githubToken || null, method: config.githubToken ? "authenticated API" : "unauthenticated API" });

  results.push({ source: "exa", available: !!config.exaApiKey, key: config.exaApiKey ? "EXA_API_KEY" : null, method: "preferred reliable web search via Exa SDK" });
  results.push({ source: "brave", available: !!config.braveApiKey, key: config.braveApiKey ? "BRAVE_API_KEY" : null, method: "alternative/fallback web search via Brave Search API" });
  results.push({ source: "serper", available: !!config.serperApiKey, key: config.serperApiKey ? "SERPER_API_KEY" : null, method: "Serper API" });
  results.push({ source: "parallel", available: !!config.parallelApiKey, key: config.parallelApiKey ? "PARALLEL_API_KEY" : null, method: "Parallel API" });

  results.push({ source: "x", available: !!config.xaiApiKey, key: config.xaiApiKey ? "XAI_API_KEY/GROK_API_KEY" : null, method: "xAI Grok API" });
  results.push({ source: "perplexity", available: !!config.openrouterApiKey, key: config.openrouterApiKey ? "OPENROUTER_API_KEY" : null, method: "OpenRouter API" });
  results.push({ source: "youtube", available: true, key: null, method: "yt-dlp binary (optional)" });

  results.push({ source: "bluesky", available: !!(config.bskyHandle && config.bskyAppPassword), key: config.bskyHandle ? "BSKY_HANDLE/BSKY_APP_PASSWORD" : null, method: "AT Protocol" });
  results.push({ source: "truthsocial", available: !!config.truthsocialToken, key: config.truthsocialToken ? "TRUTHSOCIAL_TOKEN" : null, method: "Truth Social API" });

  const scAvail = !!config.scrapecreatorsApiKey;
  results.push({ source: "tiktok", available: scAvail, key: scAvail ? "SCRAPECREATORS_API_KEY" : null, method: "ScrapeCreators API" });
  results.push({ source: "instagram", available: scAvail, key: scAvail ? "SCRAPECREATORS_API_KEY" : null, method: "ScrapeCreators API" });
  results.push({ source: "threads", available: scAvail, key: scAvail ? "SCRAPECREATORS_API_KEY" : null, method: "ScrapeCreators API" });
  results.push({ source: "pinterest", available: scAvail, key: scAvail ? "SCRAPECREATORS_API_KEY" : null, method: "ScrapeCreators API" });

  results.push({ source: "digg", available: hasDigg, key: null, method: "digg-pp-cli binary" });

  return results;
}

export function printSetup(): void {
  const config = getConfig();
  console.log("Last30Days TS — Source Availability\n");

  for (const status of diagnose()) {
    const marker = status.available ? "✅" : "⚠️";
    const keyInfo = status.key ? ` (${status.key})` : "";
    console.log(`  ${marker} ${status.source}: ${status.method}${keyInfo}`);
  }

  console.log("\nConfigure keys by setting environment variables or copying .env.example to .env.");
  console.log("Copy: cp .env.example .env");
}
