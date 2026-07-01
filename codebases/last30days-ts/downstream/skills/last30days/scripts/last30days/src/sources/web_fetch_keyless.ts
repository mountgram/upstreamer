export interface KeylessFetchResult {
  ok: boolean;
  markdown: string;
  reason: string;
  cachedSnapshot: boolean;
}

/**
 * Fetches URL content as markdown via Jina Reader (https://r.jina.ai/{url}).
 * Free, no API key required. Used by adapters that need to fetch page content.
 */
export async function fetchMarkdown(url: string, timeoutMs = 15000): Promise<KeylessFetchResult> {
  const fetchUrl = `https://r.jina.ai/${encodeURIComponent(url)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(fetchUrl, {
      headers: {
        Accept: "text/markdown",
        "User-Agent": "last30days-ts/0.1",
      },
      signal: controller.signal,
    });

    if (!resp.ok) {
      return {
        ok: false,
        markdown: "",
        reason: `HTTP ${resp.status}: ${resp.statusText}`,
        cachedSnapshot: false,
      };
    }

    const text = await resp.text();
    const isCached = /cached.*snapshot/i.test(text.slice(0, 500));

    if (!text.trim()) {
      return {
        ok: false,
        markdown: "",
        reason: "Empty response body",
        cachedSnapshot: false,
      };
    }

    return {
      ok: true,
      markdown: text,
      reason: "",
      cachedSnapshot: isCached,
    };
  } catch (err) {
    return {
      ok: false,
      markdown: "",
      reason: err instanceof Error ? err.message : "Unknown fetch error",
      cachedSnapshot: false,
    };
  } finally {
    clearTimeout(timer);
  }
}
