import OpenAI from "openai";
import type { SourceAdapter, SourceName } from "../schema.js";
import { hasAny, makeItem } from "./base.js";

function scrapeCreatorsSource(name: SourceName, platform: string): SourceAdapter {
  return {
    name,
    needs: ["SCRAPECREATORS_API_KEY"],
    isAvailable: (env) => Boolean(env.SCRAPECREATORS_API_KEY),
    async search(context) {
      const response = await fetch(`https://api.scrapecreators.com/v1/${platform}/search`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${context.env.SCRAPECREATORS_API_KEY || ""}` },
        body: JSON.stringify({ query: context.topic, limit: context.limit })
      });
      if (!response.ok) throw new Error(`${name} returned ${response.status}`);
      const data = await response.json() as { results?: Array<{ title?: string; url?: string; text?: string; author?: string; createdAt?: string; likes?: number; comments?: number; views?: number }> };
      return (data.results || []).filter((item) => item.url).map((item) => makeItem(name, item.title || item.text?.slice(0, 80) || item.url!, item.url!, {
        body: item.text,
        author: item.author,
        container: platform,
        publishedAt: item.createdAt,
        engagement: { likes: item.likes, comments: item.comments, views: item.views }
      }));
    }
  };
}

export const tiktok = scrapeCreatorsSource("tiktok", "tiktok");
export const instagram = scrapeCreatorsSource("instagram", "instagram");
export const threads = scrapeCreatorsSource("threads", "threads");
export const pinterest = scrapeCreatorsSource("pinterest", "pinterest");
export const xiaohongshu = scrapeCreatorsSource("xiaohongshu", "xiaohongshu");

export const x: SourceAdapter = {
  name: "x",
  needs: ["XAI_API_KEY", "GROK_API_KEY"],
  isAvailable: (env) => hasAny(env, ["XAI_API_KEY", "GROK_API_KEY"]),
  async search(context) {
    const client = new OpenAI({
      apiKey: context.env.XAI_API_KEY || context.env.GROK_API_KEY || "",
      baseURL: "https://api.x.ai/v1"
    });
    const response = await client.responses.create({
      model: "grok-4.3",
      tools: [{ type: "x_search" }],
      input: [
        {
          role: "system",
          content: "You find recent public X/Twitter posts and return only compact JSON for downstream evidence ranking."
        },
        {
          role: "user",
          content: `Find recent public X posts about ${context.topic}. Return JSON shaped as {"results":[{"title":"...","url":"https://x.com/...","text":"...","author":"...","publishedAt":"ISO date if known","likes":0,"replies":0}]}. Include only inspectable X URLs.`
        }
      ]
    } as unknown as Parameters<typeof client.responses.create>[0]);
    const outputText = (response as { output_text?: string }).output_text || "{}";
    const parsed = JSON.parse(outputText) as { results?: Array<{ title?: string; url?: string; text?: string; author?: string; publishedAt?: string; likes?: number; replies?: number }> };
    return (parsed.results || []).filter((item) => item.url).map((item) => makeItem("x", item.title || item.text?.slice(0, 80) || item.url!, item.url!, {
      body: item.text,
      author: item.author,
      container: "X",
      publishedAt: item.publishedAt,
      engagement: { likes: item.likes, comments: item.replies }
    }));
  }
};

export const bluesky: SourceAdapter = {
  name: "bluesky",
  isAvailable: () => true,
  async search(context) {
    const response = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(context.topic)}&limit=${context.limit}`);
    if (!response.ok) throw new Error(`Bluesky returned ${response.status}`);
    const data = await response.json() as { posts?: Array<{ uri: string; author?: { handle?: string }; record?: { text?: string; createdAt?: string }; likeCount?: number; replyCount?: number }> };
    return (data.posts || []).map((post) => makeItem("bluesky", post.record?.text?.slice(0, 80) || post.uri, `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split("/").pop()}`, {
      body: post.record?.text,
      author: post.author?.handle,
      container: "Bluesky",
      publishedAt: post.record?.createdAt,
      engagement: { likes: post.likeCount, comments: post.replyCount }
    }));
  }
};

export const truthsocial = scrapeCreatorsSource("truthsocial", "truthsocial");
