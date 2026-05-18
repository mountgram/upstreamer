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
    headers: { "User-Agent": "last30days/1.0" },
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

export async function searchReddit(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string
): Promise<SourceItem[]> {
  const depthLimits: Record<string, number> = { quick: 5, medium: 10, deep: 25 };
  const limit = depthLimits[depth] || 10;
  const fromTs = toUnix(fromDate);
  const toTs = toUnix(toDate) + 86400;

  const encodedQuery = encodeURIComponent(query);
  const searchUrl = `https://www.reddit.com/search.json?q=${encodedQuery}&sort=new&restrict_sr=off&t=month&limit=${limit}`;

  try {
    const json = await fetchPage(searchUrl);
    const posts = json.data.children.filter(
      (child) => child.kind === "t3" && child.data
    );

    const items = posts
      .map((child) => normalize(child.data))
      .filter((item) => {
        const ts = new Date(item.published_at).getTime() / 1000;
        return ts >= fromTs && ts <= toTs;
      })
      .slice(0, limit);

    return items;
  } catch {
    return [];
  }
}
