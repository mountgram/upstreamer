import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

// Telegram public channel posts via the ScrapeCreators API. No keyword search:
// named public channel handles only. Requires SCRAPECREATORS_API_KEY plus a
// channel list (TELEGRAM_SOURCES env var, comma-separated).

const SCRAPECREATORS_BASE = "https://api.scrapecreators.com/v1/telegram";

const DEPTH_PAGE_CAPS: Record<string, number> = {
  quick: 1,
  medium: 3,
  deep: 6,
};

const REQUEST_TIMEOUT_MS = 30_000;

function scHeaders(token: string): Record<string, string> {
  return {
    "x-api-key": token,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "last30days-ts/0.1",
  };
}

export function parseChannelHandle(raw: string): string {
  const handle = raw.trim();
  if (!handle) throw new Error("Empty channel handle");

  if (handle.startsWith("-100")) {
    throw new Error("Numeric supergroup IDs are not supported");
  }

  if (handle.startsWith("@")) {
    const bare = handle.slice(1);
    if (!bare) throw new Error("Empty handle after @ prefix");
    return bare;
  }

  const urlMatch = handle.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/(?:s\/)?([^/?#]+)/i);
  if (urlMatch) {
    const extracted = urlMatch[1];
    if (extracted.toLowerCase() === "joinchat") {
      throw new Error("Private joinchat links are not supported");
    }
    return extracted;
  }

  if (handle.toLowerCase().includes("joinchat")) {
    throw new Error("Private joinchat links are not supported");
  }

  return handle;
}

export function parseChannelSources(raw: string): string[] {
  const handles: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    try {
      const handle = parseChannelHandle(trimmed);
      if (!handles.some((h) => h.toLowerCase() === handle.toLowerCase())) {
        handles.push(handle);
      }
    } catch {
      // Skip invalid channels (joinchat links, numeric supergroups).
    }
  }
  return handles;
}

function channelSources(config: Config): string[] {
  const raw = process.env.TELEGRAM_SOURCES || "";
  return parseChannelSources(raw);
}

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  const parsed = new Date(String(raw));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

interface TelegramPostRaw {
  id?: string;
  text?: string;
  url?: string;
  published_at?: string;
  date?: string;
  created_at?: string;
  channel_handle?: string;
  author_name?: string;
  view_count?: number;
  reaction_count?: number;
  [key: string]: unknown;
}

interface TelegramChannelRaw {
  handle?: string;
  name?: string;
  subscriber_count?: number;
}

function parsePost(
  raw: TelegramPostRaw,
  channel: TelegramChannelRaw,
  fromDate: string,
  toDate: string,
  index: number
): SourceItem {
  const postId = String(raw.id || `TG${index + 1}`);
  const text = String(raw.text || "").trim();
  const url = String(raw.url || "");
  const date = parseDate(raw.published_at ?? raw.date ?? raw.created_at);
  const handle = String(raw.channel_handle || channel.handle || "");
  const authorName = String(raw.author_name || channel.name || handle);

  const viewCount = Number(raw.view_count ?? 0) || 0;
  const reactionCount = Number(raw.reaction_count ?? 0) || 0;
  const subscriberCount = Number(channel.subscriber_count ?? 0) || 0;

  const publishedAt = date ? `${date}T00:00:00.000Z` : new Date().toISOString();

  return {
    item_id: postId,
    source: "telegram",
    title: text.length > 100 ? text.slice(0, 97) + "..." : text || `@${handle}`,
    body: text,
    url: url || `https://t.me/s/${handle}`,
    author: authorName,
    container: `@${handle}`,
    published_at: publishedAt,
    date_confidence: date ? "high" : "low",
    engagement: {
      views: viewCount,
      reactions: reactionCount,
      subscribers: subscriberCount,
    },
    score: 0,
    snippet: text.slice(0, 300),
    metadata: { handle, display_name: authorName },
  };
}

async function fetchChannelPosts(
  handle: string,
  token: string,
  fromDate: string,
  toDate: string,
  maxPages: number
): Promise<SourceItem[]> {
  const items: SourceItem[] = [];
  let cursor: string | null = null;
  let pagesFetched = 0;

  while (pagesFetched < maxPages) {
    const u = new URL(`${SCRAPECREATORS_BASE}/channel/posts`);
    u.searchParams.set("handle", handle);
    if (cursor) u.searchParams.set("cursor", cursor);

    let data: Record<string, unknown>;
    try {
      const resp = await fetch(u.toString(), {
        headers: scHeaders(token),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!resp.ok) break;
      data = (await resp.json()) as Record<string, unknown>;
    } catch {
      break;
    }

    if (!data.success) break;

    const channel = (data.channel as TelegramChannelRaw) || {};
    const posts = Array.isArray(data.posts) ? (data.posts as TelegramPostRaw[]) : [];
    if (posts.length === 0) break;

    let pageAllOld = true;
    for (const raw of posts) {
      const parsed = parsePost(raw, channel, fromDate, toDate, items.length);
      items.push(parsed);
      const date = parsePostDate(parsed);
      if (date && date >= fromDate) pageAllOld = false;
    }

    pagesFetched += 1;

    if (pageAllOld) break;

    cursor = typeof data.cursor === "string" ? data.cursor : null;
    if (!data.has_more || !cursor) break;
  }

  return items;
}

function parsePostDate(item: SourceItem): string {
  return item.published_at.slice(0, 10);
}

export async function searchTelegram(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const token = config.scrapecreatorsApiKey;
  if (!token) return [];

  const channels = channelSources(config);
  if (channels.length === 0) return [];

  const baseCap = DEPTH_PAGE_CAPS[depth] ?? DEPTH_PAGE_CAPS.medium;
  let maxPages = baseCap;
  const override = process.env.TELEGRAM_MAX_PAGES;
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed)) maxPages = Math.max(baseCap, parsed);
  }

  const allItems: SourceItem[] = [];
  for (const handle of channels) {
    const channelItems = await fetchChannelPosts(handle, token, fromDate, toDate, maxPages);
    allItems.push(...channelItems);
  }

  const from = fromDate.slice(0, 10);
  const to = toDate.slice(0, 10);
  const inRange = allItems.filter((item) => {
    const date = parsePostDate(item);
    return date && date >= from && date <= to;
  });

  const items = inRange.length > 0 ? inRange : allItems;
  return items
    .sort((a, b) => (b.published_at < a.published_at ? -1 : 1))
    .map((item) => ({
      ...item,
      metadata: { ...item.metadata, channels: channels },
    }));
}

export const __test__ = { parseChannelHandle, parseChannelSources, parsePost };
