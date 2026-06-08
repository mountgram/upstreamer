import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getConfig, resetConfig } from "../src/config.js";

const originalCwd = process.cwd();
const originalEnv = { ...process.env };

afterEach(() => {
  process.chdir(originalCwd);
  resetConfig();
  process.env = { ...originalEnv };
});

describe("config", () => {
  it("strips surrounding quotes from .env values", () => {
    const dir = mkdtempSync(join(tmpdir(), "last30days-config-"));
    try {
      writeFileSync(join(dir, ".env"), 'GROK_API_KEY="grok-test-key"\nEXA_API_KEY=\'exa-test-key\'\n');
      process.chdir(dir);

      const config = getConfig();

      expect(config.grokApiKey).toBe("grok-test-key");
      expect(config.xaiApiKey).toBe("grok-test-key");
      expect(config.exaApiKey).toBe("exa-test-key");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("can ignore local .env files for isolated evals", () => {
    const dir = mkdtempSync(join(tmpdir(), "last30days-config-"));
    try {
      writeFileSync(join(dir, ".env"), 'GROK_API_KEY="grok-test-key"\n');
      process.chdir(dir);
      process.env.LAST30DAYS_IGNORE_ENV_FILE = "1";

      const config = getConfig();

      expect(config.grokApiKey).toBeUndefined();
      expect(config.xaiApiKey).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
