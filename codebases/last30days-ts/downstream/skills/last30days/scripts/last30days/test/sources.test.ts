import { afterEach, describe, it, expect, vi } from "vitest";
import type { SourceItem } from "../src/schema.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

// Test that source adapters produce correctly shaped output
describe("Source adapter shapes", () => {
  // We test the shape contract, not live network calls
  const requiredFields = [
    "item_id",
    "source",
    "title",
    "body",
    "url",
    "author",
    "container",
    "published_at",
    "date_confidence",
    "engagement",
    "score",
    "snippet",
    "metadata",
  ];

  function isValidSourceItem(item: unknown): item is SourceItem {
    if (!item || typeof item !== "object") return false;
    return requiredFields.every(f => f in item);
  }

  it("SourceItem shape is valid", () => {
    const item: SourceItem = {
      item_id: "test-1",
      source: "exa",
      title: "Test",
      body: "Test body",
      url: "https://example.com",
      author: "",
      container: "example.com",
      published_at: new Date().toISOString(),
      date_confidence: "high",
      engagement: { views: 100 },
      score: 85,
      snippet: "Test body",
      metadata: {},
    };
    expect(isValidSourceItem(item)).toBe(true);
  });

  it("date_confidence is one of high/med/low", () => {
    const valid = ["high", "med", "low"];
    const item: SourceItem = {
      item_id: "t",
      source: "reddit",
      title: "T",
      body: "B",
      url: "https://x.com",
      author: "a",
      container: "c",
      published_at: new Date().toISOString(),
      date_confidence: "high",
      engagement: {},
      score: 0,
      snippet: "",
      metadata: {},
    };
    expect(valid).toContain(item.date_confidence);
  });

  it("engagement is a Record<string, number>", () => {
    const item: SourceItem = {
      item_id: "t",
      source: "x",
      title: "T",
      body: "B",
      url: "https://x.com",
      author: "a",
      container: "c",
      published_at: new Date().toISOString(),
      date_confidence: "med",
      engagement: { likes: 10, reposts: 5 },
      score: 0,
      snippet: "",
      metadata: {},
    };
    expect(typeof item.engagement.likes).toBe("number");
    expect(typeof item.engagement.reposts).toBe("number");
  });

  it("metadata is a Record<string, unknown>", () => {
    const item: SourceItem = {
      item_id: "t",
      source: "github",
      title: "T",
      body: "B",
      url: "https://github.com",
      author: "a",
      container: "c",
      published_at: new Date().toISOString(),
      date_confidence: "high",
      engagement: {},
      score: 0,
      snippet: "",
      metadata: { stars: 100, language: "TypeScript", topics: ["ai"] },
    };
    expect(item.metadata.stars).toBe(100);
  });
});

describe("No-key source availability", () => {
  it("Reddit adapter is importable", async () => {
    const mod = await import("../src/sources/reddit.js");
    expect(typeof mod.searchReddit).toBe("function");
  });

  it("HackerNews adapter is importable", async () => {
    const mod = await import("../src/sources/hackernews.js");
    expect(typeof mod.searchHackerNews).toBe("function");
  });

  it("GitHub adapter is importable", async () => {
    const mod = await import("../src/sources/github.js");
    expect(typeof mod.searchGitHub).toBe("function");
  });

  it("Polymarket adapter is importable", async () => {
    const mod = await import("../src/sources/polymarket.js");
    expect(typeof mod.searchPolymarket).toBe("function");
  });

  it("YouTube adapter is importable", async () => {
    const mod = await import("../src/sources/youtube.js");
    expect(typeof mod.searchYouTube).toBe("function");
  });

  it("Digg adapter is importable", async () => {
    const mod = await import("../src/sources/digg.js");
    expect(typeof mod.searchDigg).toBe("function");
  });

  it("StockTwits adapter is importable and gating works", async () => {
    const mod = await import("../src/sources/stocktwits.js");
    expect(typeof mod.searchStocktwits).toBe("function");
    expect(typeof mod.isFinancialTopic).toBe("function");

    const { isFinancialTopic: isFin, detectSymbolsLocal } = mod.__test__;

    expect(isFin("AI news")).toBe(false);
    expect(isFin("NVIDIA stock price")).toBe(true);
    expect(isFin("$NOW earnings")).toBe(true);
    expect(isFin("Bitcoin price prediction")).toBe(true);

    expect(detectSymbolsLocal("Check out $AAPL")).toEqual(["AAPL"]);
    expect(detectSymbolsLocal("bitcoin price")).toEqual(["BTC.X"]);
    expect(detectSymbolsLocal("ethereum and solana")).toEqual(["ETH.X", "SOL.X"]);
  });
});

describe("Key-based source adapters are importable", () => {
  it("Exa adapter is importable", async () => {
    const mod = await import("../src/sources/exa.js");
    expect(typeof mod.searchExa).toBe("function");
  });

  it("Brave adapter is importable", async () => {
    const mod = await import("../src/sources/brave.js");
    expect(typeof mod.searchBrave).toBe("function");
  });

  it("Serper adapter is importable", async () => {
    const mod = await import("../src/sources/serper.js");
    expect(typeof mod.searchSerper).toBe("function");
  });

  it("X adapter is importable", async () => {
    const mod = await import("../src/sources/x.js");
    expect(typeof mod.searchX).toBe("function");
  });

  it("OpenAI web adapter is importable", async () => {
    const mod = await import("../src/sources/openai_web.js");
    expect(typeof mod.searchOpenAIWeb).toBe("function");
  });

  it("Gemini YouTube adapter is importable", async () => {
    const mod = await import("../src/sources/gemini_youtube.js");
    expect(typeof mod.searchGeminiYouTube).toBe("function");
  });

  it("Gemini Maps adapter is importable", async () => {
    const mod = await import("../src/sources/gemini_maps.js");
    expect(typeof mod.searchGeminiMaps).toBe("function");
  });

  it("Gemini Maps adapter builds Maps and Search grounding request bodies", async () => {
    const mod = await import("../src/sources/gemini_maps.js");
    const mapsBody = mod.__test__.buildGeminiMapsRequestBody("restaurants in Lisbon", 4, "googleMaps");
    const searchBody = mod.__test__.buildGeminiMapsRequestBody("restaurants in Lisbon", 4, "googleSearch");

    expect(mapsBody.tools).toEqual([{ googleMaps: {} }]);
    expect(searchBody.tools).toEqual([{ googleSearch: {} }]);
    expect(JSON.stringify(mapsBody)).toContain("Google Maps grounding");
    expect(JSON.stringify(searchBody)).toContain("Google Search grounding");
  });

  it("Gemini Maps adapter parses fenced JSON arrays", async () => {
    const mod = await import("../src/sources/gemini_maps.js");
    const results = mod.__test__.parseGeminiJsonArray("```json\n[{\"title\":\"Lisbon\",\"summary\":\"Capital city\"}]\n```");

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Lisbon");
  });

  it("Gemini Maps adapter falls back to Search grounding when Maps fails", async () => {
    const mod = await import("../src/sources/gemini_maps.js");
    const requests: Record<string, unknown>[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      requests.push(JSON.parse(String(init?.body)) as Record<string, unknown>);
      if (requests.length === 1) return new Response("bad request", { status: 400 });
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: '[{"title":"Fallback Cafe","summary":"Found via search"}]' }] } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));

    const results = await mod.searchGeminiMaps("coffee near Lisbon", "", "", "quick", { geminiApiKey: "test-key" });

    expect(requests).toHaveLength(2);
    expect(requests[0].tools).toEqual([{ googleMaps: {} }]);
    expect(requests[1].tools).toEqual([{ googleSearch: {} }]);
    expect(results).toHaveLength(1);
    expect(results[0].metadata.grounding).toBe("google_search_maps_fallback");
  });

  it("X adapter parses Responses API output_text JSON", async () => {
    const mod = await import("../src/sources/x.js");
    const posts = mod.__test__.parseXPosts(`[
      {
        "author_handle": "@example",
        "text": "AI news from this week",
        "url": "https://x.com/example/status/12345",
        "created_at": "2026-06-05T09:32:01Z"
      }
    ]`);

    expect(posts).toHaveLength(1);
    expect(posts[0].text).toContain("AI news");
    expect(mod.__test__.extractStatusId(posts[0].url)).toBe("12345");
  });

  it("X adapter normalizes provider date strings", async () => {
    const mod = await import("../src/sources/x.js");
    expect(mod.__test__.normalizeXDate("2026-06-05T09:32:01Z")).toBe("2026-06-05T09:32:01.000Z");
    expect(mod.__test__.normalizeXDate("Jun 6 10:44:46 UTC")).toContain("2026-06-06T10:44:46.000Z");
  });

  it("X adapter extracts message output_text when output_text shortcut is absent", async () => {
    const mod = await import("../src/sources/x.js");
    const text = mod.__test__.extractOutputText({
      output: [
        { type: "custom_tool_call" },
        { type: "message", content: [{ type: "output_text", text: "[]" }] },
      ],
    });

    expect(text).toBe("[]");
  });

  it("Bluesky adapter is importable", async () => {
    const mod = await import("../src/sources/bluesky.js");
    expect(typeof mod.searchBluesky).toBe("function");
  });
});
