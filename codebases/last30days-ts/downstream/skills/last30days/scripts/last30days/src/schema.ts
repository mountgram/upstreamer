// TypeScript interfaces for the last30days engine

export interface SourceItem {
  item_id: string;
  source: string;
  title: string;
  body: string;
  url: string;
  author: string;
  container: string;
  published_at: string;
  date_confidence: "high" | "med" | "low";
  engagement: Record<string, number>;
  score: number;
  snippet: string;
  metadata: Record<string, unknown>;
}

export interface Candidate {
  candidate_id: string;
  title: string;
  snippet: string;
  source_items: SourceItem[];
  subquery_labels: string[];
  url: string;
  final_score: number;
  rrf_score: number;
  rerank_score: number;
  freshness: number;
  engagement: number;
  source_quality: number;
  fun_score: number;
  cluster_id: string;
  native_ranks: Record<string, number>;
  metadata: Record<string, unknown>;
  explanation: string;
}

export interface Cluster {
  cluster_id: string;
  title: string;
  candidate_ids: string[];
  representative_ids: string[];
  sources: string[];
  score: number;
  uncertainty: string | null;
}

export interface SubQuery {
  label: string;
  search_query: string;
  ranking_query: string;
  sources: string[];
  weight: number;
}

export interface QueryPlan {
  intent: string;
  freshness_mode: string;
  cluster_mode: string;
  subqueries: SubQuery[];
  source_weights: Record<string, number>;
  notes?: string[];
}

export interface ProviderRuntime {
  reasoning_provider: string;
  planner_model: string;
  rerank_model: string;
  x_search_backend: string;
}

export interface HiringSignalSummary {
  themeSignals: Record<string, { count: number; examples: string[] }>;
  strategicRoles: string[];
  companySize: string;
  totalJobs: number;
}

export interface SourceOutcome {
  source: string;
  state: "ok" | "no-results" | "partial" | "rate-limited" | "auth-failed" | "unreachable" | "timeout" | "schema-drift" | "skipped-unconfigured" | "error";
  items_returned: number;
  attempted: boolean;
  detail?: string;
  at?: string;
  fix_hint?: string;
}

export interface FreshnessVerdict {
  claim_id: string;
  candidate_id: string;
  claim: string;
  source: string;
  source_item_id: string;
  verdict: "current" | "stale" | "contradicted" | "unsupported";
  checked_at: string;
  source_url?: string;
  source_timestamp?: string;
  evidence_url?: string;
  evidence_timestamp?: string;
  original_value?: string;
  current_value?: string;
  detail?: string;
}

export interface LibraryContext {
  topic: string;
  published_date: string;
  headline: string;
  summary: string;
  source_kind: "brief" | "store";
}

export interface DiscoveryTopic {
  rank: number;
  name: string;
  why_spiking: string;
  momentum: "new-this-week" | "building";
  velocity_score: number;
  sources: string[];
  engagement_by_source: Record<string, number>;
  command: string;
  evidence_urls: string[];
  top_comment: string;
  corroboration_count: number;
  podcast_angle?: string;
  x_article_angle?: string;
  previously_surfaced_count?: number;
  last_surfaced?: string;
  covered?: string[];
}

export interface DiscoveryReport {
  domain: string;
  range_from: string;
  range_to: string;
  generated_at: string;
  plan: Record<string, unknown>;
  topics: DiscoveryTopic[];
  source_status: Record<string, SourceOutcome>;
  warnings: string[];
  outcome: string;
  weak_signal: boolean;
}

export interface CorpusScanResult {
  items: SourceItem[];
  notes: string[];
  files_scanned: number;
  cache_hits: number;
}

export interface Report {
  topic: string;
  range_from: string;
  range_to: string;
  generated_at: string;
  provider_runtime: ProviderRuntime;
  query_plan: QueryPlan;
  clusters: Cluster[];
  ranked_candidates: Candidate[];
  items_by_source: Record<string, SourceItem[]>;
  errors_by_source: Record<string, string>;
  source_status?: Record<string, SourceOutcome>;
  freshness_verdicts?: FreshnessVerdict[];
  library_context?: LibraryContext[];
  drill_of?: string;
  warnings: string[];
  artifacts: Record<string, unknown>;
  hiring_signals?: HiringSignalSummary;
}

export interface RunOptions {
  topic: string;
  lookbackDays?: number;
  depth?: "quick" | "medium" | "deep";
  timeframe?: "recent" | "all";
  outputFormat?: "markdown" | "json" | "compact";
  outputDir?: string;
  debug?: boolean;
  includeSources?: string[];
  webBackend?: string;
  xHandle?: string;
  subreddits?: string[];
  githubUser?: string;
  githubRepos?: string[];
  queryPlan?: QueryPlan;
  hiringSignals?: boolean;
  jobBoard?: string;
}

export interface SourceAdapter {
  name: string;
  search(query: string, fromDate: string, toDate: string, depth: string): Promise<SourceItem[]>;
  isAvailable(): boolean;
}
