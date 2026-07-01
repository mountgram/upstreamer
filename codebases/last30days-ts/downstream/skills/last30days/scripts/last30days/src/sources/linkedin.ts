import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

type JsonRecord = Record<string, unknown>;

const SC_BASE = "https://api.scrapecreators.com/v1/linkedin";

const DEPTH_CONFIG: Record<string, { date_posted: string; max_results: number }> = {
  quick: { date_posted: "last-week", max_results: 10 },
  medium: { date_posted: "last-month", max_results: 20 },
  deep: { date_posted: "last-month", max_results: 30 },
};

function scrapecreatorsHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "User-Agent": "last30days-ts/0.1",
  };
}

function parseDate(raw: unknown): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  const m = s.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function intField(post: JsonRecord, ...keys: string[]): number {
  for (const key of keys) {
    const val = post[key];
    if (val != null) {
      const n = Number(val);
      if (!Number.isNaN(n)) return Math.floor(n);
    }
  }
  return 0;
}

function isArticle(url: string): boolean {
  return (url || "").toLowerCase().includes("/pulse/");
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenRun(needle: string[], haystack: string[]): boolean {
  const n = needle.length;
  if (n === 0 || n > haystack.length) return false;
  for (let i = 0; i <= haystack.length - n; i++) {
    let match = true;
    for (let j = 0; j < n; j++) {
      if (haystack[i + j] !== needle[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

function bestAuthorMatch(items: JsonRecord[], topic: string): string {
  const topicTokens = normalizeName(topic).split(/\s+/);
  if (topicTokens.length < 2) return "";
  for (const item of items) {
    const author = String(item.author || "").trim();
    const nameTokens = normalizeName(author).split(/\s+/);
    const url = String(item.author_url || "").trim();
    if (!url || nameTokens.length < 2) continue;
    if (tokenRun(nameTokens, topicTokens) || tokenRun(topicTokens, nameTokens)) {
      return url;
    }
  }
  return "";
}

async function fetchProfile(profileUrl: string, token: string): Promise<LinkedInProfile | null> {
  try {
    const resp = await fetch(`${SC_BASE}/profile`, {
      headers: {
        ...scrapecreatorsHeaders(token),
        "Content-Type": "application/json",
      },
      method: "GET",
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return null;
    return await resp.json() as LinkedInProfile;
  } catch {
    return null;
  }
}

export async function searchLinkedIn(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const token = config.scrapecreatorsApiKey;
  if (!token) return [];

  const cfg = DEPTH_CONFIG[depth] ?? DEPTH_CONFIG.medium;
  const datePosted = cfg.date_posted;

  let response: unknown;
  try {
    const resp = await fetch(`${SC_BASE}/search/posts`, {
      headers: {
        ...scrapecreatorsHeaders(token),
        "Content-Type": "application/json",
      },
      method: "GET",
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return [];
    response = await resp.json();
  } catch {
    return [];
  }

  if (!response || typeof response !== "object") return [];

  const respObj = response as JsonRecord;
  let posts: JsonRecord[] = [];
  for (const key of ["posts", "items", "data", "results"]) {
    const val = respObj[key];
    if (Array.isArray(val)) {
      posts = val as JsonRecord[];
      break;
    }
  }

  posts = posts.slice(0, cfg.max_results);

  const items: SourceItem[] = [];
  for (const post of posts) {
    if (!post || typeof post !== "object") continue;

    const text = String(post.description || post.text || post.content || post.body || "").trim();
    if (!text) continue;

    const authorRaw = post.author || post.authorName || post.author_name || "";
    let author = "";
    let authorUrl = "";
    if (typeof authorRaw === "object" && authorRaw !== null) {
      author = String((authorRaw as Record<string, unknown>).name || (authorRaw as Record<string, unknown>).full_name || "").trim();
      authorUrl = String((authorRaw as Record<string, unknown>).url || (authorRaw as Record<string, unknown>).link || "").trim();
    } else {
      author = String(authorRaw).trim();
    }

    const url = String(post.url || post.postUrl || post.post_url || "").trim();
    const postId = String(post.urn || post.id || post.postId || `li-${items.length + 1}`);
    const date = parseDate(post.datePublished || post.date || post.postedAt || post.posted_at || post.createdAt || post.created_at);

    const likes = intField(post, "likes", "likesCount", "likes_count", "numLikes", "likeCount");
    const comments = intField(post, "comments", "commentsCount", "comments_count", "numComments", "commentCount");
    const reposts = intField(post, "reposts", "repostsCount", "shares", "shareCount", "reshares");
    const article = isArticle(url);

    items.push({
      item_id: postId,
      source: "linkedin",
      title: text.length > 100 ? text.slice(0, 97) + "..." : text,
      body: text,
      url,
      author,
      container: "LinkedIn",
      published_at: date ? `${date}T00:00:00.000Z` : new Date().toISOString(),
      date_confidence: date ? "high" : "low",
      engagement: { likes, comments, reposts },
      score: 0,
      snippet: text.slice(0, 300),
      metadata: { author_url: authorUrl, is_article: article },
    } satisfies SourceItem);
  }

  // Article enrichment for person topics
  const articleItems = await enrichArticles(items, query, token, fromDate, toDate);
  items.push(...articleItems);

  return items;
}

async function enrichArticles(
  posts: SourceItem[],
  topic: string,
  token: string,
  fromDate: string,
  toDate: string,
): Promise<SourceItem[]> {
  const rawItems: JsonRecord[] = posts.map((p) => ({
    author: p.author,
    author_url: p.metadata.author_url,
  }));

  const profileUrl = bestAuthorMatch(rawItems, topic);
  if (!profileUrl) return [];

  const profile = await fetchProfile(profileUrl, token);
  if (!profile || typeof profile !== "object") return [];

  const articles = (profile as LinkedInProfile).articles || [];
  const authorName = String(profile.name || "").trim();

  return articles
    .filter((art): art is LinkedInArticle => {
      if (!art || typeof art !== "object") return false;
      const headline = String(art.headline || art.title || "").trim();
      return !!headline;
    })
    .map((art, i) => {
      const headline = String(art.headline || art.title || "").trim();
      const url = String(art.url || art.link || "").trim();
      const date = parseDate(art.datePublished || art.date);

      return {
        item_id: String(art.id || `lia-${i + 1}`),
        source: "linkedin",
        title: headline,
        body: "",
        url,
        author: authorName,
        container: "LinkedIn Article",
        published_at: date ? `${date}T00:00:00.000Z` : new Date().toISOString(),
        date_confidence: date ? "high" : "low",
        engagement: {},
        score: 0,
        snippet: headline,
        metadata: { is_article: true },
      } satisfies SourceItem;
    });
}

interface LinkedInArticle {
  id?: string;
  headline?: string;
  title?: string;
  url?: string;
  link?: string;
  datePublished?: string;
  date?: string;
}

interface LinkedInProfile {
  name?: string;
  articles?: LinkedInArticle[];
}
