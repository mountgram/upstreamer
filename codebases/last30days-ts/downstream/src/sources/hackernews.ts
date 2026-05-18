import type { SourceAdapter } from "../schema.js";
import { makeItem } from "./base.js";

interface HnResponse { hits?: Array<{ title?: string; story_title?: string; url?: string; story_url?: string; objectID: string; author?: string; created_at?: string; points?: number; num_comments?: number }> }

export const hackernews: SourceAdapter = {
  name: "hackernews",
  isAvailable: () => true,
  async search(context) {
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(context.topic)}&tags=story&hitsPerPage=${context.limit}`;
    const data = await (await fetch(url)).json() as HnResponse;
    return (data.hits || []).map((hit) => makeItem("hackernews", hit.title || hit.story_title || "HN item", hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`, {
      author: hit.author,
      container: "Hacker News",
      publishedAt: hit.created_at,
      engagement: { score: hit.points, comments: hit.num_comments }
    }));
  }
};
