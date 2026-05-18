import type { SourceAdapter } from "../schema.js";
import { makeItem } from "./base.js";

interface GitHubSearch { items?: Array<{ html_url: string; title?: string; path?: string; repository?: { full_name: string }; user?: { login: string }; created_at?: string; updated_at?: string; comments?: number; score?: number }> }

export const github: SourceAdapter = {
  name: "github",
  needs: ["GITHUB_TOKEN optional"],
  isAvailable: () => true,
  async search(context) {
    const headers: HeadersInit = { accept: "application/vnd.github+json", "user-agent": "last30days-ts" };
    if (context.env.GITHUB_TOKEN) headers.authorization = `Bearer ${context.env.GITHUB_TOKEN}`;
    const q = `${context.topic} created:>=${context.since.toISOString().slice(0, 10)}`;
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=${context.limit}`;
    const data = await (await fetch(url, { headers })).json() as GitHubSearch;
    return (data.items || []).map((item) => makeItem("github", item.title || item.path || item.html_url, item.html_url, {
      author: item.user?.login,
      container: item.repository?.full_name,
      publishedAt: item.created_at || item.updated_at,
      engagement: { comments: item.comments, score: item.score }
    }));
  }
};
