import type { SourceAdapter } from "../schema.js";
import { firstSubquery, makeItem } from "./base.js";

interface DuckResponse { RelatedTopics?: Array<{ Text?: string; FirstURL?: string }> }

export const duckduckgo: SourceAdapter = {
  name: "duckduckgo",
  isAvailable: () => true,
  async search(context) {
    const query = encodeURIComponent(`${firstSubquery(context)} last ${context.limit} results`);
    const response = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1`);
    if (!response.ok) throw new Error(`DuckDuckGo returned ${response.status}`);
    const data = (await response.json()) as DuckResponse;
    return (data.RelatedTopics || [])
      .filter((topic) => topic.Text && topic.FirstURL)
      .slice(0, context.limit)
      .map((topic) => makeItem("duckduckgo", topic.Text!, topic.FirstURL!, { body: topic.Text }));
  }
};
