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
    const q = `${query} from last 30 days`;

    const response = await client.responses.create({
      model: "grok-4.3",
      input: q,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: [{ type: "x_search" } as any],
      ...(options?.debug ? {} : {}),
    });

    const items: SourceItem[] = [];
    const output = response as unknown as Record<string, unknown>;

    const toolResults = output.tool_results as Array<{ type: string; data: unknown }> | undefined;
    if (!toolResults) {
      if (options?.debug) {
        console.error("[x] No tool_results in xAI response");
      }
      return [];
    }

    const searchResult = toolResults.find(
      (t) => t.type === "x_search" || t.type === "x_search_result"
    );
    if (!searchResult) {
      if (options?.debug) {
        console.error("[x] No x_search result found in tool_results");
      }
      return [];
    }

    const searchData = searchResult.data as { posts?: XPost[] } | undefined;
    if (!searchData?.posts || !Array.isArray(searchData.posts)) {
      if (options?.debug) {
        console.error("[x] No posts in x_search result data");
      }
      return [];
    }

    for (const post of searchData.posts) {
      const text = post.text || "";
      const id = post.id || `x-${text.slice(0, 32)}`;
      const authorHandle = post.author_handle || "";
      const createdAt = post.created_at || new Date().toISOString();
      const postUrl = authorHandle && id
        ? `https://x.com/${authorHandle}/status/${id}`
        : `https://x.com/search?q=${encodeURIComponent(query)}`;

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
