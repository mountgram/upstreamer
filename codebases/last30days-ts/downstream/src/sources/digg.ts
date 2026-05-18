import { commandExists } from "../config.js";
import type { SourceAdapter } from "../schema.js";
import { makeItem, runCommand } from "./base.js";

export const digg: SourceAdapter = {
  name: "digg",
  needs: ["digg-pp-cli binary"],
  isAvailable: () => commandExists("digg-pp-cli"),
  async search(context) {
    const output = await runCommand("digg-pp-cli", ["search", context.topic, "--json", "--limit", String(context.limit)]);
    const data = JSON.parse(output) as Array<{ title?: string; url?: string; summary?: string; author?: string; publishedAt?: string }>;
    return data.filter((item) => item.url).map((item) => makeItem("digg", item.title || item.url!, item.url!, {
      body: item.summary,
      author: item.author,
      container: "Digg",
      publishedAt: item.publishedAt
    }));
  }
};
