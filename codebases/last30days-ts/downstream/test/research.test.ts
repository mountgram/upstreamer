import { describe, expect, it } from "vitest";
import { research } from "../src/index.js";
import type { SourceAdapter } from "../src/schema.js";

describe("research orchestration", () => {
  it("skips unavailable optional adapters without failing the run", async () => {
    const adapters: SourceAdapter[] = [
      {
        name: "exa",
        needs: ["EXA_API_KEY"],
        isAvailable: () => false,
        async search() {
          throw new Error("should not run");
        }
      }
    ];

    const brief = await research({ topic: "agent research", now: new Date("2026-05-18T00:00:00.000Z") }, adapters);

    expect(brief.runs).toEqual([{ source: "exa", status: "skipped", itemCount: 0, message: "optional adapter unavailable: EXA_API_KEY" }]);
    expect(brief.warnings).toContain("No source returned evidence. Configure an optional source or try a broader topic.");
  });

  it("runs available source adapters and clusters returned evidence", async () => {
    const adapters: SourceAdapter[] = [
      {
        name: "duckduckgo",
        isAvailable: () => true,
        async search() {
          return [
            { source: "duckduckgo", title: "Recent agent research workflow", url: "https://example.com/a", body: "agent research workflow", engagement: { score: 2 } }
          ];
        }
      }
    ];

    const brief = await research({ topic: "agent research", now: new Date("2026-05-18T00:00:00.000Z") }, adapters);

    expect(brief.runs).toEqual([{ source: "duckduckgo", status: "ok", itemCount: 1 }]);
    expect(brief.clusters).toHaveLength(1);
    expect(brief.items[0]?.url).toBe("https://example.com/a");
  });
});
