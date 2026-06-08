import type { SourceItem } from "../schema.js";

interface HNResult {
  objectID: string;
  title: string;
  story_text: string | null;
  url: string | null;
  author: string;
  created_at: string;
  points: number;
  num_comments: number;
  created_at_i: number;
}

interface HNSearchResponse {
  hits: HNResult[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
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

function hnUrl(objectID: string, url: string | null): string {
  if (url) return url;
  return `https://news.ycombinator.com/item?id=${objectID}`;
}

function normalize(hit: HNResult): SourceItem {
  return {
    source: "hackernews",
    item_id: hit.objectID,
    title: hit.title || "",
    body: hit.story_text || "",
    url: hnUrl(hit.objectID, hit.url),
    author: hit.author,
    container: "Hacker News",
    published_at: hit.created_at,
    date_confidence: dateConfidence(hit.created_at),
    engagement: {
      points: hit.points || 0,
      num_comments: hit.num_comments || 0,
    },
    score: 0,
    snippet: hit.story_text ? hit.story_text.slice(0, 300) : hit.title || "",
    metadata: {},
  };
}

export async function searchHackerNews(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string
): Promise<SourceItem[]> {
  const depthLimits: Record<string, number> = { quick: 5, medium: 15, deep: 30 };
  const limit = depthLimits[depth] || 15;
  const fromTs = toUnix(fromDate);
  const toTs = toUnix(toDate) + 86400;

  const encodedQuery = encodeURIComponent(query);
  const url = `https://hn.algolia.com/api/v1/search?query=${encodedQuery}&tags=story&numericFilters=created_at_i>${fromTs},created_at_i<${toTs}&hitsPerPage=${limit}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return [];

    const json = (await resp.json()) as HNSearchResponse;
    if (!json.hits || !Array.isArray(json.hits)) return [];

    const items = json.hits
      .filter((hit) => hit.objectID && hit.title)
      .map(normalize)
      .slice(0, limit);

    return items;
  } catch {
    return [];
  }
}
