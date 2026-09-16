import { describe, it, expect, vi, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GitHub qualifier stripping", () => {
  it("strips search qualifiers and leaves plain text", async () => {
    const mod = await import("../src/sources/github.js");
    const strip = mod.__test__.stripSearchQualifiers;
    expect(strip("AI agents created:>2026-01-01")).toBe("AI agents");
    expect(strip("react framework language:typescript")).toBe("react framework");
    expect(strip("(created:>2026-01-01) kubernetes")).toBe("kubernetes");
  });

  it("returns empty string for qualifier-only topics", async () => {
    const mod = await import("../src/sources/github.js");
    const strip = mod.__test__.stripSearchQualifiers;
    expect(strip("is:issue created:>2026-01-01")).toBe("");
    expect(strip("language:typescript stars:>100")).toBe("");
  });
});

describe("Meta Ads adapter helpers", () => {
  it("reads searchResults vs results envelopes", async () => {
    const mod = await import("../src/sources/meta_ads.js");
    const { envelopeRows } = mod.__testMetaAds();
    expect(envelopeRows({ searchResults: [{ page_id: "1" }] })).toHaveLength(1);
    expect(envelopeRows({ results: [{ page_id: "2" }] })).toHaveLength(1);
    expect(envelopeRows({ ads: [{ page_id: "3" }] })).toHaveLength(1);
    expect(envelopeRows({})).toHaveLength(0);
  });

  it("groups advertiser rows busiest first", async () => {
    const mod = await import("../src/sources/meta_ads.js");
    const { groupAdvertisers } = mod.__testMetaAds();
    const pages = groupAdvertisers([
      { page_id: "a", page_name: "Acme" },
      { page_id: "a", page_name: "Acme" },
      { page_id: "b", page_name: "Beta" },
    ]);
    expect(pages[0].id).toBe("a");
    expect(pages[0].ads).toBe(2);
    expect(pages).toHaveLength(2);
  });

  it("extracts promo codes and launch dates", async () => {
    const mod = await import("../src/sources/meta_ads.js");
    const { extractPromoCode, launchDate } = mod.__testMetaAds();
    expect(extractPromoCode("Use code SUMMER20 for 20% off")).toBe("SUMMER20");
    expect(extractPromoCode("No promo here")).toBeNull();
    expect(launchDate({ start_date_string: "2026-08-01T00:00:00Z" })).toBe("2026-08-01");
  });
});

describe("Telegram adapter helpers", () => {
  it("normalizes channel handles", async () => {
    const mod = await import("../src/sources/telegram.js");
    const { parseChannelHandle, parseChannelSources } = mod.__test__;
    expect(parseChannelHandle("aipost")).toBe("aipost");
    expect(parseChannelHandle("@aipost")).toBe("aipost");
    expect(parseChannelHandle("https://t.me/aipost")).toBe("aipost");
    expect(parseChannelHandle("https://t.me/s/aipost")).toBe("aipost");
    expect(() => parseChannelHandle("https://t.me/joinchat/abc")).toThrow();
    expect(() => parseChannelHandle("-1001234567890")).toThrow();
  });

  it("parses and de-dupes channel source lists", async () => {
    const mod = await import("../src/sources/telegram.js");
    const { parseChannelSources } = mod.__test__;
    expect(parseChannelSources("aipost, @techcrunch, t.me/aipost")).toEqual(["aipost", "techcrunch"]);
    expect(parseChannelSources("")).toEqual([]);
  });
});

describe("Config .env parsing and API root normalization", () => {
  it("strips trailing inline comments but keeps quoted hashes", async () => {
    const mod = await import("../src/config.js");
    expect(mod.stripInlineComment("abc123 # my comment")).toBe("abc123");
    expect(mod.stripInlineComment("abc123#nohash")).toBe("abc123#nohash");
    expect(mod.stripInlineComment('"abc # def"')).toBe('"abc # def"');
  });

  it("normalizes API roots to a base URL", async () => {
    const mod = await import("../src/config.js");
    expect(mod.normalizeApiRoot("https://host/v1")).toBe("https://host/v1");
    expect(mod.normalizeApiRoot("https://host/v1/")).toBe("https://host/v1");
    expect(mod.normalizeApiRoot("https://host")).toBe("https://host");
    expect(mod.normalizeApiRoot(undefined)).toBeUndefined();
    expect(mod.normalizeApiRoot("  ")).toBeUndefined();
  });
});

describe("Reddit negative-engagement clamp", () => {
  it("clamps downvoted posts to zero engagement instead of negative", async () => {
    const withinWindow = Math.floor(Date.UTC(2026, 5, 15) / 1000); // 2026-06-15
    const redditListing = {
      kind: "Listing",
      data: {
        children: [
          {
            kind: "t3",
            data: {
              id: "downvoted1",
              title: "An unpopular but on-topic post",
              selftext: "body",
              permalink: "/r/test/comments/downvoted1/post/",
              author: "someone",
              subreddit_name_prefixed: "r/test",
              created_utc: withinWindow,
              score: -42,
              num_comments: 3,
            },
          },
        ],
        after: null,
      },
    };

    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(redditListing), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })));

    const mod = await import("../src/sources/reddit.js");
    const items = await mod.searchReddit("unpopular topic", "2026-06-01", "2026-07-01", "quick");
    const score = items.find((i: { item_id: string }) => i.item_id === "downvoted1")?.engagement.score;
    expect(score).toBe(0);
  });
});
