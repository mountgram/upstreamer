#!/usr/bin/env node
import { allAdapters } from "./sources/index.js";
import { defaultOutputDir, describeAvailability, supportedKeys, writeEnvFile } from "./config.js";

async function main(): Promise<void> {
  const values: Record<string, string> = {};
  for (const key of supportedKeys) {
    if (process.env[key]) values[key] = process.env[key]!;
  }
  if (process.argv.includes("--write-env")) {
    await writeEnvFile(values);
    console.log(`Wrote optional configuration to ${defaultOutputDir()}/.env`);
  }
  console.log("Last30Days TS source availability:");
  for (const line of describeAvailability(allAdapters)) console.log(`- ${line}`);
  console.log("Baseline research works without a primary key through DuckDuckGo and public sources. Export keys only for the adapters you want to unlock.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
