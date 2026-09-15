import type { SourceItem } from "../schema.js";
import { getDateConfidence } from "../dates.js";

// DripStack source: premium financial newsletter search. The search endpoint
// is free and public (no API key). Returns article metadata with publication
// attribution and a provider-scored relevance signal. Complements StockTwits
// (retail sentiment) and Polymarket (prediction odds) with what professional
// analysts and paid newsletter authors are writing.

const SEARCH_URL = "https://dripstack.xyz/api/v1/search";
const UA = "Mozilla/5.0 (last30days-ts dripstack source)";

const DEPTH_LIMITS: Record<string, number> = { quick: 5, medium: 10, deep: 20 };

const FINANCE_HINTS = /\b(stock|stocks|ticker|earnings|valuation|crypto|market|markets|analyst|analysts|invest|investing|fund|hedge|finance|financial|revenue|capex|guidance|outlook|quarterly|rate cut|fed|inflation|bond|bonds|treasury|newsletter|substack)\b/i;

export function isDripstackTopic(topic: string): boolean {
  return FINANCE_HINTS.test(topic);
}

interface DripstackItem {
  title?: string;
  subtitle?: string;
  snippet?: string;
  publicationSlug?: string;
  slug?: string;
  publishedAt?: string;
  relevanceScore?: number;
  whyMatched?: string[];
  matchConfidence?: string;
  topicCoverageRatio?: number;
}

function buildUrl(item: DripstackItem): string {
  const pubSlug = String(item.publicationSlug || "").trim();
  const postSlug = String(item.slug || "").trim();
  if (pubSlug && postSlug) return `https://${pubSlug}/${postSlug}`;
  return "";
}

export function parseDripstack(items: DripstackItem[], query: string): SourceItem[] {
  return items.map((item, i) => {
    const title = String(item.title || "").trim();
    const subtitle = String(item.subtitle || "").trim();
    const snippet = String(item.snippet || "").trim();
    const pubSlug = String(item.publicationSlug || "").trim();
    const published = String(item.publishedAt || "").slice(0, 10);
    const rawScore = Number(item.relevanceScore);
    const relevance = Number.isFinite(rawScore) ? Math.min(1, Math.max(0, rawScore / 100)) : 0.5;

    const whyClean = (item.whyMatched ?? []).filter((w) => !/RRF|Hybrid/i.test(w));
    const whyRelevant = whyClean.length ? whyClean.join("; ") : `DripStack newsletter match for: ${query}`;

    const body = subtitle || snippet || title;
    const author = pubSlug.replace(".substack.com", "").replace(".com", "");

    return {
      item_id: `dripstack-${i + 1}`,
      source: "dripstack",
      title: title || `DripStack result ${i + 1}`,
      body,
      url: buildUrl(item),
      author,
      container: "DripStack",
      published_at: published ? new Date(published).toISOString() : new Date().toISOString(),
      date_confidence: published ? getDateConfidence(published, published, published) : "low",
      engagement: {},
      score: 0,
      snippet: snippet.slice(0, 400) || body.slice(0, 400),
      metadata: {
        publication_slug: pubSlug,
        post_slug: String(item.slug || ""),
        relevance_score: rawScore,
        match_confidence: item.matchConfidence,
        topic_coverage_ratio: item.topicCoverageRatio,
        why_relevant: whyRelevant,
        relevance: Math.round(relevance * 100) / 100,
      },
    };
  });
}

export async function searchDripstack(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string
): Promise<SourceItem[]> {
  if (!isDripstackTopic(query)) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(limit));

  try {
    const resp = await fetch(url.toString(), { headers: { "User-Agent": UA } });
    if (!resp.ok) return [];
    const data = (await resp.json()) as { items?: DripstackItem[] };
    const items = parseDripstack(data.items ?? [], query);

    if (fromDate || toDate) {
      return items.filter((item) => {
        const d = item.published_at.slice(0, 10);
        if (fromDate && d && d < fromDate) return false;
        if (toDate && d && d > toDate) return false;
        return true;
      });
    }
    return items;
  } catch {
    return [];
  }
}

export const __test__ = { isDripstackTopic, parseDripstack };
