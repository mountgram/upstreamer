import { spawn } from "node:child_process";
import type { EvidenceItem, SourceContext, SourceName } from "../schema.js";

export function hasAny(env: NodeJS.ProcessEnv, keys: string[]): boolean {
  return keys.some((key) => Boolean(env[key]));
}

export function makeItem(source: SourceName, title: string, url: string, patch: Partial<EvidenceItem> = {}): EvidenceItem {
  return { source, title, url, ...patch };
}

export async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return (await response.json()) as T;
}

export function firstSubquery(context: SourceContext): string {
  return context.plan.subqueries[0] || context.topic;
}

export async function runCommand(command: string, args: string[], timeoutMs = 20_000): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];
    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`${command} timed out`));
    }, timeoutMs);
    child.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => errors.push(Buffer.from(chunk)));
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(Buffer.concat(chunks).toString("utf8"));
      else reject(new Error(Buffer.concat(errors).toString("utf8") || `${command} exited ${code}`));
    });
  });
}
