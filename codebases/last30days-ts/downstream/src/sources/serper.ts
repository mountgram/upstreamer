import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const SERPER_URL = "https://google.serper.dev/search";
const SERPER_NEWS_URL = "https://google.serper.dev/news";

interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  position: number;
}

interface SerperNewsResult {
  title: string;
  link: string;
  snippet: string;
  date?: string;
  source?: string;
}

interface SerperSearchResponse {
  organic?: SerperOrganicResult[];
}

interface SerperNewsResponse {
  news?: SerperNewsResult[];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function parseSerperDate(
  dateStr: string | undefined
): { publishedAt: string; confidence: "high" | "med" | "low" } {
  if (!dateStr) {
    return { publishedAt: new Date().toISOString(), confidence: "low" };
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return { publishedAt: parsed.toISOString(), confidence: "high" };
  }

  const durationMatch = dateStr.trim().match(/^(\d+)\s*(day|week|month|hour|minute|second)s?\s*ago/i);
  if (durationMatch) {
    const value = parseInt(durationMatch[1], 10);
    const unit = durationMatch[2].toLowerCase();
    const now = new Date();
    switch (unit) {
      case "minute": now.setMinutes(now.getMinutes() - value); break;
      case "hour": now.setHours(now.getHours() - value); break;
      case "day": now.setDate(now.getDate() - value); break;
      case "week": now.setDate(now.getDate() - value * 7); break;
      case "month": now.setMonth(now.getMonth() - value); break;
      default: return { publishedAt: new Date().toISOString(), confidence: "low" };
    }
    return { publishedAt: now.toISOString(), confidence: "high" };
  }

  return { publishedAt: new Date().toISOString(), confidence: "low" };
}

export async function searchSerper(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.serperApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const headers = {
    "X-API-KEY": config.serperApiKey,
    "Content-Type": "application/json",
  };

  const items: SourceItem[] = [];
  const seen = new Set<string>();

  async function fetchSearch(): Promise<void> {
    const response = await fetch(SERPER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: query,
        num: Math.min(limit, 25),
        tbs: `cdr:1,cd_min:${fromDate},cd_max:${toDate}`,
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as SerperSearchResponse;
    const results = data.organic ?? [];

    for (const r of results) {
      if (!r.link || seen.has(r.link)) continue;

      const { publishedAt, confidence } = parseSerperDate(r.date);

      seen.add(r.link);
      items.push({
        item_id: r.link,
        source: "serper",
        title: r.title || "",
        body: r.snippet || "",
        url: r.link,
        author: "",
        container: hostname(r.link),
        published_at: publishedAt,
        date_confidence: confidence,
        engagement: {},
        score: r.position ? 1 / r.position : 0,
        snippet: r.snippet || "",
        metadata: { serperPosition: r.position },
      });

      if (items.length >= limit) return;
    }
  }

  async function fetchNews(): Promise<void> {
    if (items.length >= limit) return;

    const response = await fetch(SERPER_NEWS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        q: query,
        num: Math.min(limit - items.length, 25),
        tbs: `cdr:1,cd_min:${fromDate},cd_max:${toDate}`,
      }),
    });

    if (!response.ok) return;

    const data = (await response.json()) as SerperNewsResponse;
    const results = data.news ?? [];

    for (const r of results) {
      if (!r.link || seen.has(r.link)) continue;

      const { publishedAt, confidence } = parseSerperDate(r.date);

      seen.add(r.link);
      items.push({
        item_id: r.link,
        source: "serper",
        title: r.title || "",
        body: r.snippet || "",
        url: r.link,
        author: r.source ?? "",
        container: r.source ?? hostname(r.link),
        published_at: publishedAt,
        date_confidence: confidence,
        engagement: {},
        score: 0,
        snippet: r.snippet || "",
        metadata: { serperSource: r.source },
      });

      if (items.length >= limit) return;
    }
  }

  await Promise.all([fetchSearch(), fetchNews()]);
  return items.slice(0, limit);
}
