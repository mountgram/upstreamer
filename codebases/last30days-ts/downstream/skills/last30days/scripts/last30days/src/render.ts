import type { Candidate, Cluster, Report } from "./schema.js";
import { formatDate } from "./dates.js";

const SOURCE_LABELS: Record<string, string> = {
  exa: "Web",
  brave: "Web",
  serper: "Web",
  parallel: "Web",
  perplexity: "Web",
  grounding: "Web",
  reddit: "Reddit",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  hackernews: "HN",
  polymarket: "Polymarket",
  github: "GitHub",
  bluesky: "Bluesky",
  truthsocial: "Truth Social",
  threads: "Threads",
  pinterest: "Pinterest",
  digg: "Digg",
};

function clusterKey(cluster: Cluster): string {
  return `${cluster.score} ${cluster.sources.join(",")} ${cluster.title}`;
}

export function renderMarkdown(report: Report): string {
  const lines: string[] = [];

  // Badge
  lines.push(`🌐 last30days v0.1.0 · synced ${formatDate(new Date())}`);
  lines.push("");

  // Synthesis from clusters
  lines.push("What I learned:");
  lines.push("");

  const clusters = [...report.clusters].sort((a, b) => b.score - a.score);
  for (const cluster of clusters) {
    const cands = cluster.candidate_ids
      .map(id => report.ranked_candidates.find(c => c.candidate_id === id))
      .filter((c): c is Candidate => !!c);

    if (cands.length === 0) continue;

    const best = cands[0];
    const sources = [...new Set(cands.flatMap(c => c.source_items.map(si => si.source)))];
    const sourceLabels = sources.map(s => SOURCE_LABELS[s] || s).join(", ");

    lines.push(`**${best.title}** ${sourceLabels ? `(${sourceLabels})` : ""}`);
    if (best.snippet) {
      lines.push(best.snippet);
    }
    if (best.url) {
      lines.push(`  [Read more](${best.url})`);
    }
    lines.push("");

    // Additional candidates in cluster
    for (let i = 1; i < Math.min(cands.length, 3); i++) {
      const c = cands[i];
      if (c.title && c.title !== best.title) {
        lines.push(`- [${c.title}](${c.url})`);
      }
    }
  }

  // Key patterns
  if (clusters.length > 0) {
    lines.push("KEY PATTERNS from the research:");
    lines.push("");
    for (let i = 0; i < Math.min(clusters.length, 8); i++) {
      const c = clusters[i];
      const cands = c.candidate_ids
        .map(id => report.ranked_candidates.find(ca => ca.candidate_id === id))
        .filter((ca): ca is Candidate => !!ca);
      if (cands.length === 0) continue;

      const pattern = cands[0].title;
      const sources = [...new Set((c as Cluster).sources?.map(s => SOURCE_LABELS[s] || s) || [])];
      if (c.uncertainty) {
        lines.push(`${i + 1}. ${pattern} (${c.uncertainty})`);
      } else {
        lines.push(`${i + 1}. ${pattern}`);
      }
    }
    lines.push("");
  }

  // Footer
  lines.push("---");
  lines.push("<!-- PASS-THROUGH FOOTER -->");
  lines.push("");

  const sourceEmojis: Record<string, string> = {
    grounding: "🌐", exa: "🌐", brave: "🌐", serper: "🌐",
    parallel: "🌐", perplexity: "🔍",
    reddit: "🤖", x: "🐦", youtube: "▶️", tiktok: "🎵", instagram: "📷",
    hackernews: "🔶", polymarket: "📊", github: "🐙", bluesky: "🦋",
    truthsocial: "📯", threads: "🧵", pinterest: "📌", digg: "⛏️",
  };

  const treeLines: string[] = [];
  const sources = Object.keys(report.items_by_source).sort();
  for (const source of sources) {
    const items = report.items_by_source[source];
    const emoji = sourceEmojis[source] || "📋";
    const label = SOURCE_LABELS[source] || source;
    treeLines.push(`${emoji} ${label}: ${items.length} items`);
  }

  if (treeLines.length === 0) {
    treeLines.push("No sources returned results.");
  }

  lines.push("✅ All agents reported back!");
  lines.push(treeLines.join("\n"));
  lines.push("");
  lines.push("<!-- END PASS-THROUGH FOOTER -->");

  return lines.join("\n");
}

export function renderJson(report: Report): string {
  return JSON.stringify(report, null, 2);
}

export function renderCompact(report: Report): string {
  // Compact: evidence clusters for agent consumption, then footer
  const lines: string[] = [];
  lines.push(`🌐 last30days v0.1.0 · synced ${formatDate(new Date())}`);
  lines.push("");

  lines.push("<!-- EVIDENCE FOR SYNTHESIS: read this, do not emit verbatim. -->");
  lines.push("## Ranked Evidence Clusters");
  lines.push("");

  let clusterNum = 1;
  for (const cluster of report.clusters.sort((a, b) => b.score - a.score)) {
    const cands = cluster.candidate_ids
      .map(id => report.ranked_candidates.find(c => c.candidate_id === id))
      .filter((c): c is Candidate => !!c);

    if (cands.length === 0) continue;

    const best = cands[0];
    const sources = cluster.sources.map(s => SOURCE_LABELS[s] || s).join(", ");
    const uncertainty = cluster.uncertainty ? `- Uncertainty: ${cluster.uncertainty}` : "";

    lines.push(`### ${clusterNum}. ${best.title} (score ${Math.round(cluster.score)}, ${cands.length} items, sources: ${sources})`);
    lines.push("");

    for (const c of cands) {
      const srcLabels = c.source_items.map(si => `[${SOURCE_LABELS[si.source] || si.source}]`).join("");
      const dates = c.source_items
        .map(si => si.published_at?.slice(0, 10))
        .filter(Boolean);
      const dateText = dates.length ? ` (${[...new Set(dates)].slice(0, 2).join(", ")})` : "";
      lines.push(`1. ${srcLabels} [${c.title}](${c.url})${dateText}`);
      if (c.snippet) lines.push(`  - ${c.snippet}`);
    }
    if (uncertainty) lines.push(uncertainty);
    lines.push("");
    clusterNum++;
  }

  lines.push("<!-- END EVIDENCE FOR SYNTHESIS -->");
  lines.push("");

  // Stats
  lines.push("## Stats");
  const totalItems = Object.values(report.items_by_source).reduce((s, items) => s + items.length, 0);
  lines.push(`- Total items: ${totalItems}`);
  lines.push(`- Sources with results: ${Object.keys(report.items_by_source).length}`);
  lines.push(`- Clusters: ${report.clusters.length}`);
  lines.push(`- Warnings: ${report.warnings.length}`);
  lines.push("");

  // Source coverage
  lines.push("## Source Coverage");
  for (const [source, items] of Object.entries(report.items_by_source)) {
    const label = SOURCE_LABELS[source] || source;
    lines.push(`- ${label}: ${items.length} items`);
  }
  for (const [source, error] of Object.entries(report.errors_by_source)) {
    const label = SOURCE_LABELS[source] || source;
    lines.push(`- ${label}: error - ${error}`);
  }
  lines.push("");

  // Footer
  lines.push("---");
  lines.push("<!-- PASS-THROUGH FOOTER -->");
  lines.push("");
  lines.push("✅ All agents reported back!");
  lines.push("");

  const sourceEmojis: Record<string, string> = {
    exa: "🌐", brave: "🌐", serper: "🌐",
    parallel: "🌐", perplexity: "🔍",
    reddit: "🤖", x: "🐦", youtube: "▶️", tiktok: "🎵", instagram: "📷",
    hackernews: "🔶", polymarket: "📊", github: "🐙", bluesky: "🦋",
    truthsocial: "📯", threads: "🧵", pinterest: "📌", digg: "⛏️",
  };

  for (const [source, items] of Object.entries(report.items_by_source)) {
    const emoji = sourceEmojis[source] || "📋";
    const label = SOURCE_LABELS[source] || source;
    lines.push(`${emoji} ${label}: ${items.length} items`);
  }

  lines.push("");
  lines.push("<!-- END PASS-THROUGH FOOTER -->");

  return lines.join("\n");
}
