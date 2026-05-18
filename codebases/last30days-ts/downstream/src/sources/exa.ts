import { Exa } from "exa-js";
import type { SourceAdapter } from "../schema.js";
import { firstSubquery, makeItem } from "./base.js";

export const exa: SourceAdapter = {
  name: "exa",
  needs: ["EXA_API_KEY"],
  isAvailable: (env) => Boolean(env.EXA_API_KEY),
  async search(context) {
    const client = new Exa(context.env.EXA_API_KEY || "");
    const data = await client.searchAndContents(firstSubquery(context), {
      numResults: context.limit,
      type: "neural",
      useAutoprompt: true,
      text: true
    });
    return data.results.map((item) => makeItem("exa", item.title || item.url, item.url, {
      body: item.text,
      author: item.author,
      publishedAt: item.publishedDate
    }));
  }
};
