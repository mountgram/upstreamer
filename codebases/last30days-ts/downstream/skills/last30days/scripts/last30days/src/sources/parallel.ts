import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const BASE_URL = "https://api.parallel.ai/search";

export async function searchParallel(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.parallelApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const response = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.parallelApiKey}`,
    },
    body: JSON.stringify({ query, count: limit }),
  });

  if (!response.ok) {
    throw new Error(`Parallel API returned ${response.status}`);
  }

  const data = await response.json();
  const results: unknown[] = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

  const items: SourceItem[] = [];

  for (const r of results) {
    const rec = r as Record<string, unknown>;
    const urlStr = String(rec.url ?? rec.link ?? "");
    if (!urlStr) continue;

    const title = String(rec.title ?? "");
    const body = String(rec.body ?? rec.text ?? rec.snippet ?? rec.content ?? "");
    const author = String(rec.author ?? rec.source ?? "");
    const publishedAt = rec.published_at
      ? new Date(String(rec.published_at)).toISOString()
      : rec.date
        ? new Date(String(rec.date)).toISOString()
        : new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = rec.published_at || rec.date ? "high" : "low";

    items.push({
      item_id: rec.id ? String(rec.id) : urlStr,
      source: "parallel",
      title,
      body,
      url: urlStr,
      author,
      container: "parallel",
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: {},
      score: typeof rec.score === "number" ? rec.score : 0,
      snippet: String(rec.snippet ?? body.slice(0, 300)),
      metadata: { provider: "parallel", raw: rec },
    });
  }

  return items;
}
