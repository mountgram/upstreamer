import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const BASE_URL = "https://truthsocial.com/api/v2/search";

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ").trim();
}

function engagementFromResponse(r: Record<string, unknown>): Record<string, number> {
  const e: Record<string, number> = {};
  const favCount = typeof r.favourites_count === "number" ? r.favourites_count : Number(r.favourites_count) || 0;
  const reblogCount = typeof r.reblogs_count === "number" ? r.reblogs_count : Number(r.reblogs_count) || 0;
  const replyCount = typeof r.replies_count === "number" ? r.replies_count : Number(r.replies_count) || 0;
  if (favCount > 0) e.favourites = favCount;
  if (reblogCount > 0) e.reblogs = reblogCount;
  if (replyCount > 0) e.replies = replyCount;
  return e;
}

export async function searchTruthSocial(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.truthsocialToken) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const url = new URL(BASE_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("resolve", "true");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${config.truthsocialToken}` },
  });

  if (!response.ok) {
    throw new Error(`Truth Social API returned ${response.status}`);
  }

  const data = await response.json();
  const statuses: unknown[] = Array.isArray(data?.statuses) ? data.statuses : [];

  const items: SourceItem[] = [];

  for (const s of statuses) {
    const status = s as Record<string, unknown>;
    const itemId = String(status.id ?? "");
    if (!itemId) continue;

    const content = String(status.content ?? status.text ?? "");
    const body = stripHtml(content);
    const account = (status.account ?? {}) as Record<string, unknown>;
    const author = String(account.acct ?? account.username ?? "");
    const urlStr = String(status.url ?? status.uri ?? "");
    const publishedAt = status.created_at
      ? new Date(String(status.created_at)).toISOString()
      : new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = status.created_at ? "high" : "low";

    items.push({
      item_id: itemId,
      source: "truthsocial",
      title: body.slice(0, 100),
      body,
      url: urlStr,
      author,
      container: "Truth Social",
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: engagementFromResponse(status),
      score: 0,
      snippet: body.slice(0, 300),
      metadata: { platform: "truthsocial", raw: status, account },
    });
  }

  return items;
}
