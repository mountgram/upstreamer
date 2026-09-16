import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface Config {
  exaApiKey?: string;
  braveApiKey?: string;
  serperApiKey?: string;
  parallelApiKey?: string;
  openaiApiKey?: string;
  openrouterApiKey?: string;
  geminiApiKey?: string;
  xaiApiKey?: string;
  grokApiKey?: string;
  bskyHandle?: string;
  bskyAppPassword?: string;
  truthsocialToken?: string;
  scrapecreatorsApiKey?: string;
  apifyApiToken?: string;
  githubToken?: string;
  last30daysDir?: string;
  openaiBaseUrl?: string;
  xaiBaseUrl?: string;
  openrouterBaseUrl?: string;
}

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  _config = loadConfig();
  return _config;
}

export function resetConfig(): void {
  _config = null;
}

function loadConfig(): Config {
  const env = process.env;
  const config: Config = {};

  // Load from .env file if present
  try {
    const cwd = process.cwd();
    if (env.LAST30DAYS_IGNORE_ENV_FILE !== "1") {
      const envFile = readFileSync(resolve(cwd, ".env"), "utf-8");
      for (const line of envFile.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = stripEnvQuotes(stripInlineComment(trimmed.slice(eqIdx + 1).trim()));
        if (!env[key]) env[key] = value;
      }
    }
  } catch {
    // .env file is optional
  }

  config.exaApiKey = env.EXA_API_KEY;
  config.braveApiKey = env.BRAVE_API_KEY;
  config.serperApiKey = env.SERPER_API_KEY;
  config.parallelApiKey = env.PARALLEL_API_KEY;
  config.openaiApiKey = env.OPENAI_API_KEY;
  config.openrouterApiKey = env.OPENROUTER_API_KEY;
  config.geminiApiKey = env.GEMINI_API_KEY;
  config.xaiApiKey = env.XAI_API_KEY || env.GROK_API_KEY;
  config.grokApiKey = env.GROK_API_KEY;
  config.bskyHandle = env.BSKY_HANDLE;
  config.bskyAppPassword = env.BSKY_APP_PASSWORD;
  config.truthsocialToken = env.TRUTHSOCIAL_TOKEN;
  config.scrapecreatorsApiKey = env.SCRAPECREATORS_API_KEY;
  config.apifyApiToken = env.APIFY_API_TOKEN;
  config.githubToken = env.GITHUB_TOKEN;
  config.last30daysDir = env.LAST30DAYS_DIR || "./output";
  config.openaiBaseUrl = normalizeApiRoot(env.OPENAI_BASE_URL);
  config.xaiBaseUrl = normalizeApiRoot(env.XAI_BASE_URL);
  config.openrouterBaseUrl = normalizeApiRoot(env.OPENROUTER_BASE_URL);
  if (env.LAST30DAYS_TRUSTPILOT_NO_BROWSER) {
    (config as Record<string, unknown>).LAST30DAYS_TRUSTPILOT_NO_BROWSER = env.LAST30DAYS_TRUSTPILOT_NO_BROWSER;
  }

  return config;
}

function stripEnvQuotes(value: string): string {
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return value.slice(1, -1);
    }
  }
  return value;
}

// Strip a trailing `# comment` from an unquoted .env value. `#` inside quotes
// or glued to the value stays literal, matching upstream env parsing.
export function stripInlineComment(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) return value;
  let quote: string | null = null;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (quote) {
      if (ch === quote && value[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "#" && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i).trimEnd();
    }
  }
  return value.trimEnd();
}

// Accept an OpenAI-compatible API root (e.g. `https://host` or `https://host/v1`)
// and normalize to a trailing-slash-free base URL. Returns undefined for empty.
export function normalizeApiRoot(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const base = trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
  return base || undefined;
}
