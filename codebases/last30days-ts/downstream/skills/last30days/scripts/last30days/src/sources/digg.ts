import { spawnSync } from "node:child_process";
import type { SourceItem } from "../schema.js";
import { getDateConfidence } from "../dates.js";

interface DiggRecord {
  id?: string;
  title?: string;
  url?: string;
  body?: string;
  snippet?: string;
  author?: string;
  date?: string;
  published_at?: string;
  score?: number;
  quotes?: Array<{ text?: string; author?: string }>;
}

const DEPTH_LIMITS: Record<string, number> = { quick: 5, medium: 10, deep: 20 };

function parseJsonLines(raw: string): DiggRecord[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed) as DiggRecord[] | { items?: DiggRecord[]; results?: DiggRecord[] };
    if (Array.isArray(parsed)) return parsed;
    return parsed.items || parsed.results || [];
  } catch {
    return trimmed.split("\n").flatMap((line) => {
      try {
        return [JSON.parse(line) as DiggRecord];
      } catch {
        return [];
      }
    });
  }
}

export async function searchDigg(query: string, fromDate: string, toDate: string, depth: string): Promise<SourceItem[]> {
  const limit = DEPTH_LIMITS[depth] || DEPTH_LIMITS.medium;
  const available = spawnSync("digg-pp-cli", ["--help"], { encoding: "utf-8", timeout: 5000 });
  if (available.error) return [];

  const result = spawnSync("digg-pp-cli", ["search", query, "--json", "--limit", String(limit)], {
    encoding: "utf-8",
    timeout: 60_000,
  });
  if (result.status !== 0 || !result.stdout.trim()) return [];

  return parseJsonLines(result.stdout).slice(0, limit).map((record, index) => {
    const publishedAt = record.published_at || record.date || new Date().toISOString();
    const quoteText = record.quotes?.map((quote) => quote.text).filter(Boolean).join("\n") || "";
    const body = record.body || record.snippet || quoteText || "";
    return {
      item_id: record.id || `digg-${index + 1}`,
      source: "digg",
      title: record.title || `Digg result for ${query}`,
      body,
      url: record.url || "https://digg.com/ai",
      author: record.author || "",
      container: "Digg AI 1000",
      published_at: publishedAt,
      date_confidence: getDateConfidence(publishedAt, fromDate, toDate),
      engagement: { score: record.score || 0 },
      score: 0,
      snippet: (record.snippet || body || record.title || "").slice(0, 300),
      metadata: { quotes: record.quotes || [], command: "digg-pp-cli" },
    } satisfies SourceItem;
  });
}
