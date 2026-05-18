import { describe, expect, it } from "vitest";
import { isWithinLookback, startOfLookback } from "../src/dates.js";

describe("dates", () => {
  it("computes a UTC lookback start", () => {
    expect(startOfLookback(new Date("2026-05-18T12:00:00Z"), 30).toISOString()).toBe("2026-04-18T12:00:00.000Z");
  });

  it("accepts missing dates and filters old dates", () => {
    const since = new Date("2026-04-18T00:00:00Z");
    expect(isWithinLookback(undefined, since)).toBe(true);
    expect(isWithinLookback("2026-05-01T00:00:00Z", since)).toBe(true);
    expect(isWithinLookback("2026-04-01T00:00:00Z", since)).toBe(false);
  });
});
