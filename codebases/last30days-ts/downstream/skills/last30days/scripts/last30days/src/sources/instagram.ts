import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const COMMENT_DEPTH_LIMITS: Record<string, number> = {
  quick: 3,
  medium: 5,
  deep: 8,
};

const BASE_URL = "https://api.scrapecreators.com/v1/instagram/search";
const MEDIA_INFO_URL = "https://api.scrapecreators.com/v1/instagram/media";

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

function totalEngagement(item: SourceItem): number {
  const e = item.engagement;
  return (e.views ?? 0) * 0.45 + (e.likes ?? 0) * 0.27 + (e.comments ?? 0) * 0.18;
}

async function fetchMediaComments(itemId: string, config: Config): Promise<{ author: string; text: string; likes: number }[]> {
  if (!config.scrapecreatorsApiKey) return [];

  try {
    const url = new URL(`${MEDIA_INFO_URL}/${itemId}`);
    const response = await fetch(url.toString(), {
      headers: { "x-api-key": config.scrapecreatorsApiKey },
    });

    if (!response.ok) return [];

    const data = await response.json() as Record<string, unknown>;
    const comments = data.comments as Array<Record<string, unknown>> | undefined;
    if (!Array.isArray(comments)) return [];

    return comments.slice(0, 5).map((c) => ({
      author: String(c.owner_username ?? c.username ?? "anonymous"),
      text: String(c.text ?? ""),
      likes: Number(c.like_count ?? c.likes) || 0,
    })).filter((c) => c.text.length > 0);
  } catch {
    return [];
  }
}

async function enrichWithComments(items: SourceItem[], depth: string, config: Config): Promise<SourceItem[]> {
  const maxVideos = COMMENT_DEPTH_LIMITS[depth] ?? COMMENT_DEPTH_LIMITS.medium;

  const ranked = [...items]
    .sort((a, b) => totalEngagement(b) - totalEngagement(a))
    .slice(0, maxVideos);

  for (const item of ranked) {
    const itemId = item.item_id;
    const comments = await fetchMediaComments(itemId, config);
    if (comments.length > 0) {
      item.metadata = item.metadata ?? {};
      (item.metadata as Record<string, unknown>).top_comments = comments;
    }
  }

  return items;
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

  const enriched = await enrichWithComments(items, depth, config);
  return enriched;
}
