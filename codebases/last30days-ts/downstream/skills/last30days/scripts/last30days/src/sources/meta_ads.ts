import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

// Meta Ad Library source. What a brand is *paying* to say this month,
// alongside what everyone else is saying about it in the other sources.
//
// Two-stage shape, following the upstream last30days lane:
//   1. Discovery -- one keyword ad search resolves which advertiser page the
//      topic belongs to (ad-search-first, company-search fallback).
//   2. Enrichment -- the resolved page's creatives inside the run window,
//      cursor paginated under a depth cap, then optional transcripts for the
//      newest video creatives.
//
// Off by default and never inferred from topic shape. Turn it on per run with
// `--include-sources meta_ads`; it needs SCRAPECREATORS_API_KEY. Paid message
// only, never audience reaction: Meta publishes reach/spend for political ads
// alone, so commercial creatives carry no engagement numbers.

const SC_BASE = "https://api.scrapecreators.com/v1/facebook/adLibrary";
const SEARCH_ADS_URL = `${SC_BASE}/search/ads`;
const SEARCH_COMPANIES_URL = `${SC_BASE}/search/companies`;
const COMPANY_ADS_URL = `${SC_BASE}/company/ads`;
const AD_TRANSCRIPT_URL = `${SC_BASE}/ad/transcript`;

const DEFAULT_COUNTRY = "US";
const DISCOVERY_STATUS = "ACTIVE";
const ENRICHMENT_STATUS = "ALL";
const DISCOVERY_SEARCH_TYPE = "keyword_unordered";

const DEPTH_CONFIG: Record<string, { pages: number; transcripts: number }> = {
  quick: { pages: 1, transcripts: 0 },
  medium: { pages: 2, transcripts: 3 },
  deep: { pages: 4, transcripts: 5 },
};

const MAX_PAGES_HARD = 5;
const REQUEST_TIMEOUT_MS = 30_000;

interface AdRow {
  page_id?: string;
  page_name?: string;
  name?: string;
  ad_archive_id?: string;
  url?: string;
  title?: string;
  text?: string;
  body?: string;
  link_url?: string;
  snapshot?: Record<string, unknown>;
  is_active?: boolean;
  end_date_string?: string;
  start_date_string?: string;
  display_format?: string;
  cta_text?: string;
  publisher_platform?: string[];
  collation_count?: number;
  has_video?: boolean;
  cards?: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface AdvertiserPage {
  id: string;
  name: string;
  ads: number;
}

function scHeaders(token: string): Record<string, string> {
  return {
    "x-api-key": token,
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "last30days-ts/0.1",
  };
}

function envelopeRows(response: Record<string, unknown>): AdRow[] {
  for (const key of ["searchResults", "results", "ads", "data"]) {
    const val = response[key];
    if (Array.isArray(val)) return val as AdRow[];
  }
  return [];
}

function envelopeTotal(response: Record<string, unknown>): number {
  const total = response.searchResultsCount ?? response.total ?? response.count;
  return Number(total) || 0;
}

function envelopeCursor(response: Record<string, unknown>): string | null {
  const cursor = response.cursor;
  if (typeof cursor === "string" && cursor.trim()) return cursor;
  if (typeof cursor === "number") return String(cursor);
  return null;
}

function snapshot(row: AdRow): Record<string, unknown> {
  if (row.snapshot && typeof row.snapshot === "object") return row.snapshot;
  return row as unknown as Record<string, unknown>;
}

function bodyText(snap: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of ["body", "text", "ad_creative_body", "message"]) {
    const val = snap[key];
    if (typeof val === "string" && val.trim()) parts.push(val);
  }
  return parts.join("\n").trim();
}

function cards(snap: Record<string, unknown>): Array<Record<string, unknown>> {
  const val = snap.cards;
  return Array.isArray(val) ? (val as Array<Record<string, unknown>>) : [];
}

function landingUrl(snap: Record<string, unknown>): string {
  const direct = String(snap.link_url || "").trim();
  if (direct) return direct;
  for (const card of cards(snap)) {
    const link = String(card.link_url || "").trim();
    if (link) return link;
  }
  return "";
}

function placements(row: AdRow): string[] {
  const raw = row.publisher_platform;
  if (!Array.isArray(raw)) return [];
  return raw.map((p) => String(p).trim()).filter(Boolean);
}

function variants(row: AdRow): number {
  const count = Number(row.collation_count ?? 0);
  return Number.isFinite(count) ? Math.max(1, Math.floor(count)) : 1;
}

const PROMO_RE = /\b(?:code|promo|promocode|offer code)[:\s]+([A-Z][A-Z0-9]{2,})\b/g;

function extractPromoCode(text: string): string | null {
  for (const match of text.matchAll(PROMO_RE)) {
    const token = match[1];
    if (token && /[A-Za-z]/.test(token)) return token;
  }
  return null;
}

function launchDate(row: AdRow): string | null {
  const raw = row.start_date_string;
  if (typeof raw === "string" && raw.trim()) return raw.slice(0, 10);
  const snap = snapshot(row);
  const start = snap.start_date;
  if (typeof start === "string" && start.trim()) return start.slice(0, 10);
  return null;
}

function dedupeKey(row: AdRow): string {
  const archive = String(row.ad_archive_id || "").trim();
  if (archive) return `archive:${archive}`;
  const snap = snapshot(row);
  return `creative:${String(snap.title || "")}|${bodyText(snap).slice(0, 80)}`;
}

function hasVideo(row: AdRow): boolean {
  return !!row.has_video || bodyText(snapshot(row)).toLowerCase().includes("watch");
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function topicTokens(topic: string): string[] {
  return normalizeName(topic).split(/\s+/).filter(Boolean);
}

function namesMatch(topic: string, name: string): boolean {
  const pageTokens = new Set(normalizeName(name).split(/\s+/).filter(Boolean));
  const tokens = topicTokens(topic);
  if (pageTokens.size === 0 || tokens.length === 0) return false;
  const pageWords = [...pageTokens];
  const matched = pageWords.filter((w) => tokens.includes(w));
  return matched.length > 0;
}

function groupAdvertisers(rows: AdRow[]): AdvertiserPage[] {
  const groups = new Map<string, AdvertiserPage>();
  for (const row of rows) {
    const pageId = String(row.page_id || "").trim();
    if (!pageId) continue;
    const name = String(row.page_name || "").trim();
    const existing = groups.get(pageId);
    if (existing) {
      existing.ads += 1;
      if (name && !existing.name) existing.name = name;
    } else {
      groups.set(pageId, { id: pageId, name, ads: 1 });
    }
  }
  return [...groups.values()].sort((a, b) => b.ads - a.ads);
}

function resolvePage(topic: string, rows: AdRow[]): AdvertiserPage | null {
  const pages = groupAdvertisers(rows);
  if (pages.length === 0) return null;
  const tokens = topicTokens(topic);
  const exact = pages.find((p) => tokens.length > 0 && tokens.every((t) => normalizeName(p.name).split(/\s+/).includes(t)));
  if (exact) return exact;
  return pages.find((p) => namesMatch(topic, p.name)) ?? null;
}

function buildItem(row: AdRow, page: AdvertiserPage): SourceItem {
  const snap = snapshot(row);
  const body = bodyText(snap);
  const title = String(snap.title || "").trim() || body.split("\n", 1)[0]?.slice(0, 140) || page.name;
  const archiveId = String(row.ad_archive_id || "").trim();
  let url = String(row.url || "").trim();
  if (!url && archiveId) url = `https://www.facebook.com/ads/library/?id=${archiveId}`;
  const launched = launchDate(row);
  const publishedAt = launched ? `${launched}T00:00:00.000Z` : new Date().toISOString();
  const landing = landingUrl(snap);

  return {
    item_id: archiveId || dedupeKey(row),
    source: "meta_ads",
    title,
    body,
    url: url || landing || "https://www.facebook.com/ads/library/",
    author: page.name || "",
    container: "Meta Ad Library",
    published_at: publishedAt,
    date_confidence: launched ? "high" : "low",
    engagement: {},
    score: 0,
    snippet: body.slice(0, 300),
    metadata: {
      advertiser: page.name || "",
      page_id: page.id,
      launched_in_window: !!launched,
      still_running: !!row.is_active,
      ended_on: typeof row.end_date_string === "string" ? row.end_date_string.slice(0, 10) : null,
      display_format: String(snap.display_format || "").trim(),
      cta: String(snap.cta_text || "").trim(),
      landing_url: landing,
      placements: placements(row),
      promo_code: extractPromoCode(body),
      variants: variants(row),
      has_video: hasVideo(row),
    },
  };
}

async function scGet(
  url: string,
  params: Record<string, string | number | boolean>,
  token: string
): Promise<Record<string, unknown> | null> {
  const u = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    u.searchParams.set(key, String(value));
  }
  const resp = await fetch(u.toString(), {
    headers: scHeaders(token),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!resp.ok) return null;
  try {
    const json = (await resp.json()) as Record<string, unknown>;
    return json && typeof json === "object" ? json : null;
  } catch {
    return null;
  }
}

async function discoverPage(topic: string, country: string, token: string): Promise<AdvertiserPage | null> {
  const adsResp = await scGet(
    SEARCH_ADS_URL,
    { query: topic, country, status: DISCOVERY_STATUS, search_type: DISCOVERY_SEARCH_TYPE, trim: "true" },
    token
  );
  const adsRows = adsResp ? envelopeRows(adsResp) : [];
  const fromAds = resolvePage(topic, adsRows);
  if (fromAds) return fromAds;

  const companiesResp = await scGet(SEARCH_COMPANIES_URL, { query: topic }, token);
  if (!companiesResp) return null;
  const companyRows: AdRow[] = envelopeRows(companiesResp).map((row) => ({
    page_id: String(row.page_id || "").trim(),
    page_name: String(row.name || row.page_name || "").trim(),
  }));
  return resolvePage(topic, companyRows);
}

async function fetchWindow(
  page: AdvertiserPage,
  country: string,
  fromDate: string,
  toDate: string,
  maxPages: number,
  token: string
): Promise<AdRow[]> {
  const rows: AdRow[] = [];
  let cursor: string | null = null;
  let prevCursor: string | null = null;
  const pages = Math.min(maxPages, MAX_PAGES_HARD);

  for (let i = 0; i < pages; i++) {
    const params: Record<string, string | number | boolean> = {
      pageId: page.id,
      country,
      status: ENRICHMENT_STATUS,
      start_date: fromDate,
      end_date: toDate,
    };
    if (cursor) params.cursor = cursor;
    const response = await scGet(COMPANY_ADS_URL, params, token);
    if (!response) break;
    const pageRows = envelopeRows(response);
    if (pageRows.length === 0) break;
    rows.push(...pageRows);
    cursor = envelopeCursor(response);
    if (!cursor || cursor === prevCursor) break;
    prevCursor = cursor;
  }

  return rows;
}

async function addTranscripts(
  items: SourceItem[],
  cap: number,
  token: string
): Promise<void> {
  if (cap <= 0) return;
  const candidates = items.filter((item) => item.metadata.has_video).slice(0, cap);
  for (const item of candidates) {
    const response = await scGet(AD_TRANSCRIPT_URL, { id: item.item_id }, token);
    if (!response) continue;
    if (!response.transcript_available) continue;
    const text = String(response.transcript || "").trim();
    if (!text) continue;
    item.metadata = { ...item.metadata, transcript: text };
  }
}

export async function searchMetaAds(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const token = config.scrapecreatorsApiKey;
  if (!token) return [];

  const topic = (query || "").trim();
  if (!topic) return [];

  const cfg = DEPTH_CONFIG[depth] ?? DEPTH_CONFIG.medium;
  const country = process.env.LAST30DAYS_META_ADS_COUNTRY?.trim() || DEFAULT_COUNTRY;
  const pageOverride = process.env.LAST30DAYS_META_ADS_PAGE?.trim() || "";

  try {
    let page: AdvertiserPage | null;
    if (pageOverride) {
      page = { id: pageOverride, name: topic || pageOverride, ads: 0 };
    } else {
      page = await discoverPage(topic, country, token);
    }
    if (!page) return [];

    const rows = await fetchWindow(page, country, fromDate, toDate, cfg.pages, token);
    const seen = new Set<string>();
    const items: SourceItem[] = [];
    let stillRunning = 0;

    for (const row of rows) {
      const key = dedupeKey(row);
      if (seen.has(key)) continue;
      seen.add(key);
      const launched = launchDate(row);
      if (launched && launched >= fromDate && launched <= toDate) {
        items.push(buildItem(row, page));
      } else {
        stillRunning += 1;
      }
    }

    items.sort((a, b) => (b.published_at < a.published_at ? -1 : b.published_at > a.published_at ? 1 : 0));
    await addTranscripts(items, cfg.transcripts, token);

    const placementsList: string[] = [];
    const promoCodes: string[] = [];
    for (const item of items) {
      for (const placement of (item.metadata.placements as string[]) || []) {
        if (!placementsList.includes(placement)) placementsList.push(placement);
      }
      const code = item.metadata.promo_code as string | null;
      if (code && !promoCodes.includes(code)) promoCodes.push(code);
    }

    return items.map((item) => ({
      ...item,
      metadata: {
        ...item.metadata,
        tally: {
          launched_in_window: items.length,
          still_running: stillRunning,
          video: items.filter((it) => it.metadata.has_video).length,
          transcribed: items.filter((it) => typeof it.metadata.transcript === "string").length,
          advertiser: page.name || "",
          page_id: page.id,
          placements: placementsList,
          promo_codes: promoCodes,
        },
      },
    }));
  } catch {
    return [];
  }
}

export function __testMetaAds() {
  return { envelopeRows, envelopeCursor, resolvePage, groupAdvertisers, buildItem, extractPromoCode, launchDate };
}
