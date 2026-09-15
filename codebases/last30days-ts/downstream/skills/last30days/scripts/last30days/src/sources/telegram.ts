import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

// Telegram public channel posts via the ScrapeCreators API. No keyword search;
// reads posts from a user-configured list of public channel handles. Requires
// SCRAPECREATORS_API_KEY plus TELEGRAM_SOURCES; skipped otherwise.

const BASE = "https://api.scrapecreators.com/v1/telegram";

const DEPTH_PAGES: Record<string, number> = { quick: 1, medium: 3, deep: 6 };

export function parseChannelHandle(raw: string): string {
  let handle = raw.trim();
  if (!handle) throw new Error("Empty channel handle");
  if (handle.startsWith("-100") && handle.slice(1).replace(/-/g, "").length && /^-?100\d+$/.test(handle)) {
    throw new Error(`Numeric supergroup IDs are not supported: ${raw}`);
  }
  if (handle.startsWith("@")) {
    handle = handle.slice(1);
    if (!handle) throw new Error("Empty handle after @ prefix");
    return handle;
  }
  const urlMatch = handle.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/(?:s\/)?([^/?#]+)/i);
  if (urlMatch) {
    const extracted = urlMatch[1];
    if (extracted.toLowerCase() === "joinchat") {
      throw new Error(`Private joinchat links are not supported: ${raw}`);
    }
    return extracted;
  }
  if (handle.toLowerCase().includes("joinchat")) {
    throw new Error(`Private joinchat links are not supported: ${raw}`);
  }
  return handle;
}

export function parseChannelSources(raw: string): string[] {
  const handles: string[] = [];
  for (const part of (raw || "").split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    try {
      const handle = parseChannelHandle(trimmed);
      if (!handles.some((h) => h.toLowerCase() === handle.toLowerCase())) {
        handles.push(handle);
      }
    } catch {
      // Skip invalid handles.
    }
  }
  return handles;
}

interface TelegramPost {
  id?: string | number;
  text?: string;
  url?: string;
  published_at?: string;
  date?: string;
  created_at?: string;
  view_count?: number;
  reaction_count?: number;
  channel_handle?: string;
  author_name?: string;
}

function postDate(post: TelegramPost): string | undefined {
  for (const key of ["published_at", "date", "created_at"]) {
    const value = (post as Record<string, unknown>)[key];
    if (value == null) continue;
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return undefined;
}

function buildItem(post: TelegramPost, channel: Record<string, unknown>, topic: string, index: number): SourceItem {
  const text = String(post.text || "").trim();
  const url = String(post.url || "");
  const handle = String(post.channel_handle || channel.handle || "").replace(/^@/, "");
  const displayName = String(post.author_name || channel.name || handle);
  const date = postDate(post);
  const views = Number(post.view_count) || 0;
  const reactions = Number(post.reaction_count) || 0;
  const subscribers = Number(channel.subscriber_count) || 0;
  const publishedAt = date ? new Date(date).toISOString() : new Date().toISOString();

  return {
    item_id: String(post.id ?? `tg-${index + 1}`),
    source: "telegram",
    title: text.slice(0, 120) || `@${handle} post`,
    body: text,
    url: url || (handle ? `https://t.me/${handle}` : ""),
    author: handle,
    container: `Telegram @${handle}`,
    published_at: publishedAt,
    date_confidence: date ? getDateConfidence(date, date, date) : "low",
    engagement: { views, reactions, subscribers },
    score: 0,
    snippet: text.slice(0, 300),
    metadata: {
      handle,
      display_name: displayName,
      subscribers,
    },
  };
}

export async function searchTelegram(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const token = config.scrapecreatorsApiKey;
  const channels = parseChannelSources(config.telegramSources ?? process.env.TELEGRAM_SOURCES ?? "");
  if (!token || channels.length === 0) return [];

  const maxPages = DEPTH_PAGES[depth] ?? DEPTH_PAGES.medium;
  const items: SourceItem[] = [];

  try {
    for (const handle of channels) {
      let cursor: string | undefined;
      for (let page = 0; page < maxPages; page++) {
        const url = new URL(`${BASE}/channel/posts`);
        url.searchParams.set("handle", handle);
        if (cursor) url.searchParams.set("cursor", cursor);
        const resp = await fetch(url.toString(), { headers: { "x-api-key": token } });
        if (!resp.ok) break;
        const data = (await resp.json()) as {
          success?: boolean;
          channel?: Record<string, unknown>;
          posts?: TelegramPost[];
          has_more?: boolean;
          cursor?: string;
        };
        if (data.success === false) break;
        const posts = data.posts ?? [];
        if (!posts.length) break;
        posts.forEach((post, i) => items.push(buildItem(post, data.channel ?? {}, query, items.length + i)));
        if (!data.has_more || !data.cursor) break;
        cursor = data.cursor;
      }
    }

    const inRange = items.filter((item) => {
      const d = item.published_at.slice(0, 10);
      return !fromDate || !d || (d >= fromDate && d <= toDate);
    });

    return (inRange.length ? inRange : items).sort((a, b) => {
      const av = a.engagement.views ?? 0;
      const bv = b.engagement.views ?? 0;
      return bv - av;
    });
  } catch {
    return [];
  }
}

export const __test__ = { parseChannelHandle, parseChannelSources };
