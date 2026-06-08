import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const BASE_URL = "https://api.scrapecreators.com/v1/threads/search";

function engagementFromResponse(r: Record<string, unknown>): Record<string, number> {
  const e: Record<string, number> = {};
  const likeCount = typeof r.like_count === "number" ? r.like_count : Number(r.like_count) || 0;
  const replyCount = typeof r.reply_count === "number" ? r.reply_count : Number(r.reply_count) || 0;
  if (likeCount > 0) e.likes = likeCount;
  if (replyCount > 0) e.replies = replyCount;
  return e;
}

export async function searchThreads(
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
    throw new Error(`Threads API returned ${response.status}`);
  }

  const data = await response.json();
  const results: unknown[] = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

  const items: SourceItem[] = [];

  for (const r of results) {
    const rec = r as Record<string, unknown>;
    const itemId = String(rec.id ?? rec.item_id ?? rec.post_id ?? "");
    if (!itemId) continue;

    const text = String(rec.text ?? rec.caption ?? rec.description ?? "");
    const title = text.slice(0, 100);
    const urlStr = String(rec.url ?? rec.share_url ?? rec.permalink ?? "");
    const author = String(rec.username ?? rec.owner_username ?? rec.author ?? "");
    const publishedAt = rec.timestamp
      ? new Date(Number(rec.timestamp) * 1000).toISOString()
      : rec.published_at
        ? new Date(String(rec.published_at)).toISOString()
        : new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = rec.timestamp || rec.published_at ? "high" : "low";

    items.push({
      item_id: itemId,
      source: "threads",
      title,
      body: text,
      url: urlStr,
      author,
      container: "Threads",
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: engagementFromResponse(rec),
      score: 0,
      snippet: text.slice(0, 300),
      metadata: { platform: "threads", raw: rec },
    });
  }

  return items;
}
