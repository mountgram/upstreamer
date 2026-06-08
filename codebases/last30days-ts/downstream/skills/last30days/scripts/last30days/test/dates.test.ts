import { describe, it, expect } from "vitest";
import { getDateRange, formatDate, parseDate, daysAgo, recencyScore, timestampToDate, getDateConfidence } from "../src/dates.js";

describe("getDateRange", () => {
  it("returns a range of N days ending today", () => {
    const { from, to } = getDateRange(30);
    expect(from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const diff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBeGreaterThanOrEqual(29);
    expect(diff).toBeLessThanOrEqual(31);
  });

  it("defaults to 30 days", () => {
    const { from, to } = getDateRange();
    expect(from).toBeTruthy();
    expect(to).toBeTruthy();
  });

  it("handles custom lookback", () => {
    const { from, to } = getDateRange(7);
    const diff = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24);
    expect(diff).toBeGreaterThanOrEqual(6);
  });
});

describe("formatDate", () => {
  it("formats a date as YYYY-MM-DD", () => {
    const d = new Date(2024, 0, 15); // Jan 15, 2024
    expect(formatDate(d)).toBe("2024-01-15");
  });

  it("pads single-digit months and days", () => {
    expect(formatDate(new Date(2024, 0, 1))).toBe("2024-01-01");
    expect(formatDate(new Date(2024, 9, 5))).toBe("2024-10-05");
  });
});

describe("parseDate", () => {
  it("parses ISO 8601 strings", () => {
    const d = parseDate("2024-01-15T12:00:00Z");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getUTCFullYear()).toBe(2024);
  });

  it("parses YYYY-MM-DD strings", () => {
    const d = parseDate("2024-01-15");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2024);
  });

  it("parses Unix timestamps", () => {
    const d = parseDate("1705320000");
    expect(d).toBeInstanceOf(Date);
    expect(d!.getFullYear()).toBe(2024);
  });

  it("returns null for invalid dates", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });
});

describe("daysAgo", () => {
  it("returns 0 for today", () => {
    const today = new Date().toISOString();
    expect(daysAgo(today)).toBe(0);
  });

  it("returns positive number for past dates", () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    expect(daysAgo(yesterday)).toBeGreaterThanOrEqual(1);
  });
});

describe("recencyScore", () => {
  it("returns 100 for today", () => {
    const today = new Date().toISOString();
    expect(recencyScore(today)).toBe(100);
  });

  it("returns 0 for dates older than maxDays", () => {
    const oldDate = new Date(Date.now() - 31 * 86400000).toISOString();
    expect(recencyScore(oldDate, 30)).toBe(0);
  });

  it("returns intermediate scores", () => {
    const halfWay = new Date(Date.now() - 15 * 86400000).toISOString();
    const score = recencyScore(halfWay, 30);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});

describe("getDateConfidence", () => {
  it("returns high when date is in range", () => {
    const result = getDateConfidence("2024-01-15", "2024-01-01", "2024-01-31");
    expect(result).toBe("high");
  });

  it("returns low for missing date", () => {
    const result = getDateConfidence("", "2024-01-01", "2024-01-31");
    expect(result).toBe("low");
  });
});
