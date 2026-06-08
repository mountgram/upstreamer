import OpenAI from "openai";
import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import type { RunOptions } from "../schema.js";
import { getDateConfidence } from "../dates.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

interface XPost {
  id?: string;
  text?: string;
  author_handle?: string;
  url?: string;
  created_at?: string;
  likes?: number;
  reposts?: number;
  replies?: number;
  views?: number;
}

export async function searchX(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config,
  options?: RunOptions
): Promise<SourceItem[]> {
  const apiKey = config.xaiApiKey || config.grokApiKey;
  if (!apiKey) {
    if (options?.debug) {
      console.error("[x] No xAI API key configured (XAI_API_KEY or GROK_API_KEY)");
    }
    return [];
  }

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const client = new OpenAI({
    apiKey,
    baseURL: "https://api.x.ai/v1",
  });

  try {
    const q = [
      `Find recent X posts about: ${query}`,
      `Date range: ${fromDate} to ${toDate}.`,
      `Return only a valid JSON array with up to ${limit} objects.`,
      `Each object should have: author_handle, text, url, created_at, likes, reposts, replies, views.`,
      `Do not include markdown, commentary, or prose outside the JSON array.`,
    ].join("\n");

    const response = await client.responses.create({
      model: "grok-4.3",
      input: q,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "x_search" } as any],
      max_output_tokens: 1800,
    });

    const items: SourceItem[] = [];
    const outputText = extractOutputText(response as unknown as XAIResponse);
    const posts = parseXPosts(outputText);

    if (posts.length === 0) {
      if (options?.debug) {
        const usage = (response as unknown as { usage?: { server_side_tool_usage_details?: { x_search_calls?: number } } }).usage;
        const calls = usage?.server_side_tool_usage_details?.x_search_calls ?? 0;
        console.error(`[x] xAI returned no parseable posts (x_search_calls=${calls})`);
      }
      return [];
    }

    for (const post of posts) {
      const text = post.text || "";
      const id = post.id || extractStatusId(post.url) || `x-${text.slice(0, 32)}`;
      const authorHandle = (post.author_handle || "").replace(/^@/, "");
      const createdAt = normalizeXDate(post.created_at);
      const postUrl = post.url || (authorHandle && id
        ? `https://x.com/${authorHandle}/status/${id}`
        : `https://x.com/search?q=${encodeURIComponent(query)}`);

      const title = text.length > 100 ? text.slice(0, 97) + "..." : text;

      items.push({
        item_id: id,
        source: "x",
        title,
        body: text,
        url: postUrl,
        author: authorHandle,
        container: "X",
        published_at: createdAt,
        date_confidence: getDateConfidence(createdAt, fromDate, toDate),
        engagement: {
          likes: post.likes ?? 0,
          reposts: post.reposts ?? 0,
          replies: post.replies ?? 0,
          views: post.views ?? 0,
        },
        score: 0,
        snippet: text.slice(0, 200),
        metadata: {},
      });

      if (items.length >= limit) break;
    }

    return items;
  } catch (err) {
    if (options?.debug) {
      console.error("[x] xAI API error:", err instanceof Error ? err.message : String(err));
    }
    return [];
  }
}

interface XAIResponse {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{ type?: string; text?: string }>;
  }>;
}

function extractOutputText(response: XAIResponse): string {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text;
  }

  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && typeof content.text === "string")
    .map((content) => content.text)
    .join("\n");
}

function parseXPosts(text: string): XPost[] {
  const json = extractJsonArray(text);
  if (!json) return [];

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((post): post is XPost => {
      if (!post || typeof post !== "object") return false;
      const candidate = post as XPost;
      return typeof candidate.text === "string" && candidate.text.trim().length > 0;
    });
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

function extractStatusId(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const match = url.match(/\/status\/(\d+)/);
  return match?.[1];
}

function normalizeXDate(value: string | undefined): string {
  if (!value) return new Date().toISOString();

  if (!/\b\d{4}\b/.test(value)) {
    const currentYear = new Date().getFullYear();
    const withYear = new Date(`${value} ${currentYear}`);
    if (!Number.isNaN(withYear.getTime())) return withYear.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();

  return new Date().toISOString();
}

export const __test__ = { extractOutputText, parseXPosts, extractStatusId, normalizeXDate };
