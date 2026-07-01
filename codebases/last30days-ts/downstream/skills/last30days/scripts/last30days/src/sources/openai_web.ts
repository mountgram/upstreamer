import OpenAI from "openai";
import type { Config } from "../config.js";
import type { SourceItem } from "../schema.js";
import { getDateConfidence } from "../dates.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

interface GroundedWebResult {
  title?: string;
  snippet?: string;
  body?: string;
  url?: string;
  published_at?: string;
  source?: string;
}

export async function searchOpenAIWeb(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.openaiApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const client = new OpenAI({ apiKey: config.openaiApiKey });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        `Search the web for: ${query}`,
        `Date range: ${fromDate} to ${toDate}.`,
        `Return only a strict JSON array of up to ${limit} objects.`,
        `Each object must have title, snippet, url, source, and published_at when known.`,
      ].join("\n"),
      tools: [{ type: "web_search_preview" } as OpenAI.Responses.Tool],
      max_output_tokens: 2400,
    });

    const outputText = extractOutputText(response as unknown as OpenAIWebResponse);
    const results = parseResults(outputText);

    return results.slice(0, limit).flatMap((result) => {
      const url = String(result.url ?? "");
      if (!url) return [];
      const publishedAt = normalizeDate(result.published_at);
      const body = String(result.body ?? result.snippet ?? "");
      const title = String(result.title ?? (body.slice(0, 120) || url));
      return [{
        item_id: url,
        source: "openai_web",
        title,
        body,
        url,
        author: String(result.source ?? "OpenAI web search"),
        container: hostname(url) || String(result.source ?? "OpenAI web search"),
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, fromDate, toDate),
        engagement: {},
        score: 0,
        snippet: String(result.snippet ?? body).slice(0, 300),
        metadata: { provider: "openai", tool: "web_search_preview" },
      } satisfies SourceItem];
    });
  } catch {
    return [];
  }
}

interface OpenAIWebResponse {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

function extractOutputText(response: OpenAIWebResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) return response.output_text;
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n");
}

function parseResults(text: string): GroundedWebResult[] {
  const json = extractJsonArray(text);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GroundedWebResult => !!item && typeof item === "object");
  } catch {
    return [];
  }
}

function extractJsonArray(text: string): string | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  if (candidate.startsWith("[") && candidate.endsWith("]")) return candidate;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

function normalizeDate(value: unknown): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

export const __test__ = { extractOutputText, parseResults };
