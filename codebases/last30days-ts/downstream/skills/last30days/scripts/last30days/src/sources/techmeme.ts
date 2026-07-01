import { spawnSync } from "node:child_process";
import type { SourceItem } from "../schema.js";

const CLI_BIN = "techmeme-pp-cli";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 8,
  medium: 16,
  deep: 30,
};

const MIN_HEADLINE_WORDS = 4;

let lastSync = 0;
const SYNC_TTL = 600_000;

function isAvailable(): boolean {
  try {
    spawnSync("which", [CLI_BIN], { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function techmemeAvailable(): boolean {
  return isAvailable();
}

function ensureSynced(): void {
  if (!isAvailable()) return;
  if (Date.now() - lastSync < SYNC_TTL) return;
  lastSync = Date.now();
  try {
    spawnSync(CLI_BIN, ["sync", "--agent"], { timeout: 40_000 });
  } catch {
    // best-effort sync; search can still run on an existing cache
  }
}

function isStoryHeadline(headline: string, source: string): boolean {
  if (!headline) return false;
  if (headline.split(" ").length < MIN_HEADLINE_WORDS) return false;
  if (source && headline.trim().toLowerCase() === source.trim().toLowerCase()) return false;
  return true;
}

export async function searchTechmeme(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string
): Promise<SourceItem[]> {
  if (!isAvailable()) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  if (!query.trim()) return [];

  ensureSynced();

  try {
    const result = spawnSync(
      CLI_BIN,
      ["search", query, "--json"],
      {
        encoding: "utf-8",
        timeout: 30_000,
      }
    );

    if (result.status !== 0 || !result.stdout?.trim()) return [];

    const data = JSON.parse(result.stdout) as TechmemeRecord[] | { results?: TechmemeRecord[] };
    const records: TechmemeRecord[] = Array.isArray(data)
      ? data
      : (data.results || []);

    const today = new Date().toISOString().slice(0, 10);

    return records
      .filter((r) => {
        if (typeof r !== "object" || !r) return false;
        const headline = String(r.headline || "").replace(/\s+/g, " ").trim();
        const sourceName = String(r.source || "").trim();
        if (!isStoryHeadline(headline, sourceName)) return false;
        return !!r.link;
      })
      .slice(0, limit)
      .map((rec) => {
        const headline = String(rec.headline || "").replace(/\s+/g, " ").trim();
        const sourceName = String(rec.source || "").trim();
        const link = String(rec.link || "").trim();

        return {
          item_id: link,
          source: "techmeme",
          title: headline,
          body: "",
          url: link,
          author: sourceName,
          container: "Techmeme",
          published_at: today,
          date_confidence: "med" as const,
          engagement: {},
          score: 0,
          snippet: headline,
          metadata: { source_name: sourceName },
        } satisfies SourceItem;
      });
  } catch {
    return [];
  }
}

interface TechmemeRecord {
  headline?: string;
  source?: string;
  link?: string;
}
