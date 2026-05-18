import OpenAI from "openai";
import type { SourceAdapter } from "../schema.js";
import { firstSubquery, makeItem } from "./base.js";

export const brave: SourceAdapter = {
  name: "brave",
  needs: ["BRAVE_API_KEY"],
  isAvailable: (env) => Boolean(env.BRAVE_API_KEY),
  async search(context) {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(firstSubquery(context))}&count=${context.limit}`;
    const response = await fetch(url, { headers: { "x-subscription-token": context.env.BRAVE_API_KEY || "" } });
    if (!response.ok) throw new Error(`Brave returned ${response.status}`);
    const data = (await response.json()) as { web?: { results?: Array<{ title: string; url: string; description?: string; age?: string }> } };
    return (data.web?.results || []).map((item) => makeItem("brave", item.title, item.url, { body: item.description, publishedAt: item.age }));
  }
};

export const serper: SourceAdapter = {
  name: "serper",
  needs: ["SERPER_API_KEY"],
  isAvailable: (env) => Boolean(env.SERPER_API_KEY),
  async search(context) {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "content-type": "application/json", "X-API-KEY": context.env.SERPER_API_KEY || "" },
      body: JSON.stringify({ q: firstSubquery(context), num: context.limit })
    });
    if (!response.ok) throw new Error(`Serper returned ${response.status}`);
    const data = (await response.json()) as { organic?: Array<{ title: string; link: string; snippet?: string; date?: string }> };
    return (data.organic || []).map((item) => makeItem("serper", item.title, item.link, { body: item.snippet, publishedAt: item.date }));
  }
};

export const parallel: SourceAdapter = {
  name: "parallel",
  needs: ["PARALLEL_API_KEY"],
  isAvailable: (env) => Boolean(env.PARALLEL_API_KEY),
  async search(context) {
    const response = await fetch("https://api.parallel.ai/v1beta/search", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${context.env.PARALLEL_API_KEY || ""}` },
      body: JSON.stringify({ objective: firstSubquery(context), search_queries: context.plan.subqueries, max_results: context.limit })
    });
    if (!response.ok) throw new Error(`Parallel returned ${response.status}`);
    const data = (await response.json()) as { results?: Array<{ title?: string; url?: string; excerpts?: string[] }> };
    return (data.results || []).filter((item) => item.url).map((item) => makeItem("parallel", item.title || item.url!, item.url!, { body: item.excerpts?.join(" ") }));
  }
};

export const perplexity: SourceAdapter = {
  name: "perplexity",
  needs: ["OPENROUTER_API_KEY"],
  isAvailable: (env) => Boolean(env.OPENROUTER_API_KEY),
  async search(context) {
    const client = new OpenAI({
      apiKey: context.env.OPENROUTER_API_KEY || "",
      baseURL: "https://openrouter.ai/api/v1"
    });
    const data = await client.chat.completions.create({
      model: "perplexity/sonar-pro",
      messages: [{ role: "user", content: `Find recent, cited evidence about ${context.topic}. Include citations and focus on the last ${context.limit} high-signal results.` }]
    });
    const body = data.choices[0]?.message?.content || "Grounded web result";
    return [makeItem("perplexity", `Perplexity result for ${context.topic}`, "https://www.perplexity.ai/", { body })];
  }
};
