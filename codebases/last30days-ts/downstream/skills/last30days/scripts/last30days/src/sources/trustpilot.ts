import { spawnSync } from "node:child_process";
import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";

const CLI_BIN = "trustpilot-pp-cli";

const GENERIC_TOKENS = new Set([
  "ai", "best", "top", "vs", "review", "reviews", "guide", "tutorial",
  "how", "what", "why", "agents", "agent", "memory", "tips", "news",
]);

const TECH_TOKENS = new Set([
  "python", "javascript", "typescript", "java", "rust", "ruby", "php",
  "kotlin", "scala", "golang", "swift", "elixir", "erlang", "haskell",
  "react", "vue", "angular", "svelte", "django", "flask", "rails", "spring",
  "node", "nodejs", "deno", "bun", "express", "nextjs", "nuxt",
  "linux", "ubuntu", "debian", "fedora", "windows", "macos", "android",
  "docker", "kubernetes", "k8s", "terraform", "ansible", "nginx",
  "redis", "postgres", "postgresql", "mysql", "sqlite", "mongodb", "kafka",
  "graphql", "webpack", "vite", "wasm",
]);

const DOMAIN_RE = /\b[a-z0-9][a-z0-9-]*\.(com|io|co|net|org|app|ai|dev|gg|tech|shop|store)\b/;

function isAvailable(): boolean {
  try {
    spawnSync("which", [CLI_BIN], { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function trustpilotAvailable(): boolean {
  return isAvailable();
}

function isBrandShaped(topic: string): boolean {
  if (!topic.trim()) return false;
  const text = topic.trim();
  if (DOMAIN_RE.test(text.toLowerCase())) return true;
  const words = text.split(/\s+/);
  if (words.length > 2) return false;
  if (words.some((w) => GENERIC_TOKENS.has(w.toLowerCase()) || TECH_TOKENS.has(w.toLowerCase()))) return false;
  return words.some((w) => /^[A-Z]/.test(w[0]));
}

function companyIdentifier(topic: string): string {
  const m = DOMAIN_RE.exec(topic.toLowerCase());
  return m ? m[0] : topic.trim();
}

function truthy(value: unknown): boolean {
  const s = String(value || "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "on";
}

function harvestAllowed(config: Config): boolean {
  if (truthy(process.env.LAST30DAYS_TRUSTPILOT_NO_BROWSER)) return false;
  if (truthy((config as Record<string, unknown>).LAST30DAYS_TRUSTPILOT_NO_BROWSER)) return false;
  return true;
}

export async function searchTrustpilot(
  query: string,
  _fromDate: string,
  _toDate: string,
  _depth: string,
  config: Config
): Promise<SourceItem[]> {
  if (!isBrandShaped(query)) return [];
  if (!isAvailable()) return [];
  if (!harvestAllowed(config)) return [];

  const identifier = companyIdentifier(query);

  try {
    const result = spawnSync(
      CLI_BIN,
      ["info", identifier, "--agent"],
      {
        encoding: "utf-8",
        timeout: 75_000,
      }
    );

    if (result.status !== 0 || !result.stdout?.trim()) return [];

    const data = JSON.parse(result.stdout) as TrustpilotInfo;
    if (!data || typeof data !== "object") return [];

    const name = String(data.name || data.displayName || "").trim();
    const aiSummary = String(data.aiSummary || data.summary || "").trim();
    const trustScore = coerceFloat(data.trustScore ?? data.score);
    const reviewCount = coerceInt(data.reviewCount ?? data.numberOfReviews ?? data.total);
    const domain = String(data.domain || data.identifyingName || "").trim();

    if (!name && !aiSummary && trustScore === null && reviewCount === null) return [];

    const resolvedName = name || query.trim();
    const url = data.url
      ? String(data.url).trim()
      : domain
        ? `https://www.trustpilot.com/review/${domain}`
        : `https://www.trustpilot.com/search?query=${encodeURIComponent(identifier)}`;

    let title = `${resolvedName} on Trustpilot`;
    if (trustScore !== null) {
      title = `${resolvedName}: TrustScore ${trustScore}`;
    }

    const engagement: Record<string, number> = {};
    if (reviewCount !== null) engagement.reviews = reviewCount;
    if (trustScore !== null) engagement.trustScore = trustScore;

    return [
      {
        item_id: domain || resolvedName,
        source: "trustpilot",
        title,
        body: aiSummary,
        url,
        author: resolvedName,
        container: "Trustpilot",
        published_at: new Date().toISOString(),
        date_confidence: "high",
        engagement,
        score: 0,
        snippet: aiSummary.slice(0, 300),
        metadata: { trustScore, reviewCount, domain },
      } satisfies SourceItem,
    ];
  } catch {
    return [];
  }
}

function coerceFloat(value: unknown): number | null {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function coerceInt(value: unknown): number | null {
  const n = Math.floor(Number(value));
  return Number.isNaN(n) ? null : n;
}

interface TrustpilotInfo {
  name?: string;
  displayName?: string;
  url?: string;
  aiSummary?: string;
  summary?: string;
  trustScore?: number;
  score?: number;
  reviewCount?: number;
  numberOfReviews?: number;
  total?: number;
  domain?: string;
  identifyingName?: string;
}
