import type { EvidenceCluster, EvidenceItem } from "./schema.js";
import { parseDate } from "./dates.js";

export function normalizeTopic(topic: string): string[] {
  return topic.toLowerCase().split(/[^a-z0-9]+/).filter((part) => part.length > 2);
}

export function scoreItem(item: EvidenceItem, topic: string, now = new Date()): number {
  const terms = normalizeTopic(topic);
  const haystack = `${item.title} ${item.body || ""} ${item.author || ""} ${item.container || ""}`.toLowerCase();
  const textScore = terms.reduce((total, term) => total + (haystack.includes(term) ? 8 : 0), 0);
  const engagement = item.engagement || {};
  const engagementScore = Math.log1p(
    (engagement.score || 0) +
      (engagement.comments || 0) * 2 +
      (engagement.likes || 0) +
      (engagement.shares || 0) +
      (engagement.views || 0) / 100 +
      (engagement.volume || 0) / 1000
  );
  const published = parseDate(item.publishedAt);
  const ageDays = published ? Math.max(0, (now.getTime() - published.getTime()) / 86_400_000) : 15;
  const freshness = Math.max(0, 30 - ageDays) / 3;
  return Math.round(textScore + engagementScore + freshness + (item.relevance || 0));
}

export function itemMatchesTopic(item: EvidenceItem, topic: string): boolean {
  const terms = normalizeTopic(topic);
  if (!terms.length) return true;
  const haystack = `${item.title} ${item.body || ""} ${item.author || ""} ${item.container || ""}`.toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

export function dedupeItems(items: EvidenceItem[]): EvidenceItem[] {
  const seen = new Set<string>();
  const out: EvidenceItem[] = [];
  for (const item of items) {
    const key = item.url ? item.url.replace(/[#?].*$/, "") : item.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function clusterKey(item: EvidenceItem): string {
  return item.title.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((word) => word.length > 4).slice(0, 5).join(" ");
}

export function clusterItems(items: EvidenceItem[], topic: string, now = new Date()): EvidenceCluster[] {
  const groups = new Map<string, EvidenceItem[]>();
  for (const item of dedupeItems(items)) {
    const key = clusterKey(item) || item.title.toLowerCase();
    groups.set(key, [...(groups.get(key) || []), item]);
  }
  return [...groups.values()]
    .map((clusterItems) => {
      const scored = clusterItems.map((item) => ({ item, score: scoreItem(item, topic, now) }));
      scored.sort((a, b) => b.score - a.score);
      const sources = [...new Set(scored.map(({ item }) => item.source))];
      return {
        title: scored[0]?.item.title || "Untitled",
        items: scored.map(({ item }) => item),
        sources,
        score: scored.reduce((total, entry) => total + entry.score, 0) + sources.length * 4
      } satisfies EvidenceCluster;
    })
    .sort((a, b) => b.score - a.score);
}
