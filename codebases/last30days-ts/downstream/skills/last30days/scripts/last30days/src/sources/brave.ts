import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

const BRAVE_API_BASE = "https://api.search.brave.com/res/v1/web/search";
const BRAVE_NEWS_API_BASE = "https://api.search.brave.com/res/v1/news/search";

interface BraveWebResult {
  title: string;
  url: string;
  description: string;
  page_age?: string;
  extra_snippets?: string[];
  profile?: { name?: string; long_name?: string };
}

interface BraveWebResponse {
  web?: { results?: BraveWebResult[] };
}

interface BraveNewsResult {
  title: string;
  url: string;
  description: string;
  age?: string;
  page_age?: string;
}

interface BraveNewsResponse {
  results?: BraveNewsResult[];
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function parseBraveDate(age: string | undefined): { publishedAt: string; confidence: "high" | "med" | "low" } {
  if (!age) {
    return { publishedAt: new Date().toISOString(), confidence: "low" };
  }

  const trimmed = age.trim();
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) {
    return { publishedAt: new Date(match[1]).toISOString(), confidence: "high" };
  }

  const durationMatch = trimmed.match(/^(\d+)\s*(day|week|month|hour|minute|second)s?\s*ago/i);
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

export async function searchBrave(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.braveApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const headers = {
    Accept: "application/json",
    "Accept-Encoding": "gzip",
    "X-Subscription-Token": config.braveApiKey,
  };

  const items: SourceItem[] = [];
  const seen = new Set<string>();

  async function fetchWeb(): Promise<void> {
    const params = new URLSearchParams({
      q: query,
      count: String(Math.min(limit, 20)),
      search_lang: "en",
    });
    params.set("freshness", `${fromDate}to${toDate}`);

    const response = await fetch(`${BRAVE_API_BASE}?${params.toString()}`, { headers });
    if (!response.ok) return;

    const data = (await response.json()) as BraveWebResponse;
    const results = data.web?.results ?? [];

    for (const r of results) {
      if (!r.url || seen.has(r.url)) continue;

      const { publishedAt, confidence } = parseBraveDate(r.page_age ?? r.description);

      seen.add(r.url);
      items.push({
        item_id: r.url,
        source: "brave",
        title: r.title || "",
        body: r.description || "",
        url: r.url,
        author: r.profile?.name ?? r.profile?.long_name ?? "",
        container: hostname(r.url),
        published_at: publishedAt,
        date_confidence: confidence,
        engagement: {},
        score: 0,
        snippet: r.description || "",
        metadata: { extraSnippets: r.extra_snippets ?? [] },
      });

      if (items.length >= limit) return;
    }
  }

  async function fetchNews(): Promise<void> {
    if (items.length >= limit) return;

    const params = new URLSearchParams({
      q: query,
      count: String(Math.min(limit - items.length, 20)),
      search_lang: "en",
    });
    params.set("freshness", `${fromDate}to${toDate}`);

    const response = await fetch(`${BRAVE_NEWS_API_BASE}?${params.toString()}`, { headers });
    if (!response.ok) return;

    const data = (await response.json()) as BraveNewsResponse;
    const results = data.results ?? [];

    for (const r of results) {
      if (!r.url || seen.has(r.url)) continue;

      const { publishedAt, confidence } = parseBraveDate(r.age ?? r.page_age);

      seen.add(r.url);
      items.push({
        item_id: r.url,
        source: "brave",
        title: r.title || "",
        body: r.description || "",
        url: r.url,
        author: "",
        container: hostname(r.url),
        published_at: publishedAt,
        date_confidence: confidence,
        engagement: {},
        score: 0,
        snippet: r.description || "",
        metadata: {},
      });

      if (items.length >= limit) return;
    }
  }

  await Promise.all([fetchWeb(), fetchNews()]);
  return items.slice(0, limit);
}
