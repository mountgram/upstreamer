import type { Report, RunOptions, Candidate, SourceItem } from "./schema.js";
import { getConfig } from "./config.js";
import { getDateRange, formatDate } from "./dates.js";
import { renderMarkdown, renderJson, renderCompact } from "./render.js";
import {
  annotateStream,
  pruneLowRelevance,
  dedupeItems,
  sourceQuality,
  reciprocalRankFusion,
  fallbackRank,
  computeFinalScores,
  clusterCandidates,
  localRelevance,
} from "./ranking.js";

export { renderMarkdown, renderJson, renderCompact };
export { getConfig };
export { getDateRange, formatDate, parseDate, daysAgo, recencyScore } from "./dates.js";
export type { Report, RunOptions, Candidate, SourceItem, Cluster, SubQuery, QueryPlan } from "./schema.js";

function generateId(): string {
  return `c_${Math.random().toString(36).slice(2, 10)}`;
}

function inferIntent(topic: string): string {
  const text = topic.toLowerCase();
  if (/\b(vs|versus|compare|compared to|difference between)\b/.test(text)) return "comparison";
  if (/\b(odds|predict|prediction|forecast|chance|probability|will .* win)\b/.test(text)) return "prediction";
  if (/\b(how to|tutorial|guide|setup|step by step|deploy|install)\b/.test(text)) return "how_to";
  if (/\b(latest|news|announced|just shipped|launched|released|update|trending|this week|right now|today)\b/.test(text)) return "breaking_news";
  if (/\b(pricing|feature|features|best .* for|top .* for)\b/.test(text)) return "product";
  return "concept";
}

function defaultQueryPlan(topic: string, sources: string[], depth: string): Report["query_plan"] {
  const intent = inferIntent(topic);
  const quickPriority: Record<string, string[]> = {
    comparison: ["reddit", "x", "hackernews", "youtube"],
    prediction: ["polymarket", "x", "hackernews", "reddit"],
    breaking_news: ["x", "reddit", "hackernews", "youtube", "polymarket"],
    how_to: ["exa", "brave", "youtube", "reddit", "hackernews"],
    product: ["exa", "brave", "hackernews", "youtube", "reddit", "github", "x", "tiktok"],
    concept: ["exa", "brave", "hackernews", "youtube", "reddit"],
  };
  const selected = depth === "quick"
    ? (quickPriority[intent] || quickPriority.concept).filter((source) => sources.includes(source)).slice(0, 3)
    : sources;
  const runSources = selected.length ? selected : sources;
  return {
    intent,
    freshness_mode: intent === "breaking_news" || intent === "prediction" ? "strict_recent" : "evergreen_ok",
    cluster_mode: intent === "comparison" ? "debate" : intent === "prediction" ? "market" : intent === "how_to" ? "workflow" : "story",
    subqueries: [{ label: "primary", search_query: topic, ranking_query: topic, sources: runSources, weight: 1.0 }],
    source_weights: Object.fromEntries(runSources.map((source) => [source, 1.0 / runSources.length])),
    notes: ["deterministic-local-plan"],
  };
}

export async function runResearch(options: RunOptions): Promise<Report> {
  const config = getConfig();
  const { from, to } = getDateRange(options.lookbackDays || 30);
  const depth = options.depth || "medium";

  const depthLimits: Record<string, number> = { quick: 5, medium: 10, deep: 20 };
  const limit = depthLimits[depth] || 10;

  const itemsBySource: Record<string, SourceItem[]> = {};
  const errorsBySource: Record<string, string> = {};

  // Determine available sources
  const availableSources: string[] = [];

  // Always available (no-key)
  availableSources.push("reddit", "hackernews", "polymarket", "github");

  // Key-based sources
  if (config.exaApiKey) availableSources.push("exa");
  if (config.braveApiKey) availableSources.push("brave");
  if (config.serperApiKey) availableSources.push("serper");
  if (config.parallelApiKey) availableSources.push("parallel");
  if (config.xaiApiKey) availableSources.push("x");
  if (config.openrouterApiKey) availableSources.push("perplexity");
  if (config.scrapecreatorsApiKey) {
    availableSources.push("tiktok", "instagram", "threads", "pinterest");
  }
  if (config.bskyHandle && config.bskyAppPassword) availableSources.push("bluesky");
  if (config.truthsocialToken) availableSources.push("truthsocial");
  availableSources.push("digg");

  // YouTube always attemptable (yt-dlp)
  availableSources.push("youtube");

  // Filter by includeSources if specified
  const eligibleSources = options.includeSources
    ? availableSources.filter(s => options.includeSources!.includes(s))
    : availableSources;

  const queryPlan = options.queryPlan || defaultQueryPlan(options.topic, eligibleSources, depth);
  const sourcesToRun = Array.from(new Set(
    queryPlan.subqueries.flatMap((subquery) => subquery.sources).filter((source) => eligibleSources.includes(source))
  ));

  // Run source adapters concurrently
  const sourcePromises = queryPlan.subqueries.flatMap((subquery) => {
    const subquerySources = subquery.sources.filter((source) => eligibleSources.includes(source));
    return subquerySources.map(async (source) => {
      try {
        const items = await searchSource(source, { ...options, topic: subquery.search_query }, config, from, to, depth);
        if (items.length > 0) {
          const annotated = items.map((item) => ({
            ...item,
            metadata: { ...item.metadata, subquery: subquery.label, ranking_query: subquery.ranking_query },
          }));
          itemsBySource[source] = [...(itemsBySource[source] || []), ...annotated];
        }
      } catch (err) {
        errorsBySource[source] = err instanceof Error ? err.message : String(err);
        if (options.debug) {
          console.error(`[${source}] Error: ${err}`);
        }
      }
    });
  });

  await Promise.all(sourcePromises);

  // Normalize, score, dedupe per source
  for (const [source, items] of Object.entries(itemsBySource)) {
    const rankingQuery = String(items[0]?.metadata.ranking_query || options.topic);
    const scored = annotateStream(items, rankingQuery);
    const pruned = pruneLowRelevance(scored);
    const deduped = dedupeItems(pruned);
    itemsBySource[source] = deduped;
  }

  // Build candidates from source items
  const candidates: Candidate[] = [];
  for (const [source, items] of Object.entries(itemsBySource)) {
    for (const item of items) {
      const freshness = item.date_confidence === "high" ? 80 : item.date_confidence === "med" ? 50 : 20;
      const engagement = Object.values(item.engagement).reduce((s: number, v: number) => s + v, 0);
      const candidate: Candidate = {
        candidate_id: generateId(),
        title: item.title,
        snippet: item.snippet || item.body.slice(0, 200),
        source_items: [item],
        subquery_labels: [source],
        url: item.url,
        final_score: item.score,
        rrf_score: 0,
        rerank_score: item.score,
        freshness,
        engagement,
        source_quality: sourceQuality(source),
        fun_score: 0,
        cluster_id: "",
        native_ranks: { [source]: 1 },
        metadata: item.metadata,
        explanation: `From ${source}`,
      };
      candidates.push(candidate);
    }
  }

  // Sort by local score and apply RRF
  candidates.sort((a, b) => b.final_score - a.final_score);
  reciprocalRankFusion([candidates]);

  // Rank and cluster
  fallbackRank(candidates, options.topic);
  computeFinalScores(candidates);

  const clusters = clusterCandidates(candidates);

  // Build warnings
  const warnings: string[] = [];
  if (Object.keys(errorsBySource).length > 0) {
    warnings.push(`Some sources had errors: ${Object.keys(errorsBySource).join(", ")}`);
  }
  if (candidates.length === 0) {
    warnings.push("No results found for topic. Try broadening your search.");
  }

  const report: Report = {
    topic: options.topic,
    range_from: from,
    range_to: to,
    generated_at: new Date().toISOString(),
    provider_runtime: {
      reasoning_provider: "local",
      planner_model: "none",
      rerank_model: "deterministic",
      x_search_backend: config.xaiApiKey ? "xai" : "none",
    },
    query_plan: queryPlan,
    clusters,
    ranked_candidates: candidates,
    items_by_source: itemsBySource,
    errors_by_source: errorsBySource,
    warnings,
    artifacts: {
      sources_attempted: sourcesToRun.length,
      sources_succeeded: Object.keys(itemsBySource).length,
    },
  };

  return report;
}

async function searchSource(
  source: string,
  options: RunOptions,
  config: ReturnType<typeof getConfig>,
  from: string,
  to: string,
  depth: string
): Promise<SourceItem[]> {
  switch (source) {
    case "exa":
      return (await import("./sources/exa.js")).searchExa(options.topic, from, to, depth, config);
    case "brave":
      return (await import("./sources/brave.js")).searchBrave(options.topic, from, to, depth, config);
    case "serper":
      return (await import("./sources/serper.js")).searchSerper(options.topic, from, to, depth, config);
    case "parallel":
      return (await import("./sources/parallel.js")).searchParallel(options.topic, from, to, depth, config);
    case "reddit":
      return (await import("./sources/reddit.js")).searchReddit(options.topic, from, to, depth, options.subreddits);
    case "hackernews":
      return (await import("./sources/hackernews.js")).searchHackerNews(options.topic, from, to, depth);
    case "github":
      return (await import("./sources/github.js")).searchGitHub(options.topic, from, to, depth, config, options);
    case "polymarket":
      return (await import("./sources/polymarket.js")).searchPolymarket(options.topic, from, to, depth);
    case "x":
      return (await import("./sources/x.js")).searchX(options.topic, from, to, depth, config, options);
    case "youtube":
      return (await import("./sources/youtube.js")).searchYouTube(options.topic, from, to, depth);
    case "bluesky":
      return (await import("./sources/bluesky.js")).searchBluesky(options.topic, from, to, depth, config);
    case "truthsocial":
      return (await import("./sources/truthsocial.js")).searchTruthSocial(options.topic, from, to, depth, config);
    case "tiktok":
      return (await import("./sources/tiktok.js")).searchTikTok(options.topic, from, to, depth, config);
    case "instagram":
      return (await import("./sources/instagram.js")).searchInstagram(options.topic, from, to, depth, config);
    case "threads":
      return (await import("./sources/threads.js")).searchThreads(options.topic, from, to, depth, config);
    case "pinterest":
      return (await import("./sources/pinterest.js")).searchPinterest(options.topic, from, to, depth, config);
    case "perplexity":
      return (await import("./sources/perplexity.js")).searchPerplexity(options.topic, from, to, depth, config);
    case "digg":
      return (await import("./sources/digg.js")).searchDigg(options.topic, from, to, depth);
    default:
      return [];
  }
}
