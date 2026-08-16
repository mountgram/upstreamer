import type { Config } from "../config.js";
import type { SourceItem } from "../schema.js";

interface GeminiPlaceResult {
  title?: string;
  summary?: string;
  url?: string;
  place_name?: string;
  address?: string;
  why_it_matters?: string;
}

type GeminiGroundingTool = "googleMaps" | "googleSearch";

export async function searchGeminiMaps(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.geminiApiKey) return [];

  const limit = depth === "deep" ? 10 : depth === "quick" ? 4 : 7;
  try {
    const mapsResults = await askGeminiMaps(config.geminiApiKey, query, limit, "googleMaps");
    let grounding = "google_maps";
    let results = mapsResults;
    if (results.length === 0) {
      grounding = "google_search_maps_fallback";
      results = await askGeminiMaps(config.geminiApiKey, query, limit, "googleSearch");
    }
    return results.slice(0, limit).flatMap((result, index) => {
      const title = String(result.title || result.place_name || "").trim();
      if (!title) return [];
      const url = String(result.url || `https://www.google.com/maps/search/${encodeURIComponent(title)}`);
      const body = [result.summary, result.address, result.why_it_matters].filter(Boolean).join("\n");
      return [{
        item_id: `gemini-maps-${index}-${title}`,
        source: "gemini_maps",
        title,
        body,
        url,
        author: "Gemini Maps grounding",
        container: "Google Maps",
        published_at: new Date().toISOString(),
        date_confidence: "med",
        engagement: {},
        score: 0,
        snippet: body.slice(0, 300),
        metadata: { provider: "gemini", grounding, address: result.address },
      } satisfies SourceItem];
    });
  } catch {
    return [];
  }
}

async function askGeminiMaps(apiKey: string, query: string, limit: number, tool: GeminiGroundingTool): Promise<GeminiPlaceResult[]> {
  const model = "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildGeminiMapsRequestBody(query, limit, tool)),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) return [];
  const data = await response.json() as GeminiResponse;
  return parseGeminiJsonArray(extractGeminiText(data));
}

function buildGeminiMapsRequestBody(query: string, limit: number, tool: GeminiGroundingTool): Record<string, unknown> {
  const groundingLabel = tool === "googleMaps" ? "Google Maps grounding" : "Google Search grounding for maps/place evidence";
  const toolConfig = tool === "googleMaps" ? { googleMaps: {} } : { googleSearch: {} };

  return {
    contents: [{
      role: "user",
      parts: [{
        text: [
          `Answer this spatial/place research question using ${groundingLabel} where available: ${query}`,
          `Return only a strict JSON array of up to ${limit} places or area facts.`,
          `Each object must have title, place_name, address when known, summary, why_it_matters, and url when known.`,
        ].join("\n"),
      }],
    }],
    tools: [toolConfig],
    generationConfig: { temperature: 0.2, maxOutputTokens: 1800 },
  };
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

function parseGeminiJsonArray(text: string): GeminiPlaceResult[] {
  const json = extractJsonArray(text);
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GeminiPlaceResult => !!item && typeof item === "object");
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

export const __test__ = { extractGeminiText, parseGeminiJsonArray, buildGeminiMapsRequestBody };
