import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 15,
  deep: 30,
};

const HIRING_THEME_KEYWORDS: Record<string, string[]> = {
  "enterprise readiness": [
    "enterprise", "compliance", "soc2", "fedramp", "security clearance",
    "on-premise", "on-prem", "sso", "saml", "audit", "governance",
  ],
  "go-to-market": [
    "sales", "account executive", "customer success", "sdr", "bdr",
    "marketing", "growth", "demand generation", "partnerships", "business development",
  ],
  "ai/ml": [
    "machine learning", "artificial intelligence", "ml engineer", "data scientist",
    "nlp", "llm", "deep learning", "neural network", "rag", "fine-tuning",
    "ai engineer", "ai/ml", "mlops",
  ],
  "infrastructure": [
    "devops", "sre", "site reliability", "platform engineer", "infrastructure",
    "kubernetes", "docker", "terraform", "aws", "cloud engineer", "distributed systems",
  ],
  "product expansion": [
    "product manager", "product designer", "ux", "mobile", "ios", "android",
    "full stack", "frontend", "backend", "api", "sdk",
  ],
  "data/analytics": [
    "data engineer", "data analyst", "analytics", "data pipeline",
    "etl", "data warehouse", "business intelligence", "bi ",
  ],
};

const SENIORITY_TERMS = [
  "director", "vp", "vice president", "head of", "chief", "cto", "cfo",
  "ceo", "coo", "lead", "principal", "staff", "senior", "sr.",
  "manager", "architect", "founder",
];

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  departments?: Array<{ name: string }>;
  content?: string;
}

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt: number;
  categories?: {
    location?: string;
    team?: string;
    commitment?: string;
  };
  descriptionPlain?: string;
}

interface AshbyJob {
  id: string;
  title: string;
  location: string;
  applyUrl: string;
  updatedAt: string;
  department?: string;
  descriptionPlain?: string;
}

async function fetchGreenhouse(board: string, limit: number): Promise<SourceItem[]> {
  try {
    const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "last30days-ts/0.1" },
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as { jobs?: GreenhouseJob[] };
    const jobs = data.jobs ?? [];

    return jobs.slice(0, limit).map((job) => {
      const publishedAt = job.updated_at
        ? new Date(job.updated_at).toISOString()
        : new Date().toISOString();
      const dept = job.departments?.[0]?.name || "";
      const body = job.content || "";
      return {
        item_id: `greenhouse-${job.id}`,
        source: "jobs",
        title: job.title,
        body,
        url: job.absolute_url,
        author: dept,
        container: "Greenhouse",
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, "", ""),
        engagement: {},
        score: 0,
        snippet: body.slice(0, 300) || job.title,
        metadata: {
          board,
          location: job.location?.name || "",
          department: dept,
          company_size_tier: "unknown",
        },
      } as SourceItem;
    });
  } catch {
    return [];
  }
}

async function fetchLever(board: string, limit: number): Promise<SourceItem[]> {
  try {
    const url = `https://api.lever.co/v0/postings/${encodeURIComponent(board)}?mode=json`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "last30days-ts/0.1" },
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as LeverJob[] | { error?: string };
    if (!Array.isArray(data)) return [];

    return data.slice(0, limit).map((job) => {
      const publishedAt = job.createdAt
        ? new Date(job.createdAt).toISOString()
        : new Date().toISOString();
      const body = job.descriptionPlain || job.text || "";
      return {
        item_id: `lever-${job.id}`,
        source: "jobs",
        title: job.text?.split("\n")[0]?.trim() || "Job Posting",
        body,
        url: job.hostedUrl,
        author: job.categories?.team || "",
        container: "Lever",
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, "", ""),
        engagement: {},
        score: 0,
        snippet: body.slice(0, 300),
        metadata: {
          board,
          location: job.categories?.location || "",
          department: job.categories?.team || "",
          company_size_tier: "unknown",
        },
      } as SourceItem;
    });
  } catch {
    return [];
  }
}

async function fetchAshby(board: string, limit: number): Promise<SourceItem[]> {
  try {
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "last30days-ts/0.1" },
    });
    if (!resp.ok) return [];

    const data = (await resp.json()) as { jobs?: AshbyJob[] };
    const jobs = data.jobs ?? [];

    return jobs.slice(0, limit).map((job) => {
      const publishedAt = job.updatedAt
        ? new Date(job.updatedAt).toISOString()
        : new Date().toISOString();
      const body = job.descriptionPlain || "";
      return {
        item_id: `ashby-${job.id}`,
        source: "jobs",
        title: job.title,
        body,
        url: job.applyUrl,
        author: job.department || "",
        container: "Ashby",
        published_at: publishedAt,
        date_confidence: getDateConfidence(publishedAt, "", ""),
        engagement: {},
        score: 0,
        snippet: body.slice(0, 300) || job.title,
        metadata: {
          board,
          location: job.location || "",
          department: job.department || "",
          company_size_tier: "unknown",
        },
      } as SourceItem;
    });
  } catch {
    return [];
  }
}

function inferCompanySize(jobCount: number): string {
  if (jobCount <= 30) return "startup";
  if (jobCount <= 100) return "mid-market";
  if (jobCount <= 500) return "growth";
  if (jobCount <= 5000) return "large-enterprise";
  return "mega-cap";
}

function analyzeHiringSignals(items: SourceItem[]): {
  themeSignals: Record<string, { count: number; examples: string[] }>;
  strategicRoles: string[];
  companySize: string;
  totalJobs: number;
} {
  const themeSignals: Record<string, { count: number; examples: string[] }> = {};
  const strategicRoles: string[] = [];
  const seenTitles = new Set<string>();

  for (const item of items) {
    const text = `${item.title} ${item.body}`.toLowerCase();

    for (const [theme, keywords] of Object.entries(HIRING_THEME_KEYWORDS)) {
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          if (!themeSignals[theme]) {
            themeSignals[theme] = { count: 0, examples: [] };
          }
          themeSignals[theme].count++;
          if (themeSignals[theme].examples.length < 3) {
            themeSignals[theme].examples.push(item.title);
          }
          break;
        }
      }
    }

    for (const term of SENIORITY_TERMS) {
      if (item.title.toLowerCase().includes(term)) {
        const key = item.title;
        if (!seenTitles.has(key)) {
          seenTitles.add(key);
          strategicRoles.push(key);
        }
        break;
      }
    }
  }

  return {
    themeSignals,
    strategicRoles: strategicRoles.slice(0, 10),
    companySize: inferCompanySize(items.length),
    totalJobs: items.length,
  };
}

export { analyzeHiringSignals as analyzeHiring };

export async function searchJobs(
  query: string,
  _fromDate: string,
  _toDate: string,
  depth: string,
  _config: Config,
  board?: string
): Promise<SourceItem[]> {
  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  const searchBoards = board
    ? [board]
    : [query.toLowerCase().replace(/[^a-z0-9]/g, "")];

  const results: SourceItem[] = [];

  for (const b of searchBoards) {
    const [greenhouse, lever, ashby] = await Promise.all([
      fetchGreenhouse(b, Math.ceil(limit / 3)),
      fetchLever(b, Math.ceil(limit / 3)),
      fetchAshby(b, Math.ceil(limit / 3)),
    ]);

    results.push(...greenhouse, ...lever, ...ashby);
    if (results.length >= limit) break;
  }

  return results.slice(0, limit);
}
