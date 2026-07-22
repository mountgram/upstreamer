import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname, basename } from "node:path";
import type { SourceItem, CorpusScanResult } from "../schema.js";

const SUPPORTED_SUFFIXES = new Set([".md", ".txt"]);
const IGNORED_DIRS = new Set([".git", "node_modules", ".upstreamer"]);
const MAX_FILES = 500;
const MAX_TEXT_CHARS = 100_000;

function tokenOverlapScore(topic: string, text: string): number {
  const topicTokens = new Set(topic.toLowerCase().split(/\s+/).filter((t) => t.length > 2));
  const textTokens = text.toLowerCase().split(/\s+/);
  const matched = textTokens.filter((t) => topicTokens.has(t)).length;
  return topicTokens.size > 0 ? matched / topicTokens.size : 0;
}

function pathTitle(filePath: string): string {
  const base = basename(filePath, extname(filePath));
  return base.replace(/[_-]/g, " ").replace(/\s+/g, " ").trim() || base;
}

function scanDirectory(root: string): string[] {
  const files: string[] = [];
  const seen = new Set<string>();

  function walk(dir: string) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (seen.has(fullPath)) continue;
      seen.add(fullPath);

      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
        if (files.length < MAX_FILES) walk(fullPath);
      } else if (entry.isFile()) {
        if (!entry.name.startsWith(".") && SUPPORTED_SUFFIXES.has(extname(entry.name).toLowerCase())) {
          files.push(fullPath);
          if (files.length >= MAX_FILES) return;
        }
      }
    }
  }

  walk(root);
  return files;
}

export function searchCorpus(
  topic: string,
  directories: string[],
  options?: {
    fromDate?: string;
    toDate?: string;
    allTime?: boolean;
    limit?: number;
  }
): CorpusScanResult {
  const limit = options?.limit ?? 12;
  const allTime = options?.allTime ?? false;
  const fromDate = options?.fromDate ?? "";
  const toDate = options?.toDate ?? "";

  const items: SourceItem[] = [];
  const notes: string[] = [];
  let filesScanned = 0;
  const cacheHits = 0;

  for (const root of directories) {
    let rootStat;
    try {
      rootStat = statSync(root);
    } catch {
      notes.push(`Skipped corpus root '${basename(root)}': not a readable directory`);
      continue;
    }

    if (!rootStat.isDirectory()) {
      notes.push(`Skipped corpus root '${basename(root)}': not a directory`);
      continue;
    }

    const files = scanDirectory(root);

    for (const filePath of files) {
      filesScanned++;
      try {
        const fileStat = statSync(filePath);
        const publishedAt = fileStat.mtime.toISOString().slice(0, 10);

        if (!allTime && fromDate && toDate) {
          if (publishedAt < fromDate || publishedAt > toDate) continue;
        }

        let text: string;
        try {
          text = readFileSync(filePath, "utf-8").slice(0, MAX_TEXT_CHARS);
        } catch {
          notes.push(`Skipped ${relative(root, filePath)}: could not read`);
          continue;
        }

        if (!text.trim()) continue;

        const title = pathTitle(filePath);
        const score = tokenOverlapScore(topic, `${title}\n${text}`);
        if (score < 0.15) continue;

        const relPath = relative(root, filePath);
        const hash = Buffer.from(filePath).toString("base64url").slice(0, 12);

        items.push({
          item_id: `C${hash}`,
          source: "corpus",
          title,
          body: text,
          url: `corpus://${relPath}`,
          author: "",
          container: filePath,
          published_at: publishedAt,
          date_confidence: "high",
          engagement: {},
          score,
          snippet: text.slice(0, 300),
          metadata: {
            path: filePath,
            relative_path: relPath,
            extension: extname(filePath).toLowerCase(),
            local_only: true,
          },
        });
      } catch {
        continue;
      }
    }
  }

  items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return {
    items: items.slice(0, limit),
    notes,
    files_scanned: filesScanned,
    cache_hits: cacheHits,
  };
}

export function corpusAvailable(directories?: string[]): boolean {
  if (!directories || directories.length === 0) return false;
  return directories.some((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  });
}
