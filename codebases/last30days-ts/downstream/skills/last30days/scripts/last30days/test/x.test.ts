import { describe, it, expect } from "vitest";

describe("xAI/X adapter internals", () => {
  it("extractOutputText handles output_text shortcut", async () => {
    const mod = await import("../src/sources/x.js");
    const text = mod.__test__.extractOutputText({ output_text: "[]" });
    expect(text).toBe("[]");
  });

  it("extractOutputText falls back to message output path", async () => {
    const mod = await import("../src/sources/x.js");
    const text = mod.__test__.extractOutputText({
      output: [
        { type: "custom_tool_call" },
        { type: "message", content: [{ type: "output_text", text: "[]" }] },
      ],
    });
    expect(text).toBe("[]");
  });

  it("extractOutputText returns empty string for empty response", async () => {
    const mod = await import("../src/sources/x.js");
    const text = mod.__test__.extractOutputText({});
    expect(text).toBe("");
  });

  it("parseXPosts handles valid JSON array", async () => {
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
    expect(posts[0].author_handle).toBe("@example");
  });

  it("parseXPosts handles fenced JSON array", async () => {
    const mod = await import("../src/sources/x.js");
    const posts = mod.__test__.parseXPosts(`
\`\`\`json
[
  {
    "author_handle": "user1",
    "text": "test post",
    "url": "https://x.com/user1/status/999",
    "created_at": "2026-06-05T09:32:01Z"
  }
]
\`\`\``);
    expect(posts).toHaveLength(1);
    expect(posts[0].text).toBe("test post");
  });

  it("parseXPosts filters out objects without text", async () => {
    const mod = await import("../src/sources/x.js");
    const posts = mod.__test__.parseXPosts(`[
      { "author_handle": "u1", "text": "valid" },
      { "author_handle": "u2", "text": "" },
      { "author_handle": "u3" }
    ]`);
    expect(posts).toHaveLength(1);
    expect(posts[0].text).toBe("valid");
  });

  it("parseXPosts returns empty array for non-array input", async () => {
    const mod = await import("../src/sources/x.js");
    expect(mod.__test__.parseXPosts("not json")).toEqual([]);
    expect(mod.__test__.parseXPosts("{}")).toEqual([]);
  });

  it("extractStatusId extracts numeric id from URL", async () => {
    const mod = await import("../src/sources/x.js");
    expect(mod.__test__.extractStatusId("https://x.com/user/status/12345")).toBe("12345");
    expect(mod.__test__.extractStatusId("https://twitter.com/user/status/67890")).toBe("67890");
    expect(mod.__test__.extractStatusId(undefined)).toBeUndefined();
    expect(mod.__test__.extractStatusId("https://x.com/user")).toBeUndefined();
  });

  it("normalizeXDate handles full ISO 8601", async () => {
    const mod = await import("../src/sources/x.js");
    const result = mod.__test__.normalizeXDate("2026-06-05T09:32:01Z");
    expect(result).toBe("2026-06-05T09:32:01.000Z");
  });

  it("normalizeXDate handles log-style dates with year inference", async () => {
    const mod = await import("../src/sources/x.js");
    const result = mod.__test__.normalizeXDate("Jun 6 10:44:46 UTC");
    expect(result).toContain(new Date().getFullYear().toString());
  });

  it("normalizeXDate returns current ISO date for undefined input", async () => {
    const mod = await import("../src/sources/x.js");
    const result = mod.__test__.normalizeXDate(undefined);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  it("normalizeXDate handles relative date strings gracefully", async () => {
    const mod = await import("../src/sources/x.js");
    const result = mod.__test__.normalizeXDate("2 hours ago");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(10);
  });

  it("searchX returns empty array when no API key is set", async () => {
    const mod = await import("../src/sources/x.js");
    const result = await mod.searchX(
      "test query",
      "2026-01-01",
      "2026-06-01",
      "quick",
      {},
      { debug: false }
    );
    expect(result).toEqual([]);
  });
});
