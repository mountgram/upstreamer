import { access, mkdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
import type { SourceAdapter } from "./schema.js";

export const supportedKeys = [
  "EXA_API_KEY",
  "BRAVE_API_KEY",
  "SERPER_API_KEY",
  "PARALLEL_API_KEY",
  "GITHUB_TOKEN",
  "SCRAPECREATORS_API_KEY",
  "OPENROUTER_API_KEY",
  "AUTH_TOKEN",
  "CT0",
  "XAI_API_KEY",
  "GROK_API_KEY",
  "BSKY_HANDLE",
  "BSKY_APP_PASSWORD",
  "TRUTHSOCIAL_TOKEN",
  "APIFY_API_TOKEN",
  "LAST30DAYS_DIR"
] as const;

export function defaultOutputDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.LAST30DAYS_DIR || join(homedir(), "Documents", "Last30Days");
}

export async function commandExists(command: string): Promise<boolean> {
  const paths = (process.env.PATH || "").split(":").filter(Boolean);
  for (const base of paths) {
    try {
      await access(join(base, command), constants.X_OK);
      return true;
    } catch {
      // try the next PATH entry
    }
  }
  return false;
}

export function describeAvailability(adapters: SourceAdapter[], env: NodeJS.ProcessEnv = process.env): string[] {
  return adapters.map((adapter) => {
    const keys = adapter.needs?.length ? ` needs ${adapter.needs.join(" or ")}` : " no key";
    const available = adapter.isAvailable(env);
    return `${adapter.name}: ${available instanceof Promise ? "check at runtime" : available ? "available" : "not configured"} (${keys})`;
  });
}

export async function writeEnvFile(values: Record<string, string>, path = join(defaultOutputDir(), ".env")): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const body = Object.entries(values)
    .filter(([, value]) => value.length > 0)
    .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
    .join("\n");
  await writeFile(path, `${body}\n`, "utf8");
}
