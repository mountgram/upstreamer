import type { SourceAdapter } from "../schema.js";
import { makeItem } from "./base.js";

interface RedditListing { data?: { children?: Array<{ data: { title: string; permalink: string; selftext?: string; author?: string; subreddit?: string; created_utc?: number; score?: number; num_comments?: number } }> } }

export const reddit: SourceAdapter = {
  name: "reddit",
  isAvailable: () => true,
  async search(context) {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(context.topic)}&sort=top&t=month&limit=${context.limit}`;
    const data = await (await fetch(url, { headers: { "user-agent": "last30days-ts/0.1" } })).json() as RedditListing;
    return (data.data?.children || []).map(({ data: post }) => makeItem("reddit", post.title, `https://www.reddit.com${post.permalink}`, {
      body: post.selftext,
      author: post.author,
      container: `r/${post.subreddit}`,
      publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
      engagement: { score: post.score, comments: post.num_comments }
    }));
  }
};
