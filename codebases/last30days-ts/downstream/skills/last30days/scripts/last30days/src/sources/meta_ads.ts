import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

// Meta Ad Library source via the ScrapeCreators API. Resolves the advertiser
// page behind a brand topic, then pulls the page's live creatives inside the
// requested window. Requires SCRAPECREATORS_API_KEY; skipped otherwise.

const BASE = "https://api.scrapecreators.com/v1/facebook/adLibrary";

const DEPTH_PAGES: Record<string, number> = { quick: 1, medium: 2, deep: 4 };

const MIN_MATCH_TOKEN = 4;

const PROMO_RE =
  /\b(?:promo|discount|coupon)?\s*code\s*[:\-]?\s*([A-Za-z0-9]{4,12})\b/gi;

interface AdRow {
  page_id?: string;
  page_name?: string;
  ad_archive_id?: string;
  collation_id?: string;
  start_date_string?: string;
  end_date_string?: string;
  url?: string;
  is_active?: boolean;
  publisher_platform?: string[];
  snapshot?: {
    title?: string;
    body?: { text?: string } | string;
    link_url?: string;
    cta_text?: string;
    display_format?: string;
    videos?: unknown[];
    cards?: Array<{ video_hd_url?: string; video_sd_url?: string; link_url?: string }>;
  };
}

function tokens(text: string): string[] {
  return (text || "").toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function compact(text: string): string {
  return tokens(text).join("");
}

export function matchStrength(topic: string, name: string): string {
  const topicCompact = compact(topic);
  const nameCompact = compact(name);
  if (!topicCompact || !nameCompact) return "";
  if (topicCompact === nameCompact) return "exact";
  const topicTokens = new Set(tokens(topic).filter((t) => t.length >= MIN_MATCH_TOKEN));
  const nameTokens = new Set(tokens(name).filter((t) => t.length >= MIN_MATCH_TOKEN));
  if (!topicTokens.size || !nameTokens.size) return "";
  for (const t of topicTokens) {
    if (nameTokens.has(t)) return "token";
  }
  for (const t of topicTokens) {
    if (nameCompact.includes(t)) return "contained";
  }
  for (const t of nameTokens) {
    if (topicCompact.includes(t)) return "contained";
  }
  return "";
}

export function extractPromoCode(text: string): string | undefined {
  for (const m of text.matchAll(PROMO_RE)) {
    const token = m[1];
    if (token === token.toUpperCase() && /[A-Za-z]/.test(token)) return token;
  }
  return undefined;
}

function envelopeRows(response: unknown): AdRow[] {
  if (!response || typeof response !== "object") return [];
  const obj = response as Record<string, unknown>;
  for (const key of ["searchResults", "results", "ads", "data"]) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value.filter((r): r is AdRow => !!r && typeof r === "object");
    }
  }
  return [];
}

function groupAdvertisers(rows: AdRow[]): Array<{ id: string; name: string; ads: number }> {
  const groups = new Map<string, { id: string; name: string; ads: number }>();
  for (const row of rows) {
    const id = String(row.page_id || "").trim();
    if (!id) continue;
    const name = String(row.page_name || "").trim();
    const group = groups.get(id) ?? { id, name: "", ads: 0 };
    group.ads += 1;
    if (!group.name && name) group.name = name;
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => b.ads - a.ads || a.name.localeCompare(b.name));
}

function resolvePage(topic: string, rows: AdRow[]): { id: string; name: string } | null {
  const ordered = groupAdvertisers(rows);
  for (const tier of ["exact", "token", "contained"]) {
    const matches = ordered.filter((g) => matchStrength(topic, g.name) === tier);
    if (matches.length) return { id: matches[0].id, name: matches[0].name };
  }
  return null;
}

function bodyText(snapshot: AdRow["snapshot"]): string {
  const body = snapshot?.body;
  if (body && typeof body === "object") return String(body.text || "").trim();
  return String(body || "").trim();
}

function landingUrl(snapshot: AdRow["snapshot"]): string {
  const link = String(snapshot?.link_url || "").trim();
  if (link) return link;
  for (const card of snapshot?.cards ?? []) {
    const cardLink = String(card.link_url || "").trim();
    if (cardLink) return cardLink;
  }
  return "";
}

function hasVideo(snapshot: AdRow["snapshot"]): boolean {
  if (Array.isArray(snapshot?.videos) && snapshot.videos.some((v) => v && typeof v === "object")) {
    return true;
  }
  return (snapshot?.cards ?? []).some((c) => c.video_hd_url || c.video_sd_url);
}

function buildItem(row: AdRow, page: { id: string; name: string }): SourceItem {
  const snapshot = row.snapshot ?? {};
  const body = bodyText(row.snapshot);
  const rawTitle = String(snapshot.title || "").trim();
  const title = rawTitle || body.split("\n", 1)[0]?.slice(0, 140) || `${page.name} ad`;
  const archiveId = String(row.ad_archive_id || "").trim();
  let url = String(row.url || "").trim();
  if (!url && archiveId) url = `https://www.facebook.com/ads/library/?id=${archiveId}`;
  const launched = String(row.start_date_string || "").slice(0, 10);
  const ended = String(row.end_date_string || "").slice(0, 10);
  const promoCode = extractPromoCode(body);
  const placements = Array.isArray(row.publisher_platform)
    ? row.publisher_platform.map((p) => String(p).trim()).filter(Boolean)
    : [];

  return {
    item_id: archiveId || `meta-ad-${page.id}-${Math.random().toString(36).slice(2, 8)}`,
    source: "meta_ads",
    title,
    body,
    url,
    author: page.name,
    container: "Meta Ad Library",
    published_at: launched ? new Date(launched).toISOString() : new Date().toISOString(),
    date_confidence: launched ? getDateConfidence(launched, launched, launched) : "low",
    engagement: {},
    score: 0,
    snippet: body.slice(0, 300) || title,
    metadata: {
      advertiser: page.name,
      page_id: page.id,
      is_active: !!row.is_active,
      ended_on: ended || null,
      cta: String(snapshot.cta_text || "").trim(),
      landing_url: landingUrl(row.snapshot),
      placements,
      promo_code: promoCode ?? null,
      has_video: hasVideo(row.snapshot),
      display_format: String(snapshot.display_format || "").trim(),
    },
  };
}

async function scGet(url: URL, key: string): Promise<unknown> {
  const resp = await fetch(url.toString(), { headers: { "x-api-key": key } });
  if (!resp.ok) throw new Error(`ScrapeCreators returned ${resp.status}`);
  return resp.json();
}

export async function searchMetaAds(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!config.scrapecreatorsApiKey) return [];
  const topic = (query || "").trim();
  if (!topic) return [];

  const key = config.scrapecreatorsApiKey;
  const maxPages = DEPTH_PAGES[depth] ?? DEPTH_PAGES.medium;

  try {
    let page: { id: string; name: string } | null = null;

    const adsUrl = new URL(`${BASE}/search/ads`);
    adsUrl.searchParams.set("query", topic);
    adsUrl.searchParams.set("country", "US");
    adsUrl.searchParams.set("status", "ACTIVE");
    adsUrl.searchParams.set("search_type", "keyword_unordered");
    adsUrl.searchParams.set("trim", "true");
    const adsResp = await scGet(adsUrl, key);
    page = resolvePage(topic, envelopeRows(adsResp));

    if (!page) {
      const companiesUrl = new URL(`${BASE}/search/companies`);
      companiesUrl.searchParams.set("query", topic);
      const companiesResp = await scGet(companiesUrl, key);
      const companyRows = envelopeRows(companiesResp).map((r) => ({
        page_id: String(r.page_id || "").trim(),
        page_name: String(r.page_name || "").trim(),
      })) as unknown as AdRow[];
      page = resolvePage(topic, companyRows);
    }

    if (!page) return [];

    const rows: AdRow[] = [];
    let cursor: string | undefined;
    let stop = false;
    for (let i = 0; i < maxPages && !stop; i++) {
      const windowUrl = new URL(`${BASE}/company/ads`);
      windowUrl.searchParams.set("pageId", page.id);
      windowUrl.searchParams.set("country", "US");
      windowUrl.searchParams.set("status", "ALL");
      windowUrl.searchParams.set("start_date", fromDate);
      windowUrl.searchParams.set("end_date", toDate);
      if (cursor) windowUrl.searchParams.set("cursor", cursor);
      const resp = (await scGet(windowUrl, key)) as Record<string, unknown>;
      const pageRows = envelopeRows(resp);
      if (!pageRows.length) break;
      rows.push(...pageRows);
      cursor = typeof resp.cursor === "string" ? resp.cursor : undefined;
      if (!cursor) break;
    }

    const seen = new Set<string>();
    const items: SourceItem[] = [];
    for (const row of rows) {
      const collation = String(row.collation_id || "").trim();
      const dedupeKey = collation || `ad:${String(row.ad_archive_id || "").trim()}`;
      if (!dedupeKey || seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push(buildItem(row, page));
    }

    return items.sort((a, b) => (b.published_at > a.published_at ? 1 : -1));
  } catch {
    return [];
  }
}

export const __test__ = { matchStrength, extractPromoCode };
