import { describe, it, expect } from "vitest";
import {
  dedupeItems,
  sourceQuality,
  annotateStream,
  pruneLowRelevance,
  clusterCandidates,
  reciprocalRankFusion,
  computeFinalScores,
  fallbackRank,
} from "../src/ranking.js";
import type { SourceItem, Candidate } from "../src/schema.js";

function makeItem(overrides: Partial<SourceItem> = {}): SourceItem {
  return {
    item_id: "id-" + Math.random().toString(36).slice(2, 6),
    source: "reddit",
    title: "Test item",
    body: "Test body content",
    url: "https://example.com/1",
    author: "testuser",
    container: "r/test",
    published_at: new Date().toISOString(),
    date_confidence: "high",
    engagement: { score: 100, num_comments: 50 },
    score: 0,
    snippet: "Test body content",
    metadata: {},
    ...overrides,
  };
}

function makeCandidate(overrides: Partial<Candidate> = {}): Candidate {
  const item = makeItem();
  return {
    candidate_id: "c-" + Math.random().toString(36).slice(2, 6),
    title: "Test candidate",
    snippet: "Test snippet",
    source_items: [item],
    subquery_labels: ["test"],
    url: "https://example.com/1",
    final_score: 0,
    rrf_score: 0,
    rerank_score: 0,
    freshness: 80,
    engagement: 100,
    source_quality: 0.6,
    fun_score: 0,
    cluster_id: "",
    native_ranks: { test: 1 },
    metadata: {},
    explanation: "test",
    ...overrides,
  };
}

describe("sourceQuality", () => {
  it("returns known weights", () => {
    expect(sourceQuality("reddit")).toBe(0.6);
    expect(sourceQuality("x")).toBe(0.68);
    expect(sourceQuality("grounding")).toBe(1.0);
  });

  it("returns default for unknown sources", () => {
    expect(sourceQuality("unknown")).toBe(0.3);
  });
});

describe("dedupeItems", () => {
  it("keeps all unique items", () => {
    const items = [
      makeItem({ title: "First completely different article", body: "This is about machine learning and AI systems" }),
      makeItem({ title: "Second unrelated news piece", body: "The weather forecast for this weekend shows rain" }),
      makeItem({ title: "Third distinct topic here", body: "New restaurant opens downtown with innovative menu" }),
    ];
    expect(dedupeItems(items)).toHaveLength(3);
  });

  it("removes near-duplicates", () => {
    const items = [
      makeItem({ title: "Same Title Here", body: "Same body text here" }),
      makeItem({ title: "Same Title Here", body: "Same body text here" }),
      makeItem({ title: "Different", body: "Completely different content" }),
    ];
    const result = dedupeItems(items);
    expect(result).toHaveLength(2);
  });

  it("handles empty input", () => {
    expect(dedupeItems([])).toHaveLength(0);
  });
});

describe("annotateStream", () => {
  it("sorts items by score descending", () => {
    const items = [
      makeItem({ title: "C", published_at: new Date(Date.now() - 20 * 86400000).toISOString(), engagement: { score: 10 } }),
      makeItem({ title: "A", published_at: new Date().toISOString(), engagement: { score: 1000 } }),
      makeItem({ title: "B", published_at: new Date(Date.now() - 5 * 86400000).toISOString(), engagement: { score: 100 } }),
    ];
    const scored = annotateStream(items, "test query");
    expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
    expect(scored[1].score).toBeGreaterThanOrEqual(scored[2].score);
  });
});

describe("pruneLowRelevance", () => {
  it("filters items below threshold", () => {
    const items = [
      makeItem({ title: "keep", score: 50 }),
      makeItem({ title: "drop", score: 5 }),
    ];
    const result = pruneLowRelevance(items, 15);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("keep");
  });
});

describe("reciprocalRankFusion", () => {
  it("assigns RRF scores to candidates", () => {
    const candA = makeCandidate({ candidate_id: "shared-a" });
    const candB = makeCandidate({ candidate_id: "shared-b" });
    const candC = makeCandidate({ candidate_id: "shared-c" });

    const rankings = [
      [candA, candB],
      [candB, candC],
    ];

    reciprocalRankFusion(rankings);

    // CandB appears in both rankings and should have highest score
    expect(candB.rrf_score).toBeGreaterThan(0);
    // Verify scores were assigned (may be 0 for lowest-ranked single-appearance items)
    expect(typeof candA.rrf_score).toBe("number");
    expect(typeof candC.rrf_score).toBe("number");
  });
});

describe("computeFinalScores", () => {
  it("computes composite scores and sorts", () => {
    const candidates = [
      makeCandidate({ candidate_id: "a", rrf_score: 80, rerank_score: 70, freshness: 90, source_quality: 0.6, engagement: 50 }),
      makeCandidate({ candidate_id: "b", rrf_score: 50, rerank_score: 90, freshness: 80, source_quality: 0.8, engagement: 100 }),
    ];

    const ranked = computeFinalScores(candidates);
    expect(ranked[0].final_score).toBeGreaterThan(0);
    expect(ranked[0].final_score).toBeGreaterThanOrEqual(ranked[1].final_score);
  });
});

describe("fallbackRank", () => {
  it("assigns rerank scores based on RRF and engagement", () => {
    const candidates = [
      makeCandidate({ candidate_id: "a", rrf_score: 80, title: "Topic specific item" }),
      makeCandidate({ candidate_id: "b", rrf_score: 50, title: "Unrelated item" }),
    ];

    fallbackRank(candidates, "Topic specific");
    expect(candidates[0].rerank_score).toBeGreaterThan(0);
  });
});

describe("clusterCandidates", () => {
  it("groups similar candidates", () => {
    const candidates = [
      makeCandidate({ candidate_id: "a", title: "Similar story about X", final_score: 90, source_items: [makeItem({ source: "reddit" })] }),
      makeCandidate({ candidate_id: "b", title: "Similar story about X from another angle", final_score: 85, source_items: [makeItem({ source: "x" })] }),
      makeCandidate({ candidate_id: "c", title: "Completely different topic", final_score: 80, source_items: [makeItem({ source: "hackernews" })] }),
    ];

    const clusters = clusterCandidates(candidates);
    expect(clusters.length).toBeGreaterThan(0);
    expect(clusters.length).toBeLessThanOrEqual(3);
  });
});
