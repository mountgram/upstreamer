import type { Config } from "../config.js";
import type { SourceItem } from "../schema.js";
import { getDateConfidence } from "../dates.js";
import { searchYouTube } from "./youtube.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 2,
  medium: 3,
  deep: 5,
};

interface GeminiVideoResult {
  url?: string;
  title?: string;
  summary?: string;
  key_points?: string[];
  relevant_quotes?: string[];
}

export async function searchGeminiYouTube(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.geminiApiKey) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const videos = (await searchYouTube(query, fromDate, toDate, depth)).slice(0, limit);
  if (videos.length === 0) return [];

  try {
    const results = await askGeminiAboutVideos(config.geminiApiKey, query, videos);
    if (results.length === 0) return [];

    return results.slice(0, limit).flatMap((result, index) => {
      const fallback = videos[index];
      const url = String(result.url || fallback?.url || "");
      if (!url) return [];
      const title = String(result.title || fallback?.title || url);
      const keyPoints = Array.isArray(result.key_points) ? result.key_points : [];
      const quotes = Array.isArray(result.relevant_quotes) ? result.relevant_quotes : [];
      const body = [result.summary, keyPoints.join("\n"), quotes.join("\n")].filter(Boolean).join("\n\n");
      const publishedAt = fallback?.published_at || new Date().toISOString();
      return [{
        item_id: `gemini-youtube-${url}`,
        source: "gemini_youtube",
        title,
        body,
        url,
        author: fallback?.author || "Gemini YouTube analysis",
        container: fallback?.container || "YouTube",
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, fromDate, toDate),
        engagement: fallback?.engagement || {},
        score: 0,
        snippet: String(result.summary || body || title).slice(0, 300),
        metadata: { provider: "gemini", sourceUrl: url, keyPoints, relevantQuotes: quotes },
      } satisfies SourceItem];
    });
  } catch {
    return [];
  }
}

async function askGeminiAboutVideos(apiKey: string, query: string, videos: SourceItem[]): Promise<GeminiVideoResult[]> {
  const model = "gemini-2.0-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const parts: Array<Record<string, unknown>> = [{
    text: [
      `Analyze these YouTube videos for the research query: ${query}`,
      `Return only a strict JSON array. Each object must have url, title, summary, key_points, and relevant_quotes.`,
      `Prefer concrete, source-grounded knowledge over generic summaries.`,
    ].join("\n"),
  }];

  for (const video of videos) {
    parts.push({ text: `Video candidate: ${video.title}\nURL: ${video.url}\nMetadata: ${video.snippet}` });
    parts.push({ fileData: { fileUri: video.url, mimeType: "video/mp4" } });
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2200 },
    }),
  });
  if (!response.ok) return [];
  const data = await response.json() as GeminiResponse;
  return parseGeminiJsonArray(extractGeminiText(data));
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

function extractGeminiText(response: GeminiResponse): string {
  return (response.candidates || [])
    .flatMap((candidate) => candidate.content?.parts || [])
    .map((part) => part.text || "")
    .join("\n");
}

function parseGeminiJsonArray(text: string): GeminiVideoResult[] {
  const json = extractJsonArray(text);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GeminiVideoResult => !!item && typeof item === "object");
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

export const __test__ = { extractGeminiText, parseGeminiJsonArray };
