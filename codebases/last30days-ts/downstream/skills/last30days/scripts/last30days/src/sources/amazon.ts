import { spawnSync } from "node:child_process";
import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

// Amazon buyer-signal source via the Bright Data CLI. One product search plus
// optional review pulls produce live aggregate stats (rating, rating count,
// price) and a recent-window review sample. Gated on the `brightdata` binary
// and a credential signal (BRIGHTDATA_API_KEY or the CLI's own login).

const CLI_BIN = "brightdata";
const SEARCH_PIPELINE = "amazon_product_search";
const REVIEWS_PIPELINE = "amazon_product_reviews";
const DEFAULT_DOMAIN = "https://www.amazon.com";

const DEPTH_CONFIG: Record<string, number> = { quick: 0, medium: 3, deep: 5 };
const MAX_REVIEWS = 50;

function brightdataAvailable(): boolean {
  try {
    const result = spawnSync("which", [CLI_BIN], { stdio: "ignore", timeout: 5000 });
    return result.status === 0;
  } catch {
    return false;
  }
}

function runPipeline(
  pipeline: string,
  params: string[],
  timeout: number,
  apiKey?: string
): { records: Record<string, unknown>[]; error?: string } {
  if (!brightdataAvailable()) return { records: [], error: `${CLI_BIN} not on PATH` };

  const cliTimeout = Math.max(5, timeout - 10);
  const args = [CLI_BIN, "pipelines", pipeline, "--json", "--timeout", String(cliTimeout), "--", ...params];
  const env = apiKey ? { ...process.env, BRIGHTDATA_API_KEY: apiKey } : process.env;

  try {
    const result = spawnSync(args[0], args.slice(1), {
      encoding: "utf-8",
      timeout: timeout * 1000,
      env,
    });
    const stderr = (result.stderr || "").trim();
    if (result.status !== 0) {
      const lines = stderr.split("\n").map((l) => l.trim()).filter(Boolean);
      return { records: [], error: lines[lines.length - 1] || `exit ${result.status}` };
    }
    const stdout = (result.stdout || "").trim();
    if (!stdout) return { records: [] };
    const payload = JSON.parse(stdout) as unknown;
    if (Array.isArray(payload)) {
      return { records: payload.filter((r): r is Record<string, unknown> => !!r && typeof r === "object") };
    }
    if (payload && typeof payload === "object") {
      for (const key of ["records", "results", "data"]) {
        const value = (payload as Record<string, unknown>)[key];
        if (Array.isArray(value)) {
          return { records: value.filter((r): r is Record<string, unknown> => !!r && typeof r === "object") };
        }
      }
    }
    return { records: [] };
  } catch (err) {
    return { records: [], error: err instanceof Error ? err.message : String(err) };
  }
}

function asNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildProduct(record: Record<string, unknown>): SourceItem | null {
  const asin = String(record.asin || "").trim();
  const rawUrl = String(record.url || "").trim();
  const name = String(record.name || "").trim();
  if (!/^[A-Za-z0-9]{10}$/.test(asin) || !name) return null;

  const url = rawUrl.includes("amazon.") ? rawUrl : `${DEFAULT_DOMAIN}/dp/${asin}`;
  const rating = asNumber(record.rating);
  const numRatings = Math.round(asNumber(record.num_ratings));
  const price = asNumber(record.final_price);
  const brand = String(record.brand || "").trim();

  return {
    item_id: asin,
    source: "amazon",
    title: `${name} - ${rating ? `${rating}/5 (${numRatings} ratings)` : "no rating"}`,
    body: name,
    url,
    author: brand,
    container: "Amazon",
    published_at: new Date().toISOString(),
    date_confidence: "low",
    engagement: { ratings: numRatings },
    score: 0,
    snippet: name,
    metadata: {
      asin,
      name,
      brand,
      rating,
      num_ratings: numRatings,
      price,
      currency: String(record.currency || "").trim(),
      badge: String(record.badge || "").trim(),
      sponsored: String(record.sponsored || "").trim().toLowerCase() === "true",
      bought_past_month: Math.round(asNumber(record.bought_past_month)),
      rank_on_page: Math.round(asNumber(record.rank_on_page)),
      top_comments: [],
    },
  };
}

export async function searchAmazon(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const keyword = (query || "").trim();
  if (!keyword || keyword.startsWith("-")) return [];

  const apiKey = config.brightdataApiKey || process.env.BRIGHTDATA_API_KEY || "";
  const search = runPipeline(SEARCH_PIPELINE, [keyword, DEFAULT_DOMAIN], 90, apiKey);
  if (search.error || !search.records.length) return [];

  const products = search.records
    .map(buildProduct)
    .filter((p): p is SourceItem => !!p);

  const pullCount = DEPTH_CONFIG[depth] ?? DEPTH_CONFIG.medium;
  if (pullCount > 0) {
    const targets = products.slice(0, pullCount);
    for (const product of targets) {
      const reviews = runPipeline(REVIEWS_PIPELINE, [product.url, String(MAX_REVIEWS)], 180, apiKey);
      if (reviews.error) continue;
      const comments: { score: number; excerpt: string; author: string; rating: number; date: string }[] = [];
      for (const record of reviews.records) {
        const body = String(record.review_text || "").trim();
        const header = String(record.review_header || "").trim();
        const excerpt = body || header;
        if (!excerpt) continue;
        comments.push({
          score: Math.round(asNumber(record.helpful_count)),
          excerpt,
          author: String(record.author_name || "").trim(),
          rating: Math.round(asNumber(record.rating)),
          date: String(record.review_posted_date || "").slice(0, 10),
        });
      }
      comments.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      product.metadata = { ...product.metadata, top_comments: comments.slice(0, MAX_REVIEWS) };
    }
  }

  return products.map((p) => ({
    ...p,
    date_confidence: getDateConfidence(p.published_at, fromDate, toDate),
  }));
}

export const __test__ = { brightdataAvailable };
