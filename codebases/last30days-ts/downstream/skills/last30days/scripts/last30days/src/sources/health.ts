import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

interface MedlinePlusResult {
  title: { _value: string };
  link: Array<{ _href: string }>;
  summary: Array<{ _value: string }>;
  updated: { _value: string };
}

interface MedlinePlusFeed {
  feed?: {
    entry?: MedlinePlusResult[];
  };
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

async function fetchMedlinePlus(query: string, limit: number): Promise<SourceItem[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encoded}&retmax=${limit}`;

  try {
    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as {
      result?: {
        list?: Array<{
          title: string;
          fullSummary: string;
          link: string;
          lastUpdate: string;
        }>;
      };
    };

    const results = data.result?.list ?? [];
    return results.slice(0, limit).map((r) => {
      const publishedAt = r.lastUpdate
        ? new Date(r.lastUpdate).toISOString()
        : new Date().toISOString();
      return {
        item_id: r.link || `nih-${r.title?.slice(0, 40)}`,
        source: "health",
        title: r.title || "",
        body: r.fullSummary || r.title || "",
        url: r.link || `https://medlineplus.gov/`,
        author: "MedlinePlus / NIH",
        container: hostname(r.link || "medlineplus.gov"),
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, "", ""),
        engagement: {},
        score: 0,
        snippet: (r.fullSummary || r.title || "").slice(0, 300),
        metadata: { provider: "medlineplus", fetch_method: "api" },
      } as SourceItem;
    });
  } catch {
    return [];
  }
}

export async function searchHealth(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  _config: Config
): Promise<SourceItem[]> {
  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  try {
    const items = await fetchMedlinePlus(query, limit);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setDate(to.getDate() + 1);

    return items
      .filter((item) => {
        const d = new Date(item.published_at);
        return d >= from && d <= to;
      })
      .slice(0, limit);
  } catch {
    return [];
  }
}
