import { afterEach, describe, expect, it, vi } from "vitest";
import { duckduckgo } from "../src/sources/duckduckgo.js";
import { allAdapters } from "../src/sources/index.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sources", () => {
  it("includes baseline DuckDuckGo and optional Exa", () => {
    expect(allAdapters.map((adapter) => adapter.name)).toEqual(expect.arrayContaining(["duckduckgo", "exa"]));
  });

  it("keeps source keys adapter-scoped", () => {
    const exa = allAdapters.find((adapter) => adapter.name === "exa")!;
    expect(exa.isAvailable({ EXA_API_KEY: "test" })).toBe(true);
    expect(exa.isAvailable({})).toBe(false);
  });

  it("falls back to DuckDuckGo HTML web results when instant answers are empty", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ RelatedTopics: [] })))
      .mockResolvedValueOnce(new Response('<a class="result-link" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fstory&amp;rut=abc">Agent coding story</a>'));

    const results = await duckduckgo.search({
      topic: "agent coding",
      plan: { topic: "agent coding", subqueries: ["agent coding"] },
      since: new Date("2026-04-18T00:00:00Z"),
      limit: 5,
      debug: false,
      env: {}
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results[0]).toMatchObject({ source: "duckduckgo", title: "Agent coding story", url: "https://example.com/story" });
  });
});
