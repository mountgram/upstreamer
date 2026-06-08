import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const BASE_URL = "https://api.scrapecreators.com/v1/instagram/search";

function engagementFromResponse(r: Record<string, unknown>): Record<string, number> {
  const e: Record<string, number> = {};
  const playCount = typeof r.play_count === "number" ? r.play_count : Number(r.play_count) || 0;
  const likeCount = typeof r.like_count === "number" ? r.like_count : Number(r.like_count) || 0;
  const commentCount = typeof r.comment_count === "number" ? r.comment_count : Number(r.comment_count) || 0;
  if (playCount > 0) e.views = playCount;
  if (likeCount > 0) e.likes = likeCount;
  if (commentCount > 0) e.comments = commentCount;
  return e;
}

export async function searchInstagram(
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
    throw new Error(`Instagram API returned ${response.status}`);
  }

  const data = await response.json();
  const results: unknown[] = Array.isArray(data) ? data : data?.results ?? data?.data ?? [];

  const items: SourceItem[] = [];

  for (const r of results) {
    const rec = r as Record<string, unknown>;
    const itemId = String(rec.id ?? rec.item_id ?? rec.post_id ?? "");
    if (!itemId) continue;

    const description = String(rec.description ?? rec.caption ?? rec.text ?? "");
    const transcript = String(rec.transcript ?? "");
    const body = [description, transcript].filter(Boolean).join(" ").trim() || description;
    const urlStr = String(rec.url ?? rec.share_url ?? rec.permalink ?? "");
    const author = String(rec.owner_username ?? rec.owner ?? rec.username ?? "");
    const container = String(rec.owner_full_name ?? rec.owner_name ?? rec.full_name ?? author);
    const publishedAt = rec.timestamp
      ? new Date(Number(rec.timestamp) * 1000).toISOString()
      : rec.published_at
        ? new Date(String(rec.published_at)).toISOString()
        : new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = rec.timestamp || rec.published_at ? "high" : "low";

    items.push({
      item_id: itemId,
      source: "instagram",
      title: description.slice(0, 200),
      body,
      url: urlStr,
      author,
      container,
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: engagementFromResponse(rec),
      score: 0,
      snippet: description.slice(0, 300),
      metadata: { platform: "instagram", raw: rec },
    });
  }

  return items;
}
