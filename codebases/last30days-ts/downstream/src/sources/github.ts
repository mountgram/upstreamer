import type { Config } from "../config.js";
import type { RunOptions } from "../schema.js";
import type { SourceItem } from "../schema.js";

interface GitHubRepo {
  id: number;
  full_name: string;
  description: string | null;
  html_url: string;
  owner: { login: string };
  created_at: string;
  updated_at: string;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  language: string | null;
  topics: string[];
}

interface GitHubIssue {
  id: number;
  title: string;
  body: string | null;
  html_url: string;
  user: { login: string } | null;
  created_at: string;
  updated_at: string;
  comments: number;
  reactions: { total_count: number };
  state: string;
  labels: { name: string }[];
  pull_request?: unknown;
}

interface GitHubRepoSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubRepo[];
}

interface GitHubIssueSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

function dateConfidence(published_at: string): "high" | "med" | "low" {
  if (!published_at) return "low";
  const d = new Date(published_at);
  if (isNaN(d.getTime())) return "low";
  const now = Date.now();
  const age = now - d.getTime();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (age <= thirtyDays) return "high";
  if (age <= 60 * 24 * 60 * 60 * 1000) return "med";
  return "low";
}

function normalizeRepo(repo: GitHubRepo): SourceItem {
  return {
    source: "github",
    item_id: String(repo.id),
    title: repo.full_name,
    body: repo.description || "",
    url: repo.html_url,
    author: repo.owner.login,
    container: "GitHub",
    published_at: repo.created_at,
    date_confidence: dateConfidence(repo.created_at),
    engagement: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
    },
    score: 0,
    snippet: repo.description || repo.full_name,
    metadata: {
      language: repo.language || null,
      topics: repo.topics,
      type: "repository",
    },
  };
}

function normalizeIssue(issue: GitHubIssue): SourceItem {
  const isPr = !!issue.pull_request;
  return {
    source: "github",
    item_id: String(issue.id),
    title: issue.title,
    body: issue.body || "",
    url: issue.html_url,
    author: issue.user?.login || "",
    container: "GitHub",
    published_at: issue.created_at,
    date_confidence: dateConfidence(issue.created_at),
    engagement: {
      comments: issue.comments,
      reactions_total: issue.reactions?.total_count || 0,
    },
    score: 0,
    snippet: issue.body ? issue.body.slice(0, 300) : issue.title,
    metadata: {
      is_pr: isPr,
      state: issue.state,
      labels: issue.labels.map((l) => l.name),
      type: isPr ? "pull_request" : "issue",
    },
  };
}

async function fetchRepos(
  query: string,
  fromDate: string,
  limit: number,
  token?: string
): Promise<SourceItem[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=${limit}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "last30days/1.0",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) return [];

  const json = (await resp.json()) as GitHubRepoSearchResponse;
  if (!json.items || !Array.isArray(json.items)) return [];

  const from = new Date(fromDate);
  return json.items
    .filter((repo) => {
      const created = new Date(repo.created_at);
      const updated = new Date(repo.updated_at);
      return created >= from || updated >= from;
    })
    .slice(0, limit)
    .map(normalizeRepo);
}

async function fetchIssues(
  query: string,
  fromDate: string,
  limit: number,
  token?: string
): Promise<SourceItem[]> {
  const encodedQuery = encodeURIComponent(`${query}+created:>${fromDate}`);
  const url = `https://api.github.com/search/issues?q=${encodedQuery}&sort=updated&order=desc&per_page=${limit}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "last30days/1.0",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(url, { headers });
  if (!resp.ok) return [];

  const json = (await resp.json()) as GitHubIssueSearchResponse;
  if (!json.items || !Array.isArray(json.items)) return [];

  return json.items.slice(0, limit).map(normalizeIssue);
}

export async function searchGitHub(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config,
  options?: RunOptions
): Promise<SourceItem[]> {
  const depthLimits: Record<string, number> = { quick: 5, medium: 10, deep: 25 };
  const limit = depthLimits[depth] || 10;
  const token = config.githubToken;

  try {
    const reposPromise = fetchRepos(query, fromDate, limit, token);
    const issuesPromise = fetchIssues(query, fromDate, limit, token);
    const [repos, issues] = await Promise.all([reposPromise, issuesPromise]);

    const items = [...repos, ...issues].slice(0, limit * 2);
    return items;
  } catch {
    return [];
  }
}
