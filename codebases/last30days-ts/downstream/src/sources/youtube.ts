import { commandExists } from "../config.js";
import type { SourceAdapter } from "../schema.js";
import { makeItem, runCommand } from "./base.js";

export const youtube: SourceAdapter = {
  name: "youtube",
  needs: ["yt-dlp binary"],
  isAvailable: () => commandExists("yt-dlp"),
  async search(context) {
    const output = await runCommand("yt-dlp", ["--dump-json", "--flat-playlist", `ytsearch${context.limit}:${context.topic}`]);
    return output.split("\n").filter(Boolean).map((line) => {
      const video = JSON.parse(line) as { title?: string; url?: string; id?: string; uploader?: string; view_count?: number; timestamp?: number; description?: string };
      const url = video.url?.startsWith("http") ? video.url : `https://www.youtube.com/watch?v=${video.id || video.url}`;
      return makeItem("youtube", video.title || url, url, {
        body: video.description,
        author: video.uploader,
        container: "YouTube",
        publishedAt: video.timestamp ? new Date(video.timestamp * 1000).toISOString() : undefined,
        engagement: { views: video.view_count }
      });
    });
  }
};
