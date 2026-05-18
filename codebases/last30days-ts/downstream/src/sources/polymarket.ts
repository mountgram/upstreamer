import type { SourceAdapter } from "../schema.js";
import { makeItem } from "./base.js";

export const polymarket: SourceAdapter = {
  name: "polymarket",
  isAvailable: () => true,
  async search(context) {
    const url = `https://gamma-api.polymarket.com/markets?search=${encodeURIComponent(context.topic)}&limit=${context.limit}&active=true`;
    const data = await (await fetch(url)).json() as Array<{ question?: string; slug?: string; description?: string; volume?: string; endDate?: string }>;
    return data.map((market) => makeItem("polymarket", market.question || market.slug || "Polymarket market", `https://polymarket.com/event/${market.slug}`, {
      body: market.description,
      container: "Polymarket",
      publishedAt: market.endDate,
      engagement: { volume: Number(market.volume || 0) }
    }));
  }
};
