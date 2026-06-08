import type { Config } from "../config.js";
import type { RunOptions } from "../schema.js";
import type { SourceItem } from "../schema.js";
import { spawnSync } from "node:child_process";

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

interface GitHubUserRepo extends GitHubRepo {
  pushed_at: string | null;
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

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "last30days-ts/0.1",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function resolveToken(config: Config): string | undefined {
  if (config.githubToken) return config.githubToken;
  try {
    const result = spawnSync("gh", ["auth", "token"], { encoding: "utf-8", timeout: 5000 });
    const token = result.status === 0 ? result.stdout.trim() : "";
    return token || undefined;
  } catch {
    return undefined;
  }
}

function addDateConfidence(item: SourceItem): SourceItem {
  return { ...item, date_confidence: dateConfidence(item.published_at) };
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
  const headers = githubHeaders(token);

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
  const encodedQuery = encodeURIComponent(`${query} created:>${fromDate}`);
  const url = `https://api.github.com/search/issues?q=${encodedQuery}&sort=updated&order=desc&per_page=${limit}`;
  const headers = githubHeaders(token);

  const resp = await fetch(url, { headers });
  if (!resp.ok) return [];

  const json = (await resp.json()) as GitHubIssueSearchResponse;
  if (!json.items || !Array.isArray(json.items)) return [];

  return json.items.slice(0, limit).map(normalizeIssue);
}

async function fetchPersonActivity(
  user: string,
  fromDate: string,
  limit: number,
  token?: string
): Promise<SourceItem[]> {
  const clean = user.replace(/^@/, "").trim();
  if (!clean) return [];
  const headers = githubHeaders(token);
  const prQuery = encodeURIComponent(`author:${clean} is:pr created:>${fromDate}`);
  const prUrl = `https://api.github.com/search/issues?q=${prQuery}&sort=updated&order=desc&per_page=${limit}`;
  const reposUrl = `https://api.github.com/users/${encodeURIComponent(clean)}/repos?sort=pushed&per_page=${Math.min(limit, 10)}`;

  const [prsResp, reposResp] = await Promise.all([
    fetch(prUrl, { headers }),
    fetch(reposUrl, { headers }),
  ]);

  const items: SourceItem[] = [];
  if (prsResp.ok) {
    const prs = (await prsResp.json()) as GitHubIssueSearchResponse;
    items.push(...(prs.items || []).slice(0, limit).map(normalizeIssue).map((item) => ({
      ...item,
      metadata: { ...item.metadata, mode: "person-pr", github_user: clean },
      explanation: `Recent pull request by ${clean}`,
    } as SourceItem)));
  }
  if (reposResp.ok) {
    const repos = (await reposResp.json()) as GitHubUserRepo[];
    for (const repo of repos.slice(0, Math.min(5, limit))) {
      const item = normalizeRepo(repo);
      items.push(addDateConfidence({
        ...item,
        published_at: repo.pushed_at || repo.updated_at || repo.created_at,
        metadata: { ...item.metadata, mode: "person-repo", github_user: clean, pushed_at: repo.pushed_at },
      }));
    }
  }
  return items;
}

async function fetchRepoActivity(
  repos: string[],
  fromDate: string,
  limit: number,
  token?: string
): Promise<SourceItem[]> {
  const headers = githubHeaders(token);
  const items: SourceItem[] = [];
  for (const repo of repos.map((r) => r.trim()).filter(Boolean).slice(0, 5)) {
    const repoUrl = `https://api.github.com/repos/${repo}`;
    const issueQuery = encodeURIComponent(`repo:${repo} created:>${fromDate}`);
    const issueUrl = `https://api.github.com/search/issues?q=${issueQuery}&sort=updated&order=desc&per_page=${Math.min(limit, 10)}`;
    const [repoResp, issuesResp] = await Promise.all([
      fetch(repoUrl, { headers }),
      fetch(issueUrl, { headers }),
    ]);
    if (repoResp.ok) {
      const repoData = (await repoResp.json()) as GitHubRepo;
      items.push({ ...normalizeRepo(repoData), metadata: { ...normalizeRepo(repoData).metadata, mode: "project-repo" } });
    }
    if (issuesResp.ok) {
      const issues = (await issuesResp.json()) as GitHubIssueSearchResponse;
      items.push(...(issues.items || []).slice(0, limit).map(normalizeIssue).map((item) => ({
        ...item,
        metadata: { ...item.metadata, mode: "project-issue", repo },
      })));
    }
  }
  return items;
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
  const token = resolveToken(config);

  try {
    const tasks: Array<Promise<SourceItem[]>> = [
      fetchRepos(query, fromDate, limit, token),
      fetchIssues(query, fromDate, limit, token),
    ];
    if (options?.githubUser) tasks.push(fetchPersonActivity(options.githubUser, fromDate, limit, token));
    if (options?.githubRepos?.length) tasks.push(fetchRepoActivity(options.githubRepos, fromDate, limit, token));
    const results = await Promise.all(tasks);

    const seen = new Set<string>();
    return results.flat().filter((item) => {
      if (seen.has(item.url)) return false;
      seen.add(item.url);
      return true;
    }).slice(0, limit * 3);
  } catch {
    return [];
  }
}
