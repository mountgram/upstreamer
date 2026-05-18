import type { SourceItem } from "../schema.js";

interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  volumeNum: number;
  liquidityNum: number;
  outcomes?: { outcome: string; price: number }[];
  outcomePrices?: string;
  endDate: string | null;
  createdAt: string;
  slug: string;
  tags?: { label: string }[];
}

interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  volumeNum: number;
  liquidityNum: number;
  endDate: string | null;
  createdAt: string;
  slug: string;
  tags?: { label: string }[];
  markets?: PolymarketMarket[];
}

function dateConfidence(published_at: string): "high" | "med" | "low" {
  if (!published_at) return "low";
  const d = new Date(published_at);
  if (isNaN(d.getTime())) return "low";
  const now = Date.now();
  const age = now - d.getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (age <= thirtyDays) return "high";
  if (age <= 60 * 24 * 60 * 60 * 1000) return "med";
  return "low";
}

function marketUrl(slug: string): string {
  return `https://polymarket.com/event/${slug}`;
}

function parseOutcomePrices(outcomePricesStr?: string): Record<string, number> {
  if (!outcomePricesStr) return {};
  try {
    const parsed = JSON.parse(outcomePricesStr) as Record<string, unknown>;
    const prices: Record<string, number> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "number") {
        prices[key] = value;
      }
    }
    return prices;
  } catch {
    return {};
  }
}

function normalizeMarket(market: PolymarketMarket): SourceItem {
  const outcomePrices = parseOutcomePrices(market.outcomePrices);
  const outcomeList =
    market.outcomes?.map((o) => `${o.outcome}: ${o.price}`) ?? [];

  return {
    source: "polymarket",
    item_id: market.id,
    title: market.question,
    body: market.description || market.question,
    url: marketUrl(market.slug),
    author: "",
    container: "Polymarket",
    published_at: market.createdAt || market.endDate || new Date().toISOString(),
    date_confidence: dateConfidence(market.createdAt || market.endDate || ""),
    engagement: {
      volume: market.volumeNum || 0,
      liquidity: market.liquidityNum || 0,
    },
    score: 0,
    snippet: market.description
      ? market.description.slice(0, 300)
      : market.question,
    metadata: {
      outcome_prices: outcomePrices,
      outcomes: outcomeList,
      tags: market.tags?.map((t) => t.label) ?? [],
    },
  };
}

function normalizeEvent(event: PolymarketEvent): SourceItem {
  return {
    source: "polymarket",
    item_id: event.id,
    title: event.title,
    body: event.description || event.title,
    url: marketUrl(event.slug),
    author: "",
    container: "Polymarket",
    published_at: event.createdAt || event.endDate || new Date().toISOString(),
    date_confidence: dateConfidence(event.createdAt || event.endDate || ""),
    engagement: {
      volume: event.volumeNum || 0,
      liquidity: event.liquidityNum || 0,
    },
    score: 0,
    snippet: event.description
      ? event.description.slice(0, 300)
      : event.title,
    metadata: {
      outcome_prices: {},
      outcomes: event.markets?.map((m) => m.question) ?? [],
      tags: event.tags?.map((t) => t.label) ?? [],
    },
  };
}

async function fetchMarkets(
  query: string,
  limit: number
): Promise<SourceItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://gamma-api.polymarket.com/markets?tag=${encodedQuery}&limit=${limit}&closed=false`;

  const resp = await fetch(url);
  if (!resp.ok) return [];

  const data = (await resp.json()) as PolymarketMarket[];
  if (!Array.isArray(data)) return [];

  return data.slice(0, limit).map(normalizeMarket);
}

async function fetchEvents(
  query: string,
  limit: number
): Promise<SourceItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://gamma-api.polymarket.com/events?tag=${encodedQuery}&limit=${limit}`;

  const resp = await fetch(url);
  if (!resp.ok) return [];

  const data = (await resp.json()) as PolymarketEvent[];
  if (!Array.isArray(data)) return [];

  return data.slice(0, limit).map(normalizeEvent);
}

export async function searchPolymarket(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string
): Promise<SourceItem[]> {
  const depthLimits: Record<string, number> = { quick: 3, medium: 8, deep: 20 };
  const limit = depthLimits[depth] || 8;

  try {
    const [markets, events] = await Promise.all([
      fetchMarkets(query, limit),
      fetchEvents(query, limit),
    ]);

    const items = [...markets, ...events];

    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setDate(to.getDate() + 1);

    const filtered = items.filter((item) => {
      const d = new Date(item.published_at);
      return d >= from && d <= to;
    });

    return filtered.slice(0, limit * 2);
  } catch {
    return [];
  }
}
