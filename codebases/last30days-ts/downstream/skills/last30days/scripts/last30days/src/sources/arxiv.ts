import { spawnSync } from "node:child_process";
import type { SourceItem } from "../schema.js";

const CLI_BIN = "arxiv-pp-cli";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

function isAvailable(): boolean {
  try {
    spawnSync("which", [CLI_BIN], { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

export function arxivAvailable(): boolean {
  return isAvailable();
}

function cleanPhrase(topic: string): string {
  return topic.replace(/"/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchArxiv(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string
): Promise<SourceItem[]> {
  if (!isAvailable()) return [];

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;
  const phrase = cleanPhrase(query);
  if (!phrase) return [];

  try {
    const result = spawnSync(
      CLI_BIN,
      [
        "query",
        "--search-query",
        `all:"${phrase}"`,
        "--sort-by",
        "relevance",
        "--max-results",
        String(limit),
        "--agent",
      ],
      {
        encoding: "utf-8",
        timeout: 30_000,
      }
    );

    if (result.status !== 0 || !result.stdout?.trim()) return [];

    const data = JSON.parse(result.stdout) as {
      meta?: unknown;
      results?: { entries?: ArxivEntry[] } | ArxivEntry[];
      entries?: ArxivEntry[];
    };

    let entries: ArxivEntry[] | undefined;
    if (Array.isArray(data)) {
      entries = data;
    } else if (data.results) {
      if (Array.isArray(data.results)) {
        entries = data.results;
      } else if (data.results.entries) {
        entries = data.results.entries;
      }
    } else if (data.entries) {
      entries = data.entries;
    }

    if (!entries || !entries.length) return [];

    return entries.slice(0, limit).map((entry, i) => {
      const title = (entry.title || "").replace(/\s+/g, " ").trim();
      const summary = (entry.summary || "").replace(/\s+/g, " ").trim();
      const published = entry.published || entry.updated || "";
      const publishedAt = published
        ? new Date(published.replace("Z", "+00:00")).toISOString()
        : new Date().toISOString();

      const authors = Array.isArray(entry.authors)
        ? entry.authors
            .map((a: unknown) => {
              if (typeof a === "object" && a !== null && "name" in a) {
                return String((a as { name: string }).name).trim();
              }
              return "";
            })
            .filter(Boolean)
        : [];

      const primaryAuthor = authors[0] || "";
      const authorLabel = authors.length > 1 ? `${primaryAuthor} et al.` : primaryAuthor;

      const links = Array.isArray(entry.links) ? entry.links : [];
      const altLink = links.find(
        (l: unknown) =>
          typeof l === "object" && l !== null && (l as { rel?: string }).rel === "alternate"
      ) as { href?: string } | undefined;
      const url = altLink?.href || entry.id || "";

      return {
        item_id: String(entry.id || `arxiv-${i + 1}`),
        source: "arxiv",
        title: title || summary.slice(0, 100),
        body: summary,
        url,
        author: authorLabel,
        container: "arXiv",
        published_at: publishedAt,
        date_confidence: published ? "high" : "low",
        engagement: {},
        score: 0,
        snippet: summary.slice(0, 300),
        metadata: { authors, primary_author: primaryAuthor },
      } satisfies SourceItem;
    });
  } catch {
    return [];
  }
}

interface ArxivEntry {
  id?: string;
  title?: string;
  summary?: string;
  published?: string;
  updated?: string;
  authors?: Array<{ name: string }>;
  links?: Array<{ rel?: string; href?: string }>;
}
