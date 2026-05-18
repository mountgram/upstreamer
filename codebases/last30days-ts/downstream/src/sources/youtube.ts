import { execSync } from "node:child_process";
import type { SourceItem } from "../schema.js";
import { getDateConfidence } from "../dates.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

interface YtDlpEntry {
  id?: string;
  title?: string;
  description?: string;
  webpage_url?: string;
  channel?: string;
  uploader?: string;
  upload_date?: string;
  view_count?: number;
  like_count?: number;
  comment_count?: number;
}

function ytDlpAvailable(): boolean {
  try {
    execSync("which yt-dlp", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function formatUploadDate(dateStr: string | undefined): string {
  if (!dateStr || dateStr.length !== 8) return new Date().toISOString();
  const y = dateStr.slice(0, 4);
  const m = dateStr.slice(4, 6);
  const d = dateStr.slice(6, 8);
  return `${y}-${m}-${d}T00:00:00.000Z`;
}

export async function searchYouTube(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string
): Promise<SourceItem[]> {
  if (!ytDlpAvailable()) {
    console.error("[youtube] yt-dlp is not installed. Install from https://github.com/yt-dlp/yt-dlp or with your package manager (brew install yt-dlp)");
    return [];
  }

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  try {
    const raw = execSync(
      `yt-dlp "ytsearch${limit}:${query}" --dump-json --flat-playlist --no-download 2>/dev/null`,
      {
        encoding: "utf-8",
        maxBuffer: 10 * 1024 * 1024,
        timeout: 30_000,
      }
    );

    if (!raw.trim()) return [];

    const lines = raw.trim().split("\n");
    const items: SourceItem[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      let entry: YtDlpEntry;
      try {
        entry = JSON.parse(line);
      } catch {
        continue;
      }

      const id = entry.id;
      if (!id) continue;

      const title = entry.title || "";
      const description = entry.description || "";
      const body = `${title}\n${description}`.trim();
      const url = entry.webpage_url || `https://www.youtube.com/watch?v=${id}`;
      const author = entry.channel || entry.uploader || "";
      const container = entry.uploader || entry.channel || "";
      const publishedAt = formatUploadDate(entry.upload_date);

      items.push({
        item_id: id,
        source: "youtube",
        title: title.slice(0, 200),
        body,
        url,
        author,
        container,
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, fromDate, toDate),
        engagement: {
          views: entry.view_count ?? 0,
          likes: entry.like_count ?? 0,
          comments: entry.comment_count ?? 0,
        },
        score: 0,
        snippet: description.slice(0, 200) || title.slice(0, 200),
        metadata: {},
      });

      if (items.length >= limit) break;
    }

    return items;
  } catch (err) {
    console.error("[youtube] yt-dlp error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
