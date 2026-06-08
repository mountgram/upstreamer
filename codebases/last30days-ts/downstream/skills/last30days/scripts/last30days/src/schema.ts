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
  warnings: string[];
  artifacts: Record<string, unknown>;
}

export interface RunOptions {
  topic: string;
  lookbackDays?: number;
  depth?: "quick" | "medium" | "deep";
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
}

export interface SourceAdapter {
  name: string;
  search(query: string, fromDate: string, toDate: string, depth: string): Promise<SourceItem[]>;
  isAvailable(): boolean;
}
