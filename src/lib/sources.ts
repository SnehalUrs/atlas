import type { Signal, SourceName } from "./types";

const UA = "atlas/0.1 (feedback analysis)";
const MAX_TEXT = 1500;

type RawSignal = Omit<Signal, "id" | "product">;

function decode(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function clean(text: string): string {
  return decode(decode(text).replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " "))
    .replace(/\[link\]|\[comments\]|submitted by \/u\/\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TEXT);
}

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000), cache: "no-store" });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

/* ---------- Reddit ---------- */

interface RedditListing {
  data: {
    children: {
      data: {
        id: string;
        title?: string;
        selftext?: string;
        body?: string;
        permalink?: string;
        num_comments?: number;
      };
    }[];
  };
}

let redditToken: { value: string; expires: number } | null = null;

/** App-only OAuth token, when REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET are configured. */
async function getRedditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (redditToken && redditToken.expires > Date.now()) return redditToken.value;
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        "User-Agent": UA,
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { access_token: string; expires_in: number };
    redditToken = { value: data.access_token, expires: Date.now() + (data.expires_in - 60) * 1000 };
    return redditToken.value;
  } catch {
    return null;
  }
}

async function fetchRedditApi(product: string, limit: number, token: string): Promise<RawSignal[]> {
  const auth = { Authorization: `Bearer ${token}` };
  const search = await getJson<RedditListing>(
    `https://oauth.reddit.com/search?q=${encodeURIComponent(product)}&sort=relevance&t=year&limit=50&raw_json=1`,
    auth,
  );
  if (!search) return [];

  const posts = search.data.children.map((c) => c.data);
  const out: RawSignal[] = posts.map((p) => ({
    source: "reddit" as const,
    text: clean(`${p.title ?? ""}. ${p.selftext ?? ""}`),
    url: p.permalink ? `https://www.reddit.com${p.permalink}` : undefined,
  }));

  // Comments carry most of the complaints; pull them from the busiest threads.
  const busiest = [...posts].sort((a, b) => (b.num_comments ?? 0) - (a.num_comments ?? 0)).slice(0, 5);
  const threads = await Promise.all(
    busiest.map((p) => getJson<RedditListing[]>(`https://oauth.reddit.com/comments/${p.id}?limit=40&depth=1&sort=top&raw_json=1`, auth)),
  );
  threads.forEach((thread, i) => {
    for (const c of thread?.[1]?.data.children ?? []) {
      const body = c.data.body;
      if (!body || body === "[deleted]" || body === "[removed]") continue;
      out.push({ source: "reddit", text: clean(body), url: `https://www.reddit.com${busiest[i].permalink}${c.data.id}` });
    }
  });
  return out.filter((s) => s.text.length > 40).slice(0, limit);
}

function parseAtom(xml: string): { id: string; title: string; content: string; link: string }[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    id: e.match(/<id>([^<]*)<\/id>/)?.[1] ?? "",
    title: e.match(/<title>([^<]*)<\/title>/)?.[1] ?? "",
    content: e.match(/<content[^>]*>([\s\S]*?)<\/content>/)?.[1] ?? "",
    link: e.match(/<link href="([^"]*)"/)?.[1] ?? "",
  }));
}

/** Fallback without API keys: Reddit's public Atom feeds (posts, plus comments on the first few threads). */
async function fetchRedditRss(product: string, limit: number): Promise<RawSignal[]> {
  const xml = await getText(`https://www.reddit.com/search.rss?q=${encodeURIComponent(product)}&sort=relevance&t=year&limit=100`);
  if (!xml) return [];
  const posts = parseAtom(xml).filter((e) => e.id.startsWith("t3_"));
  const out: RawSignal[] = posts.map((p) => ({ source: "reddit" as const, text: clean(`${p.title}. ${p.content}`), url: decode(p.link) }));

  // The feeds rate-limit quickly, so fetch threads one at a time and stop at the first refusal.
  for (const p of posts.slice(0, 3)) {
    const thread = await getText(`https://www.reddit.com/comments/${p.id.slice(3)}.rss?limit=40&depth=1&sort=top`);
    if (!thread) break;
    for (const c of parseAtom(thread).filter((e) => e.id.startsWith("t1_"))) {
      out.push({ source: "reddit", text: clean(c.content), url: decode(c.link) });
    }
  }
  return out.filter((s) => s.text.length > 40).slice(0, limit);
}

async function fetchReddit(product: string, limit: number): Promise<RawSignal[]> {
  const token = await getRedditToken();
  return token ? fetchRedditApi(product, limit, token) : fetchRedditRss(product, limit);
}

/* ---------- App Store ---------- */

interface ItunesSearch {
  results: { trackId: number; trackName: string }[];
}
interface ItunesReviews {
  feed?: {
    entry?: {
      title?: { label: string };
      content?: { label: string };
      "im:rating"?: { label: string };
    }[];
  };
}

async function fetchAppStore(product: string, limit: number): Promise<RawSignal[]> {
  const search = await getJson<ItunesSearch>(
    `https://itunes.apple.com/search?term=${encodeURIComponent(product)}&entity=software&limit=1&country=us`,
  );
  const app = search?.results[0];
  if (!app) return [];

  const pages = await Promise.all(
    [1, 2, 3].map((page) =>
      getJson<ItunesReviews>(
        `https://itunes.apple.com/us/rss/customerreviews/page=${page}/id=${app.trackId}/sortby=mostrecent/json`,
      ),
    ),
  );
  const out: RawSignal[] = [];
  for (const page of pages) {
    for (const e of page?.feed?.entry ?? []) {
      if (!e.content) continue;
      out.push({
        source: "appstore",
        text: clean(`${e.title?.label ?? ""}. ${e.content.label}`),
        rating: Number(e["im:rating"]?.label) || undefined,
        url: `https://apps.apple.com/us/app/id${app.trackId}`,
      });
    }
  }
  return out.slice(0, limit);
}

/* ---------- Hacker News ---------- */

interface HnSearch {
  hits: { objectID: string; comment_text?: string }[];
}

async function fetchHackerNews(product: string, limit: number): Promise<RawSignal[]> {
  const data = await getJson<HnSearch>(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(product)}&tags=comment&hitsPerPage=${limit}`,
  );
  return (data?.hits ?? [])
    .filter((h) => h.comment_text)
    .map((h) => ({
      source: "hackernews" as const,
      text: clean(h.comment_text!),
      url: `https://news.ycombinator.com/item?id=${h.objectID}`,
    }))
    .filter((s) => s.text.length > 40);
}

export interface Collected {
  signals: RawSignal[];
  counts: Record<SourceName, number>;
}

/** Pull public feedback about one product from every source in parallel. */
export async function collectSignals(product: string, perSource: number): Promise<Collected> {
  const [reddit, appstore, hackernews] = await Promise.all([
    fetchReddit(product, perSource),
    fetchAppStore(product, perSource),
    fetchHackerNews(product, perSource),
  ]);
  return {
    signals: [...reddit, ...appstore, ...hackernews],
    counts: { reddit: reddit.length, appstore: appstore.length, hackernews: hackernews.length },
  };
}
