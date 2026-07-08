import type { SourceItem } from "../schema.js";

const UA = "Mozilla/5.0 (last30days-ts stocktwits source)";
const STREAM_URL = "https://api.stocktwits.com/api/2/streams/symbol/{symbol}.json";
const SEARCH_URL = "https://api.stocktwits.com/api/2/search/symbols.json";

const FINANCE_HINTS = /\b(stock|stocks|ticker|cashtag|equit(?:y|ies)|price target|earnings|premarket|pre-?market|after\s?hours|dividend|valuation|crypto|altcoin|defi|market cap|bullish|bearish|bitcoin|btc|ethereum|solana|dogecoin|cardano|xrp|\$[A-Za-z]{1,5}(?:\.[A-Z])?)\b/i;
const CASHTAG = /\$([A-Za-z]{1,5}(?:\.[A-Z])?)\b/g;

const CRYPTO_ALIASES: Record<string, string> = {
  bitcoin: "BTC.X", btc: "BTC.X",
  ethereum: "ETH.X", eth: "ETH.X",
  solana: "SOL.X", sol: "SOL.X",
  dogecoin: "DOGE.X", doge: "DOGE.X",
  ripple: "XRP.X", xrp: "XRP.X",
  cardano: "ADA.X", ada: "ADA.X",
};

const DEPTH_LIMITS: Record<string, number> = {
  quick: 30,
  medium: 60,
  deep: 120,
};

export function isFinancialTopic(topic: string): boolean {
  return CASHTAG.test(topic) || FINANCE_HINTS.test(topic);
}

async function getJson(url: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  const resp = await fetch(url, {
    headers: { "User-Agent": UA },
    signal,
  });
  if (!resp.ok) throw new Error(`StockTwits API returned ${resp.status}`);
  return (await resp.json()) as Record<string, unknown>;
}

function detectSymbolsLocal(topic: string): string[] {
  const found: string[] = [];
  CASHTAG.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CASHTAG.exec(topic)) !== null) {
    const sym = m[1].toUpperCase();
    if (!found.includes(sym)) found.push(sym);
  }

  const lowered = topic.toLowerCase();
  for (const [alias, sym] of Object.entries(CRYPTO_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(lowered) && !found.includes(sym)) {
      found.push(sym);
    }
  }

  return found.slice(0, 2);
}

export async function detectSymbols(topic: string): Promise<string[]> {
  const local = detectSymbolsLocal(topic);
  if (local.length > 0) return local;

  if (!isFinancialTopic(topic)) return [];

  const name = topic.replace(/\b(stock|stocks|shares?|price|ticker|earnings|forecast|crypto|token|coin|news|today|now)\b/gi, "").trim();
  if (!name) return [];

  try {
    const url = `${SEARCH_URL}?${new URLSearchParams({ q: name })}`;
    const data = await getJson(url);
    const results = (data.results as Record<string, unknown>[]) ?? [];
    const found: string[] = [];
    for (const r of results) {
      const sym = String(r.symbol ?? "").toUpperCase();
      if (sym && !found.includes(sym)) found.push(sym);
      if (found.length >= 2) break;
    }
    return found;
  } catch {
    return [];
  }
}

function filterByDate(messages: Record<string, unknown>[], from: string, to: string): Record<string, unknown>[] {
  if (!from && !to) return messages;
  return messages.filter((m) => {
    const d = String(m.created_at ?? "").slice(0, 10);
    if (from && d && d < from) return false;
    if (to && d && d > to) return false;
    return true;
  });
}

function aggregateSentiment(messages: Record<string, unknown>[]): Record<string, unknown> {
  let bull = 0, bear = 0;
  for (const m of messages) {
    const s = ((m.entities as Record<string, unknown>)?.sentiment as Record<string, unknown>)?.basic as string | undefined;
    if (s === "Bullish") bull++;
    else if (s === "Bearish") bear++;
  }
  const tagged = bull + bear;
  return {
    bullish: bull,
    bearish: bear,
    untagged: messages.length - tagged,
    pct_bullish: tagged ? Math.round((100 * bull) / tagged) : null,
    sample: messages.length,
  };
}

function parseStocktwitsResponse(
  response: Record<string, unknown>,
  query: string,
): SourceItem[] {
  const messages = (response.messages as Record<string, unknown>[]) ?? [];
  const symbols = (response.symbols as string[]) ?? [];
  const symbol = symbols[0] ?? "";
  const agg = aggregateSentiment(messages);

  return messages.map((m, i) => {
    const user = (m.user as Record<string, unknown>) ?? {};
    const username = String(user.username ?? "unknown");
    const body = String(m.body ?? "").trim();
    const entities = (m.entities as Record<string, unknown>) ?? {};
    const sentiment = ((entities.sentiment as Record<string, unknown>) ?? {}).basic as string | undefined;
    const likes = ((m.likes as Record<string, unknown>) ?? {}).total as number ?? 0;
    const reshares = ((m.reshares as Record<string, unknown>) ?? {}).reshared_count as number ?? 0;
    const followers = (user.followers as number) ?? 0;
    const relevance = Math.min(1.0, 0.7 + (sentiment ? 0.1 : 0) + Math.min(0.2, followers / 50000));
    const created = String(m.created_at ?? "");
    const date = created.slice(0, 10) || undefined;

    return {
      item_id: String(m.id ?? `ST${i + 1}`),
      source: "stocktwits",
      title: body.slice(0, 120) || `$${symbol} post`,
      body,
      url: `https://stocktwits.com/${username}/message/${m.id ?? ""}`,
      author: username,
      container: `$${symbol}`,
      published_at: created ? new Date(created).toISOString() : new Date().toISOString(),
      date_confidence: created ? "high" : "low",
      engagement: { likes, reshares, followers },
      score: 0,
      snippet: body.slice(0, 400),
      metadata: {
        sentiment,
        symbol,
        sentiment_aggregate: agg,
        watchlist: response.watchlist,
        relevance: Math.round(relevance * 100) / 100,
      },
    };
  });
}

export async function searchStocktwits(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
): Promise<SourceItem[]> {
  if (!isFinancialTopic(query)) return [];

  const symbols = await detectSymbols(query);
  if (symbols.length === 0) return [];

  const symbol = symbols[0];
  const target = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const messages: Record<string, unknown>[] = [];
  let cursorMax: number | undefined;
  let watchlist: number | undefined;
  const controller = new AbortController();

  try {
    while (messages.length < target) {
      let url = STREAM_URL.replace("{symbol}", encodeURIComponent(symbol));
      if (cursorMax) url += `?max=${cursorMax}`;
      const data = await getJson(url, controller.signal);
      if (watchlist === undefined) {
        watchlist = ((data.symbol as Record<string, unknown>) ?? {}).watchlist_count as number;
      }
      const batch = (data.messages as Record<string, unknown>[]) ?? [];
      if (batch.length === 0) break;
      messages.push(...batch);

      const cursor = data.cursor as Record<string, unknown> | undefined;
      if (!cursor?.more || !cursor.max) break;
      cursorMax = cursor.max as number;
      // Rate-limiting courtesy
      await new Promise((r) => setTimeout(r, 800));
    }
  } catch {
    // Degrade gracefully on partial results
  }

  const filtered = filterByDate(messages, fromDate, toDate);
  const response = { messages: filtered, symbols, watchlist };

  return parseStocktwitsResponse(response, query);
}

export const __test__ = {
  isFinancialTopic,
  detectSymbolsLocal,
  aggregateSentiment,
  filterByDate,
  parseStocktwitsResponse,
};
