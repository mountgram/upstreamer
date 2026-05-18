import { describe, expect, it } from "vitest";
import { clusterItems, itemMatchesTopic, scoreItem } from "../src/ranking.js";
import type { EvidenceItem } from "../src/schema.js";

const item: EvidenceItem = {
  source: "reddit",
  title: "Open source agents are changing coding",
  url: "https://example.com/a",
  body: "Developers discuss coding agents",
  publishedAt: "2026-05-17T00:00:00Z",
  engagement: { score: 100, comments: 20 }
};

describe("ranking", () => {
  it("scores relevance, freshness, and engagement", () => {
    expect(scoreItem(item, "coding agents", new Date("2026-05-18T00:00:00Z"))).toBeGreaterThan(20);
  });

  it("clusters duplicate URLs", () => {
    const clusters = clusterItems([item, { ...item, source: "hackernews" }], "coding agents");
    expect(clusters).toHaveLength(1);
    expect(clusters[0].sources).toContain("reddit");
  });

  it("detects off-topic evidence before engagement can rank it", () => {
    expect(itemMatchesTopic({ source: "polymarket", title: "Will Jesus return before GTA VI?", url: "https://example.com" }, "AI coding agents")).toBe(false);
    expect(itemMatchesTopic({ source: "hackernews", title: "Jujutsu for AI coding agents", url: "https://example.com" }, "AI coding agents")).toBe(true);
  });
});
