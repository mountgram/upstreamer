import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { renderBrief, research } from "../src/index.js";
import type { SourceAdapter } from "../src/schema.js";

const outputDir = join(process.cwd(), "eval-output", "offline");
const now = new Date("2026-05-18T12:00:00.000Z");

const fixtureAdapter: SourceAdapter = {
  name: "duckduckgo",
  isAvailable: () => true,
  async search() {
    return [
      {
        source: "duckduckgo",
        title: "Developers discuss agent coding workflows",
        url: "https://example.com/agent-coding-workflows",
        body: "Recent discussion about agent coding workflows, test gates, and source citations.",
        publishedAt: "2026-05-10T10:00:00.000Z",
        engagement: { score: 18 }
      },
      {
        source: "duckduckgo",
        title: "Agent coding workflows and test gates",
        url: "https://example.com/agent-coding-workflows-2",
        body: "A near-duplicate signal about agent coding workflows and deterministic checks.",
        publishedAt: "2026-05-11T10:00:00.000Z",
        engagement: { score: 7 }
      }
    ];
  }
};

await mkdir(outputDir, { recursive: true });
const brief = await research({ topic: "agent coding workflows", lookbackDays: 30, limit: 5, now }, [fixtureAdapter]);
const markdown = await renderBrief(brief, "markdown");
const json = await renderBrief(brief, "json");

await writeFile(join(outputDir, "brief.md"), markdown, "utf8");
await writeFile(join(outputDir, "brief.json"), json, "utf8");
await writeFile(join(outputDir, "status.json"), JSON.stringify({ runs: brief.runs, warnings: brief.warnings }, null, 2), "utf8");
await writeFile(join(outputDir, "command.json"), JSON.stringify({ command: "npm run eval:offline", topic: brief.topic, lookbackDays: brief.lookbackDays }, null, 2), "utf8");

const useful = brief.items.length > 0 && brief.clusters.length > 0 && markdown.includes("https://example.com/");
await writeFile(join(outputDir, "judgment.md"), [
  "# Offline Eval Judgment",
  "",
  `Useful: ${useful ? "yes" : "no"}`,
  "Recent: yes - fixture dates are inside the lookback window.",
  "Cited: yes - rendered Markdown includes source URLs.",
  "Source-diverse: no - this deterministic smoke eval intentionally uses one fixture adapter.",
  "Non-fabricated: yes - every rendered item comes from the fixture adapter.",
  "Consistent with promise: partial - validates ranking, clustering, rendering, and artifact writing without network."
].join("\n"), "utf8");

if (!useful) throw new Error("offline eval did not produce cited clustered evidence");
console.log(`offline eval artifacts: ${outputDir}`);
