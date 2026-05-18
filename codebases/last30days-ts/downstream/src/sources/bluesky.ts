import type { SourceItem } from "../schema.js";
import type { Config } from "../config.js";
import { getDateConfidence } from "../dates.js";

const BSKY_BASE = "https://bsky.social";

const DEPTH_LIMITS: Record<string, number> = {
  quick: 5,
  medium: 10,
  deep: 20,
};

interface BlueskySession {
  accessJwt: string;
  did: string;
}

interface BlueskyPost {
  uri: string;
  cid?: string;
  author?: {
    handle?: string;
    did?: string;
    displayName?: string;
  };
  record?: {
    text: string;
    createdAt?: string;
  };
  likeCount?: number;
  repostCount?: number;
  replyCount?: number;
  indexedAt?: string;
}

let cachedSession: { jwt: string; did: string; expiresAt: number } | null = null;

async function createSession(config: Config): Promise<BlueskySession | null> {
  const handle = config.bskyHandle;
  const password = config.bskyAppPassword;

  if (!handle || !password) return null;

  if (cachedSession && cachedSession.expiresAt > Date.now()) {
    return {
      accessJwt: cachedSession.jwt,
      did: cachedSession.did,
    };
  }

  try {
    const resp = await fetch(`${BSKY_BASE}/xrpc/com.atproto.server.createSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: handle, password }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Bluesky session failed (${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = (await resp.json()) as { accessJwt: string; did: string };
    cachedSession = {
      jwt: data.accessJwt,
      did: data.did,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };

    return {
      accessJwt: data.accessJwt,
      did: data.did,
    };
  } catch (err) {
    console.error("[bluesky] Session creation error:", err instanceof Error ? err.message : String(err));
    cachedSession = null;
    return null;
  }
}

function blueskyUrl(uri: string, handle?: string): string {
  const match = /at:\/\/(did:plc:[^/]+)\/app\.bsky\.feed\.post\/(.+)/.exec(uri);

  if (match && handle) {
    return `https://bsky.app/profile/${handle}/post/${match[2]}`;
  }

  if (match) {
    return `https://bsky.app/profile/${match[1]}/post/${match[2]}`;
  }

  return uri;
}

export async function searchBluesky(
  query: string,
  fromDate: string,
  toDate: string,
  depth: string,
  config: Config
): Promise<SourceItem[]> {
  const session = await createSession(config);
  if (!session) {
    console.error("[bluesky] No Bluesky credentials configured (BSKY_HANDLE, BSKY_APP_PASSWORD)");
    return [];
  }

  const limit = DEPTH_LIMITS[depth] ?? DEPTH_LIMITS.medium;

  try {
    const params = new URLSearchParams({
      q: query,
      limit: String(Math.min(limit, 50)),
      sort: "latest",
    });

    const resp = await fetch(
      `${BSKY_BASE}/xrpc/app.bsky.feed.searchPosts?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessJwt}`,
          Accept: "application/json",
        },
      }
    );

    if (!resp.ok) {
      if (resp.status === 401) {
        cachedSession = null;
        throw new Error("Bluesky session expired");
      }
      const text = await resp.text();
      throw new Error(`Bluesky search failed (${resp.status}): ${text.slice(0, 200)}`);
    }

    const data = (await resp.json()) as { posts?: BlueskyPost[] };
    const posts = data.posts;

    if (!posts || !Array.isArray(posts)) return [];

    const items: SourceItem[] = [];

    for (const post of posts) {
      const text = post.record?.text || "";
      const author = post.author?.handle || post.author?.displayName || "";
      const createdAt = post.record?.createdAt || post.indexedAt || new Date().toISOString();
      const uri = post.uri || "";
      const postUrl = blueskyUrl(uri, author);

      const title = text.length > 100 ? text.slice(0, 97) + "..." : text;

      const publishedAt = createdAt;

      items.push({
        item_id: uri,
        source: "bluesky",
        title,
        body: text,
        url: postUrl,
        author,
        container: "Bluesky",
        published_at: publishedAt,
        date_confidence: getDateConfidence(createdAt, fromDate, toDate),
        engagement: {
          likes: post.likeCount ?? 0,
          reposts: post.repostCount ?? 0,
          replies: post.replyCount ?? 0,
        },
        score: 0,
        snippet: text.slice(0, 200),
        metadata: {},
      });

      if (items.length >= limit) break;
    }

    return items;
  } catch (err) {
    console.error("[bluesky] Search error:", err instanceof Error ? err.message : String(err));
    return [];
  }
}
