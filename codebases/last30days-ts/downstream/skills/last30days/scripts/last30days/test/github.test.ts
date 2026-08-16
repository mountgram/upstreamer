import { describe, it, expect } from "vitest";
import { stripSearchQualifiers } from "../src/sources/github.js";

describe("stripSearchQualifiers", () => {
  it("removes planner-injected qualifiers from a topic", () => {
    expect(stripSearchQualifiers("open source AI stars:>1000 created:>2025-03-20")).toBe(
      "open source AI"
    );
  });

  it("collapses whitespace left behind by removed qualifiers", () => {
    expect(stripSearchQualifiers("rust async  language:typescript  stars:>500")).toBe(
      "rust async"
    );
  });

  it("preserves plain-language text with no qualifiers", () => {
    expect(stripSearchQualifiers("react server components")).toBe("react server components");
  });

  it("returns empty string for a qualifier-only topic", () => {
    expect(stripSearchQualifiers("stars:>1000 created:>2025-03-20")).toBe("");
  });

  it("handles quoted and comparator values", () => {
    expect(stripSearchQualifiers("topic:\"machine learning\" ai")).toBe("ai");
    expect(stripSearchQualifiers("search react")).toBe("search react");
  });
});
