import type { SourceItem } from "../schema.js";

interface RedditPostData {
  id: string;
  title: string;
  selftext: string;
  permalink: string;
  author: string;
  subreddit_name_prefixed: string;
  created_utc: number;
  score: number;
  num_comments: number;
  subreddit?: string;
}

interface RedditChild {
  kind: string;
  data: RedditPostData;
}

interface RedditResponse {
  data: {
    children: RedditChild[];
    after: string | null;
  };
  kind: string;
}

function toUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

function dateConfidence(published_at: string): "high" | "med" | "low" {
  if (!published_at) return "low";
  const d = new Date(published_at);
  if (isNaN(d.getTime())) return "low";
  const now = Date.now();
  const age = now - d.getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (age <= thirtyDays) return "high";
  if (age <= 60 * 24 * 60 * 60 * 1000) return "med";
  return "low";
}

function normalize(post: RedditPostData): SourceItem {
  const published_at = new Date(post.created_utc * 1000).toISOString();
  return {
    source: "reddit",
    item_id: post.id,
    title: post.title,
    body: post.selftext || "",
    url: `https://www.reddit.com${post.permalink}`,
    author: post.author,
    container: post.subreddit_name_prefixed,
    published_at,
    date_confidence: dateConfidence(published_at),
    engagement: {
      score: post.score,
      num_comments: post.num_comments,
    },
    score: 0,
    snippet: post.selftext ? post.selftext.slice(0, 300) : post.title,
    metadata: {},
  };
}

async function fetchPage(url: string): Promise<RedditResponse> {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
      "Accept": "application/json,text/xml,text/html;q=0.9,*/*;q=0.8",
    },
  });
  if (!resp.ok) {
    throw new Error(`Reddit API returned ${resp.status}: ${resp.statusText}`);
  }
  const json = (await resp.json()) as RedditResponse;
  if (!json || !json.data || !Array.isArray(json.data.children)) {
    return { kind: "Listing", data: { children: [], after: null } };
  }
  return json;
}

function postIdFromUrl(url: string): string {
  const match = url.match(/\/comments\/([a-z0-9]+)/i);
  return match?.[1] || url;
}

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(text: string): string {
  return decodeXml(text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function normalizeLoose(input: {
  id: string;
  title: string;
  body?: string;
  url: string;
  author?: string;
  subreddit?: string;
  published_at?: string;
  score?: number;
  num_comments?: number;
  metadata?: Record<string, unknown>;
}): SourceItem {
  const published_at = input.published_at || new Date().toISOString();
  return {
    source: "reddit",
    item_id: input.id,
    title: input.title,
    body: input.body || "",
    url: input.url,
    author: input.author || "",
    container: input.subreddit ? `r/${input.subreddit.replace(/^r\//, "")}` : "Reddit",
    published_at,
    date_confidence: dateConfidence(published_at),
    engagement: {
      score: input.score || 0,
      num_comments: input.num_comments || 0,
    },
    score: 0,
    snippet: (input.body || input.title).slice(0, 300),
    metadata: input.metadata || {},
  };
}

async function fetchJsonSearch(query: string, limit: number, subreddit?: string): Promise<SourceItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const sub = subreddit?.replace(/^r\//, "").trim();
  const searchUrl = sub
    ? `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.json?q=${encodedQuery}&restrict_sr=on&sort=relevance&t=month&limit=${limit}&raw_json=1`
    : `https://www.reddit.com/search.json?q=${encodedQuery}&sort=relevance&t=month&limit=${limit}&raw_json=1`;
  const json = await fetchPage(searchUrl);
  return json.data.children
    .filter((child) => child.kind === "t3" && child.data)
    .map((child) => normalize(child.data))
    .slice(0, limit);
}

async function fetchRssSearch(query: string, limit: number, subreddit?: string): Promise<SourceItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const sub = subreddit?.replace(/^r\//, "").trim();
  const url = sub
    ? `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.rss?q=${encodedQuery}&restrict_sr=on&sort=relevance&t=month`
    : `https://www.reddit.com/search.rss?q=${encodedQuery}&sort=relevance&t=month`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "last30days-ts/0.1 (+https://github.com/mountgram/last30days-ts)", Accept: "application/rss+xml,application/atom+xml,text/xml" },
  });
  if (!resp.ok) return [];
  const xml = await resp.text();
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, limit);
  return entries.map((entry) => {
    const block = entry[1];
    const title = decodeXml(block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Reddit post");
    const link = block.match(/<link[^>]*href="([^"]+)"/)?.[1] || "https://www.reddit.com";
    const author = decodeXml(block.match(/<name>([\s\S]*?)<\/name>/)?.[1] || "");
    const published = block.match(/<updated>([\s\S]*?)<\/updated>/)?.[1] || block.match(/<published>([\s\S]*?)<\/published>/)?.[1];
    const body = stripHtml(block.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] || "");
    const subredditMatch = link.match(/reddit\.com\/r\/([^/]+)/i);
    return normalizeLoose({
      id: postIdFromUrl(link),
      title,
      body,
      url: link,
      author,
      subreddit: subreddit || subredditMatch?.[1],
      published_at: published ? new Date(published).toISOString() : undefined,
      metadata: { discovery: "rss" },
    });
  });
}

async function enrichComments(items: SourceItem[], depth: string): Promise<SourceItem[]> {
  const limits: Record<string, number> = { quick: 2, medium: 4, deep: 8 };
  const limit = limits[depth] || 4;
  const head = items.slice(0, limit);
  const rest = items.slice(limit);
  const enriched = await Promise.all(head.map(async (item) => {
    try {
      const resp = await fetch(`${item.url.replace(/\/$/, "")}.json?limit=5&raw_json=1`, {
        headers: { "User-Agent": "last30days-ts/0.1" },
      });
      if (!resp.ok) return item;
      const json = await resp.json() as Array<{ data?: { children?: Array<{ data?: { body?: string; author?: string; score?: number } }> } }>;
      const comments = json[1]?.data?.children
        ?.map((child) => child.data)
        .filter((comment): comment is { body?: string; author?: string; score?: number } => !!comment?.body)
        .slice(0, 5)
        .map((comment) => ({ author: comment.author || "", score: comment.score || 0, excerpt: (comment.body || "").slice(0, 240) })) || [];
      if (!comments.length) return item;
      return {
        ...item,
        metadata: { ...item.metadata, top_comments: comments },
      };
    } catch {
      return item;
    }
  }));
  return [...enriched, ...rest];
}

export async function searchReddit(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  subreddits?: string[]
): Promise<SourceItem[]> {
  const depthLimits: Record<string, number> = { quick: 5, medium: 10, deep: 25 };
  const limit = depthLimits[depth] || 10;
  const fromTs = toUnix(fromDate);
  const toTs = toUnix(toDate) + 86400;

  try {
    const targets = subreddits?.length ? subreddits : [undefined];
    let items: SourceItem[] = [];
    for (const subreddit of targets) {
      try {
        const jsonItems = await fetchJsonSearch(query, limit, subreddit);
        items.push(...jsonItems);
      } catch {
        // Reddit's legacy JSON path is increasingly blocked; RSS is the load-bearing fallback.
      }
      if (!items.length || subreddit) {
        items.push(...await fetchRssSearch(query, limit, subreddit));
      }
    }

    const seen = new Set<string>();
    items = items
      .filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      })
      .filter((item) => {
        const ts = new Date(item.published_at).getTime() / 1000;
        return ts >= fromTs && ts <= toTs;
      })
      .sort((a, b) => (b.engagement.score || 0) - (a.engagement.score || 0))
      .slice(0, limit);

    return enrichComments(items, depth);
  } catch {
    return [];
  }
}
