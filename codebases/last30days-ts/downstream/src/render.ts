import type { EvidenceItem, ResearchBrief } from "./schema.js";

function citation(item: EvidenceItem): string {
  const parts = [item.source, item.container, item.author].filter(Boolean).join(" / ");
  return `[${parts || item.source}](${item.url})`;
}

export function renderMarkdown(brief: ResearchBrief): string {
  const lines = [
    `# Last30Days: ${brief.topic}`,
    "",
    `Generated ${brief.generatedAt} from a ${brief.lookbackDays}-day window.`,
    "",
    "## What Stands Out",
    ""
  ];

  for (const cluster of brief.clusters.slice(0, 8)) {
    const lead = cluster.items[0];
    lines.push(`- **${cluster.title}** - ${lead.body || "No snippet available."} ${citation(lead)}`);
  }

  lines.push("", "## Source Status", "");
  for (const run of brief.runs) {
    lines.push(`- ${run.source}: ${run.status} (${run.itemCount} items${run.message ? `, ${run.message}` : ""})`);
  }

  if (brief.warnings.length) {
    lines.push("", "## Warnings", "");
    for (const warning of brief.warnings) lines.push(`- ${warning}`);
  }

  return `${lines.join("\n")}\n`;
}

export function renderJson(brief: ResearchBrief): string {
  return `${JSON.stringify(brief, null, 2)}\n`;
}
