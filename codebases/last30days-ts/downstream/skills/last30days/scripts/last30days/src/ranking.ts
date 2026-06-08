import type { Candidate, Cluster, SourceItem } from "./schema.js";
import { recencyScore, daysAgo } from "./dates.js";

// Source quality weights matching upstream signals.py
const SOURCE_QUALITY: Record<string, number> = {
  grounding: 1.0,
  exa: 0.9,
  brave: 0.85,
  serper: 0.85,
  parallel: 0.8,
  perplexity: 0.9,
  reddit: 0.6,
  x: 0.68,
  youtube: 0.55,
  tiktok: 0.35,
  instagram: 0.35,
  hackernews: 0.45,
  polymarket: 0.40,
  github: 0.50,
  bluesky: 0.35,
  truthsocial: 0.30,
  threads: 0.35,
  pinterest: 0.25,
  digg: 0.30,
};

// Engagement field weights per source
const ENGAGEMENT_WEIGHTS: Record<string, [string, number][]> = {
  x: [["likes", 0.55], ["reposts", 0.25], ["replies", 0.15], ["views", 0.05]],
  reddit: [["score", 0.6], ["num_comments", 0.4]],
  youtube: [["views", 0.30], ["likes", 0.40], ["comments", 0.30]],
  tiktok: [["views", 0.35], ["likes", 0.40], ["comments", 0.15], ["shares", 0.10]],
  instagram: [["views", 0.35], ["likes", 0.40], ["comments", 0.15], ["shares", 0.10]],
  hackernews: [["points", 0.5], ["num_comments", 0.5]],
  polymarket: [["volume", 0.5], ["liquidity", 0.5]],
  github: [["stars", 0.6], ["forks", 0.2], ["watchers", 0.2]],
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "can", "shall", "this", "that",
  "it", "its", "i", "you", "he", "she", "they", "we", "not", "no", "so",
]);

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getNgrams(text: string, n = 3): Set<string> {
  const ngrams = new Set<string>();
  const t = text.replace(/\s+/g, " ");
  for (let i = 0; i <= t.length - n; i++) {
    ngrams.add(t.slice(i, i + n));
  }
  return ngrams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const intersect = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersect.size / union.size;
}

function tokenJaccard(a: string, b: string): number {
  const tokensA = new Set(normalizeText(a).split(" ").filter(t => !STOPWORDS.has(t) && t.length > 1));
  const tokensB = new Set(normalizeText(b).split(" ").filter(t => !STOPWORDS.has(t) && t.length > 1));
  return jaccardSimilarity(tokensA, tokensB);
}

function hybridSimilarity(a: string, b: string): number {
  const ngramA = getNgrams(normalizeText(a));
  const ngramB = getNgrams(normalizeText(b));
  const ngramJ = jaccardSimilarity(ngramA, ngramB);
  const tokenJ = tokenJaccard(a, b);
  return Math.max(ngramJ, tokenJ);
}

export function dedupeItems(items: SourceItem[], threshold = 0.7): SourceItem[] {
  const result: SourceItem[] = [];
  for (const item of items) {
    const text = `${item.title} ${item.body} ${item.author} ${item.container}`;
    let isDup = false;
    for (const kept of result) {
      const keptText = `${kept.title} ${kept.body} ${kept.author} ${kept.container}`;
      if (hybridSimilarity(text, keptText) >= threshold) {
        isDup = true;
        break;
      }
    }
    if (!isDup) result.push(item);
  }
  return result;
}

export function sourceQuality(source: string): number {
  return SOURCE_QUALITY[source] ?? 0.3;
}

export function localRelevance(item: SourceItem, rankingQuery: string): number {
  const queryTokens = normalizeText(rankingQuery).split(" ").filter(t => t.length > 1);
  const itemText = normalizeText(`${item.title} ${item.body}`);
  if (queryTokens.length === 0) return 0.5;

  let matches = 0;
  for (const token of queryTokens) {
    if (itemText.includes(token)) matches++;
  }
  const base = matches / queryTokens.length;

  // Floor boost
  if (base < 0.15) return 0.15;
  return base;
}

export function freshnessScore(dateStr: string): number {
  return recencyScore(dateStr, 30);
}

function engagementRaw(item: SourceItem): number {
  const eng = item.engagement;
  if (!eng || Object.keys(eng).length === 0) return 0;

  const weights = ENGAGEMENT_WEIGHTS[item.source];
  if (weights) {
    let score = 0;
    for (const [key, weight] of weights) {
      if (eng[key]) score += eng[key] * weight;
    }
    return score;
  }

  // Generic: sum all engagement values
  return Object.values(eng).reduce((s, v) => s + v, 0);
}

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 50);
  return values.map(v => Math.round(((v - min) / (max - min)) * 100));
}

export function annotateStream(
  items: SourceItem[],
  rankingQuery: string
): SourceItem[] {
  const relScores = items.map(i => localRelevance(i, rankingQuery));
  const freshScores = items.map(i => freshnessScore(i.published_at));
  const engScores = items.map(i => engagementRaw(i));

  const relNorm = normalize(relScores);
  const freshNorm = normalize(freshScores);
  const engNorm = normalize(engScores);

  return items.map((item, i) => {
    const sq = sourceQuality(item.source);
    const score = relNorm[i] * 0.35 + freshNorm[i] * 0.30 + engNorm[i] * 0.25 + sq * 100 * 0.10;
    const primaryToken = normalizeText(rankingQuery).split(" ").find(t => !STOPWORDS.has(t) && t.length > 2);
    const text = normalizeText(`${item.title} ${item.body}`);
    return {
      ...item,
      score: Math.round(score * 100) / 100,
      metadata: {
        ...item.metadata,
        local_relevance: relScores[i],
        primary_query_token_match: primaryToken ? text.includes(primaryToken) : true,
      },
    };
  }).sort((a, b) => b.score - a.score);
}

export function pruneLowRelevance(items: SourceItem[], minimum = 15): SourceItem[] {
  return items.filter(item => {
    const local = typeof item.metadata.local_relevance === "number" ? item.metadata.local_relevance : 1;
    const primaryMatch = item.metadata.primary_query_token_match !== false;
    return item.score >= minimum && local >= 0.34 && primaryMatch;
  });
}

function itemText(item: Candidate | SourceItem): string {
  return `${item.title} ${"body" in item ? item.body : item.snippet}`;
}

export function clusterCandidates(
  candidates: Candidate[],
  _plan?: unknown
): Cluster[] {
  const sorted = [...candidates].sort((a, b) => b.final_score - a.final_score);
  const clusters: { leader: Candidate; members: Candidate[] }[] = [];
  const assigned = new Set<string>();

  for (const c of sorted) {
    if (assigned.has(c.candidate_id)) continue;
    const group = [c];
    assigned.add(c.candidate_id);

    for (const other of sorted) {
      if (assigned.has(other.candidate_id)) continue;
      const sim = hybridSimilarity(itemText(c), itemText(other));
      if (sim >= 0.35) {
        group.push(other);
        assigned.add(other.candidate_id);
      }
    }

    clusters.push({ leader: c, members: group });
  }

  // Entity-based merge of small clusters
  for (let i = 0; i < clusters.length; i++) {
    if (clusters[i].members.length > 3) continue;
    for (let j = i + 1; j < clusters.length; j++) {
      if (clusters[j].members.length > 3) continue;
      const sim = hybridSimilarity(
        clusters[i].leader.title,
        clusters[j].leader.title
      );
      if (sim >= 0.45) {
        clusters[i].members.push(...clusters[j].members);
        clusters.splice(j, 1);
        j--;
      }
    }
  }

  return clusters.map(({ leader, members }, idx) => {
    const sources = [...new Set(members.flatMap(c => c.source_items.map(si => si.source)))];
    const repIds = members.slice(0, 3).map(c => c.candidate_id);
    return {
      cluster_id: `cluster_${idx}`,
      title: leader.title,
      candidate_ids: members.map(c => c.candidate_id),
      representative_ids: repIds,
      sources,
      score: leader.final_score,
      uncertainty: sources.length === 1 ? "single-source" : members.length <= 2 ? "thin-evidence" : null,
    };
  });
}

export function reciprocalRankFusion(
  rankings: Candidate[][],
  k = 60
): void {
  const scores: Record<string, number> = {};
  const counts: Record<string, number> = {};

  for (const ranking of rankings) {
    for (let i = 0; i < ranking.length; i++) {
      const id = ranking[i].candidate_id;
      scores[id] = (scores[id] || 0) + 1 / (k + i + 1);
      counts[id] = (counts[id] || 0) + 1;
    }
  }

  // Normalize by count
  for (const id of Object.keys(scores)) {
    scores[id] = scores[id] / counts[id];
  }

  // Normalize 0-100
  const vals = Object.values(scores);
  const max = Math.max(...vals, 0.001);
  const min = Math.min(...vals);

  for (const id of Object.keys(scores)) {
    const norm = max === min ? 50 : ((scores[id] - min) / (max - min)) * 100;
    // Find and update candidate
    for (const ranking of rankings) {
      const cand = ranking.find(c => c.candidate_id === id);
      if (cand) {
        cand.rrf_score = Math.round(norm * 100) / 100;
        break;
      }
    }
  }
}

export function computeFinalScores(candidates: Candidate[]): Candidate[] {
  for (const c of candidates) {
    c.final_score = Math.round((
      c.rerank_score * 0.60 +
      c.rrf_score * 0.20 +
      c.freshness * 0.10 +
      c.source_quality * 0.05 +
      c.engagement * 0.05
    ) * 100) / 100;
  }
  return [...candidates].sort((a, b) => b.final_score - a.final_score);
}

export function fallbackRank(candidates: Candidate[], topic: string): void {
  const primaryEntity = topic.toLowerCase().trim();
  for (const c of candidates) {
    const text = itemText(c).toLowerCase();
    const containsEntity = text.includes(primaryEntity) || primaryEntity.split(" ").every(w => text.includes(w));
    const sq = sourceQuality(c.source_items[0]?.source ?? "");
    const eng = c.source_items.reduce((s, si) => s + engagementRaw(si), 0) / Math.max(c.source_items.length, 1);
    let score = c.rrf_score * 0.4 + (eng / 100) * 30 + sq * 20;
    if (!containsEntity) score *= 0.5;
    c.rerank_score = Math.round(Math.min(score, 100) * 100) / 100;
  }
}
