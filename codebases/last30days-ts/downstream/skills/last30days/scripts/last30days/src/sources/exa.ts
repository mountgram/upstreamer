import Exa from "exa-js";
import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export async function searchExa(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.exaApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const exa = new Exa(config.exaApiKey);

  const result = await exa.searchAndContents(query, {
    type: "auto",
    numResults: limit,
    startPublishedDate: fromDate,
    endPublishedDate: toDate,
    text: { maxCharacters: 2000 },
  });

  const items: SourceItem[] = [];

  for (const r of result.results) {
    if (!r.url) continue;

    let dateConfidence: "high" | "med" | "low" = "high";
    let publishedAt: string;

    if (r.publishedDate) {
      publishedAt = new Date(r.publishedDate).toISOString();
      dateConfidence = "high";
    } else {
      publishedAt = new Date().toISOString();
      dateConfidence = "low";
    }

    items.push({
      item_id: r.id ?? r.url,
      source: "exa",
      title: r.title ?? "",
      body: r.text ?? "",
      url: r.url,
      author: r.author ?? "",
      container: hostname(r.url),
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: {},
      score: r.score ?? 0,
      snippet: r.text?.slice(0, 300) ?? "",
      metadata: {
        exaId: r.id,
        exaScore: r.score,
        exaPublishedDate: r.publishedDate,
      },
    });
  }

  return items;
}
