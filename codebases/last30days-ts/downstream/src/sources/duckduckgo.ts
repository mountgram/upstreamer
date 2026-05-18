import { search, SafeSearchType } from "duck-duck-scrape";
import type { SourceItem } from "../schema.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function isWithinDateRange(
  itemDate: Date | null,
  fromDate: string,
  toDate: string
): boolean {
  if (!itemDate) return true;
  const from = new Date(fromDate);
  const to = new Date(toDate);
  return itemDate >= from && itemDate <= to;
}

export async function searchDuckDuckGo(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string
): Promise<SourceItem[]> {
  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const result = await search(query, {
    safeSearch: SafeSearchType.OFF,
  });

  const items: SourceItem[] = [];

  for (const r of result.results) {
    const url = r.url;
    if (!url) continue;

    const publishedDate: Date | null = null;
    // DuckDuckGo results don't carry dates reliably; use current date
    const publishedAt = new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = publishedDate ? "high" : "low";

    items.push({
      item_id: url,
      source: "duckduckgo",
      title: r.title || "",
      body: r.description || "",
      url,
      author: "",
      container: hostname(url),
      published_at: publishedAt,
      date_confidence: "low",
      engagement: {},
      score: 0,
      snippet: r.description || "",
      metadata: {},
    });

    if (items.length >= limit) break;
  }

  return items;
}
