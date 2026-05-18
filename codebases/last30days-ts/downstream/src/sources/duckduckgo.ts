import type { SourceAdapter } from "../schema.js";
import { firstSubquery, makeItem } from "./base.js";

interface DuckResponse { RelatedTopics?: Array<{ Text?: string; FirstURL?: string }> }

function decodeDuckUrl(raw: string): string {
  const url = raw.startsWith("//") ? `https:${raw}` : raw;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("uddg") || url;
  } catch {
    return url;
  }
}

function cleanHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function parseHtmlResults(html: string, limit: number) {
  const results: Array<{ title: string; url: string; body?: string }> = [];
  const linkPattern = /<a[^>]+class="[^"]*(?:result-link|result__a)[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const url = decodeDuckUrl(match[1] || "");
    const title = cleanHtml(match[2] || "");
    if (!url || !title || results.some((item) => item.url === url)) continue;
    results.push({ title, url });
    if (results.length >= limit) break;
  }
  return results;
}

export const duckduckgo: SourceAdapter = {
  name: "duckduckgo",
  isAvailable: () => true,
  async search(context) {
    const queryText = `${firstSubquery(context)} last 30 days`;
    const query = encodeURIComponent(queryText);
    const response = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_redirect=1&no_html=1`);
    if (!response.ok) throw new Error(`DuckDuckGo returned ${response.status}`);
    const data = (await response.json()) as DuckResponse;
    const instantAnswerItems = (data.RelatedTopics || [])
      .filter((topic) => topic.Text && topic.FirstURL)
      .slice(0, context.limit)
      .map((topic) => makeItem("duckduckgo", topic.Text!, topic.FirstURL!, { body: topic.Text }));
    if (instantAnswerItems.length) return instantAnswerItems;

    const htmlResponse = await fetch(`https://html.duckduckgo.com/html/?${new URLSearchParams({ q: queryText }).toString()}`, {
      headers: { "user-agent": "Mozilla/5.0" }
    });
    if (!htmlResponse.ok) throw new Error(`DuckDuckGo HTML returned ${htmlResponse.status}`);
    const html = await htmlResponse.text();
    return parseHtmlResults(html, context.limit).map((item) => makeItem("duckduckgo", item.title, item.url, { body: item.body }));
  }
};
