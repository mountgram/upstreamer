import OpenAI from "openai";
import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

export async function searchPerplexity(
  query: string,
  fromDate: string,
  toDate: string,
  _depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.openrouterApiKey) return [];

  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: config.openrouterApiKey,
    defaultHeaders: {
      "HTTP-Referer": "https://github.com/mountgram/last30days-ts",
    },
  });

  const dateConstraint = `Search for information between ${fromDate} and ${toDate}.`;

  const response = await openai.chat.completions.create({
    model: "perplexity/sonar-pro",
    messages: [
      {
        role: "system",
        content: `You are a research assistant finding recent information about a topic. ${dateConstraint} Return a JSON array of results with fields: title, snippet, url, body, and published_at (ISO 8601). Only return the JSON array, no other text.`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const content = response.choices?.[0]?.message?.content;
  if (!content) return [];

  let results: unknown[];
  try {
    const trimmed = content.trim();
    const json = trimmed.startsWith("[") ? trimmed : trimmed.slice(trimmed.indexOf("["), trimmed.lastIndexOf("]") + 1);
    results = JSON.parse(json);
    if (!Array.isArray(results)) return [];
  } catch {
    return [];
  }

  const items: SourceItem[] = [];

  for (const r of results) {
    const rec = r as Record<string, unknown>;
    const urlStr = String(rec.url ?? "");
    if (!urlStr) continue;

    const title = String(rec.title ?? "");
    const body = String(rec.body ?? rec.snippet ?? "");
    const publishedAt = rec.published_at
      ? new Date(String(rec.published_at)).toISOString()
      : new Date().toISOString();
    const dateConfidence: "high" | "med" | "low" = rec.published_at ? "med" : "low";

    items.push({
      item_id: urlStr,
      source: "perplexity",
      title: title || body.slice(0, 200),
      body,
      url: urlStr,
      author: "Perplexity",
      container: "perplexity",
      published_at: publishedAt,
      date_confidence: dateConfidence,
      engagement: {},
      score: 0,
      snippet: String(rec.snippet ?? "").slice(0, 300) || body.slice(0, 300),
      metadata: { provider: "openrouter", model: "perplexity/sonar-pro" },
    });
  }

  return items;
}
