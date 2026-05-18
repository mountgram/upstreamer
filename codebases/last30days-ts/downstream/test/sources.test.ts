import { describe, expect, it } from "vitest";
import { allAdapters } from "../src/sources/index.js";

describe("sources", () => {
  it("includes baseline DuckDuckGo and optional Exa", () => {
    expect(allAdapters.map((adapter) => adapter.name)).toEqual(expect.arrayContaining(["duckduckgo", "exa"]));
  });

  it("keeps source keys adapter-scoped", () => {
    const exa = allAdapters.find((adapter) => adapter.name === "exa")!;
    expect(exa.isAvailable({ EXA_API_KEY: "test" })).toBe(true);
    expect(exa.isAvailable({})).toBe(false);
  });
});
