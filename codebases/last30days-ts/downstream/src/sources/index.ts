import type { SourceAdapter } from "../schema.js";
import { duckduckgo } from "./duckduckgo.js";
import { exa } from "./exa.js";
import { brave, parallel, perplexity, serper } from "./web.js";
import { reddit } from "./reddit.js";
import { hackernews } from "./hackernews.js";
import { github } from "./github.js";
import { polymarket } from "./polymarket.js";
import { youtube } from "./youtube.js";
import { bluesky, instagram, pinterest, threads, tiktok, truthsocial, x, xiaohongshu } from "./social.js";
import { digg } from "./digg.js";

export const allAdapters: SourceAdapter[] = [
  duckduckgo,
  exa,
  brave,
  serper,
  parallel,
  perplexity,
  reddit,
  hackernews,
  github,
  polymarket,
  youtube,
  x,
  tiktok,
  instagram,
  threads,
  pinterest,
  bluesky,
  truthsocial,
  xiaohongshu,
  digg
];
