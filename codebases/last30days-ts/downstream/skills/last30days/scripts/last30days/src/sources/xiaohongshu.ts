import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 8,
  medium: 15,
  deep: 25,
};

const PUBLISH_TIME: Record<string, string> = {
  quick: "一天内",
  medium: "一周内",
  deep: "半年内",
};

interface XiaohongshuFeed {
  id?: string;
  noteCard?: {
    noteId?: string;
    displayTitle?: string;
    title?: string;
    desc?: string;
    displayDesc?: string;
    time?: number;
    interactInfo?: {
      likedCount?: string | number;
      commentCount?: string | number;
      collectedCount?: string | number;
    };
  };
  xsecToken?: string;
}

function toInt(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Math.floor(value);
  const text = String(value).trim().toLowerCase().replace(/,/g, "");
  if (!text) return 0;
  try {
    if (text.endsWith("万")) return Math.floor(parseFloat(text.slice(0, -1)) * 10000);
    if (text.endsWith("亿")) return Math.floor(parseFloat(text.slice(0, -1)) * 100000000);
    return Math.floor(parseFloat(text));
  } catch {
    return 0;
  }
}

function relevanceScore(likes: number, comments: number, favorites: number): number {
  const weighted = likes * 1.0 + comments * 2.5 + favorites * 1.5;
  return Math.min(1.0, Math.max(0.05, weighted / 5000));
}

function timestampToDate(ts: number | undefined): string | undefined {
  if (!ts || ts <= 0) return undefined;
  try {
    const dt = new Date(ts);
    if (Number.isNaN(dt.getTime())) return undefined;
    return dt.toISOString().slice(0, 10);
  } catch {
    return undefined;
  }
}

function buildNoteUrl(feedId: string, xsecToken?: string): string {
  if (xsecToken) {
    return `https://www.xiaohongshu.com/explore/${feedId}?xsec_token=${xsecToken}`;
  }
  return `https://www.xiaohongshu.com/explore/${feedId}`;
}

export async function searchXiaohongshu(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const baseUrl = process.env.XIAOHONGSHU_API_URL || "";
  const apifyToken = config.apifyApiToken;

  if (!baseUrl && !apifyToken) return [];
  if (!baseUrl) return [];

  const limit = DEPTH_LIMITS[depth] || DEPTH_LIMITS.medium;
  const normalizedDepth = depth || "medium";

  try {
    const loginResp = await fetch(`${baseUrl}/api/v1/login/status`, {
      signal: AbortSignal.timeout(8000),
    });

    if (!loginResp.ok) return [];

    const loginData = (await loginResp.json()) as { data?: { is_logged_in?: boolean } };
    const isLoggedIn = loginData?.data?.is_logged_in ?? false;
    if (!isLoggedIn) return [];

    const publishTime = PUBLISH_TIME[normalizedDepth] || PUBLISH_TIME.medium;

    const searchResp = await fetch(`${baseUrl}/api/v1/feeds/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keyword: query,
        filters: {
          sort_by: "综合",
          note_type: "不限",
          publish_time: publishTime,
          search_scope: "不限",
          location: "不限",
        },
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!searchResp.ok) return [];

    const searchData = (await searchResp.json()) as { data?: { feeds?: XiaohongshuFeed[] } };
    const feeds = searchData?.data?.feeds ?? [];
    if (!Array.isArray(feeds)) return [];

    const items: SourceItem[] = [];

    for (let i = 0; i < feeds.length && items.length < limit; i++) {
      const feed = feeds[i];
      if (!feed || typeof feed !== "object") continue;

      const note = feed.noteCard || {};
      const interact = note.interactInfo || {};

      const feedId = String(feed.id || note.noteId || "").trim();
      if (!feedId) continue;

      const xsecToken = String(feed.xsecToken || "").trim();
      const title = String(note.displayTitle || note.title || "").trim();
      const snippet = String(note.desc || note.displayDesc || title || "").trim();

      const likes = toInt(interact.likedCount);
      const comments = toInt(interact.commentCount);
      const favorites = toInt(interact.collectedCount);

      const dateValue = timestampToDate(note.time);

      items.push({
        item_id: `xhs-${feedId}`,
        source: "xiaohongshu",
        title: title.slice(0, 200) || `Xiaohongshu note ${feedId}`,
        body: snippet,
        url: buildNoteUrl(feedId, xsecToken || undefined),
        author: "",
        container: "xiaohongshu.com",
        published_at: dateValue || new Date().toISOString(),
        date_confidence: dateValue ? "high" : "low",
        engagement: {
          likes,
          comments,
          favorites,
        },
        score: relevanceScore(likes, comments, favorites),
        snippet: snippet.slice(0, 500),
        metadata: {
          provider: "xiaohongshu",
          sourceDomain: "xiaohongshu.com",
        },
      });
    }

    return items;
  } catch {
    return [];
  }
}

export const __test__ = { toInt, relevanceScore, timestampToDate, buildNoteUrl };
