export type SourceName =
  | "duckduckgo"
  | "exa"
  | "brave"
  | "serper"
  | "parallel"
  | "perplexity"
  | "reddit"
  | "hackernews"
  | "github"
  | "polymarket"
  | "youtube"
  | "x"
  | "tiktok"
  | "instagram"
  | "threads"
  | "pinterest"
  | "bluesky"
  | "truthsocial"
  | "xiaohongshu"
  | "digg";

export interface Engagement {
  score?: number;
  comments?: number;
  likes?: number;
  shares?: number;
  views?: number;
  volume?: number;
}

export interface EvidenceItem {
  source: SourceName;
  title: string;
  url: string;
  body?: string;
  author?: string;
  container?: string;
  publishedAt?: string;
  engagement?: Engagement;
  relevance?: number;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface QueryPlan {
  topic: string;
  subqueries: string[];
  preferredSources?: SourceName[];
}

export interface ResearchOptions {
  topic: string;
  lookbackDays?: number;
  limit?: number;
  format?: "markdown" | "json";
  outputDir?: string;
  debug?: boolean;
  webBackend?: "auto" | "duckduckgo" | "exa" | "brave" | "serper" | "parallel" | "none";
  now?: Date;
}

export interface SourceContext {
  topic: string;
  plan: QueryPlan;
  since: Date;
  limit: number;
  debug: boolean;
  env: NodeJS.ProcessEnv;
}

export interface SourceAdapter {
  name: SourceName;
  needs?: string[];
  isAvailable(env: NodeJS.ProcessEnv): boolean | Promise<boolean>;
  search(context: SourceContext): Promise<EvidenceItem[]>;
}

export interface SourceRun {
  source: SourceName;
  status: "ok" | "skipped" | "failed";
  itemCount: number;
  message?: string;
}

export interface EvidenceCluster {
  title: string;
  items: EvidenceItem[];
  sources: SourceName[];
  score: number;
}

export interface ResearchBrief {
  topic: string;
  generatedAt: string;
  lookbackDays: number;
  plan: QueryPlan;
  items: EvidenceItem[];
  clusters: EvidenceCluster[];
  runs: SourceRun[];
  warnings: string[];
}
