import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultOutputDir } from "./config.js";
import { startOfLookback } from "./dates.js";
import { clusterItems, itemMatchesTopic } from "./ranking.js";
import { renderJson, renderMarkdown } from "./render.js";
import type { EvidenceItem, QueryPlan, ResearchBrief, ResearchOptions, SourceAdapter, SourceRun } from "./schema.js";
import { allAdapters } from "./sources/index.js";

export * from "./schema.js";
export * from "./dates.js";
export * from "./ranking.js";
export * from "./render.js";

export function planQuery(topic: string): QueryPlan {
  const trimmed = topic.trim();
  const subqueries = [...new Set([
    trimmed,
    `${trimmed} news`,
    `${trimmed} reddit discussion`,
    `${trimmed} github`,
    `${trimmed} youtube`
  ])];
  return { topic: trimmed, subqueries };
}

async function available(adapter: SourceAdapter, env: NodeJS.ProcessEnv): Promise<boolean> {
  return await adapter.isAvailable(env);
}

export async function research(options: ResearchOptions, adapters: SourceAdapter[] = allAdapters): Promise<ResearchBrief> {
  const now = options.now || new Date();
  const lookbackDays = options.lookbackDays || 30;
  const since = startOfLookback(now, lookbackDays);
  const limit = options.limit || 10;
  const plan = planQuery(options.topic);
  const selectedAdapters = filterAdapters(adapters, options.webBackend || "auto");
  const runs: SourceRun[] = [];
  const warnings: string[] = [];
  const items: EvidenceItem[] = [];

  await Promise.all(selectedAdapters.map(async (adapter) => {
    try {
      const isReady = await available(adapter, process.env);
      if (!isReady) {
        runs.push({ source: adapter.name, status: "skipped", itemCount: 0, message: `optional adapter unavailable${adapter.needs?.length ? `: ${adapter.needs.join(", ")}` : ""}` });
        return;
      }
      const found = await adapter.search({ topic: options.topic, plan, since, limit, debug: Boolean(options.debug), env: process.env });
      const relevant = found.filter((item) => itemMatchesTopic(item, options.topic));
      if (found.length && !relevant.length) warnings.push(`${adapter.name} returned only off-topic evidence and was filtered.`);
      items.push(...relevant);
      runs.push({ source: adapter.name, status: "ok", itemCount: found.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`${adapter.name} failed: ${message}`);
      runs.push({ source: adapter.name, status: "failed", itemCount: 0, message });
    }
  }));

  if (!items.length) warnings.push("No source returned evidence. Configure an optional source or try a broader topic.");

  return {
    topic: options.topic,
    generatedAt: now.toISOString(),
    lookbackDays,
    plan,
    items,
    clusters: clusterItems(items, options.topic, now),
    runs: runs.sort((a, b) => a.source.localeCompare(b.source)),
    warnings
  };
}

function filterAdapters(adapters: SourceAdapter[], webBackend: ResearchOptions["webBackend"]): SourceAdapter[] {
  if (!webBackend || webBackend === "auto") return adapters;
  const webSources = new Set(["duckduckgo", "exa", "brave", "serper", "parallel"]);
  if (webBackend === "none") return adapters.filter((adapter) => !webSources.has(adapter.name));
  return adapters.filter((adapter) => !webSources.has(adapter.name) || adapter.name === webBackend);
}

export async function renderBrief(brief: ResearchBrief, format: "markdown" | "json" = "markdown"): Promise<string> {
  return format === "json" ? renderJson(brief) : renderMarkdown(brief);
}

export async function saveBrief(brief: ResearchBrief, rendered: string, outputDir = defaultOutputDir()): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const slug = brief.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "last30days";
  const path = join(outputDir, `${slug}-brief.md`);
  await writeFile(path, rendered, "utf8");
  return path;
}
