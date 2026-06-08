import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const BASE_URL = "https://api.scrapecreators.com/v1/pinterest/search";

function engagementFromResponse(r: Record<string, unknown>): Record<string, number> {
  const e: Record<string, number> = {};
  const saveCount = typeof r.save_count === "number" ? r.save_count : Number(r.save_count) || 0;
  const commentCount = typeof r.comment_count === "number" ? r.comment_count : Number(r.comment_count) || 0;
  if (saveCount > 0) e.saves = saveCount;
  if (commentCount > 0) e.comments = commentCount;
  return e;
}

export async function searchPinterest(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.scrapecreatorsApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const url = new URL(BASE_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("count", String(limit));

  const response = await fetch(url.toString(), {
    headers: { "x-api-key": config.scrapecreatorsApiKey },
  });

  if (!response.ok) {
    throw new Error(`Pinterest API returned ${response.status}`);
  }

  const data = await response.json();
  const results: unknown[] = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

  const items: SourceItem[] = [];

  for (const r of results) {
    const rec = r as Record<string, unknown>;
    const itemId = String(rec.id ?? rec.item_id ?? rec.pin_id ?? "");
    if (!itemId) continue;

    const title = String(rec.title ?? rec.name ?? "");
    const description = String(rec.description ?? rec.desc ?? "");
    const urlStr = String(rec.url ?? rec.link ?? rec.pin_url ?? "");
    const author = String(rec.pin_owner ?? rec.owner ?? rec.author ?? "");
    const publishedAt = rec.created_at
      ? new Date(String(rec.created_at)).toISOString()
      : rec.published_at
        ? new Date(String(rec.published_at)).toISOString()
        : new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = rec.created_at || rec.published_at ? "high" : "low";

    items.push({
      item_id: itemId,
      source: "pinterest",
      title,
      body: description,
      url: urlStr,
      author,
      container: "Pinterest",
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: engagementFromResponse(rec),
      score: 0,
      snippet: description.slice(0, 300),
      metadata: { platform: "pinterest", raw: rec },
    });
  }

  return items;
}
