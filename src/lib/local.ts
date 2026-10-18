import * as z from "zod/v4";
import type { CompetitorNote, Report, Signal, SourceName, Theme } from "./types";

/*
 * Free, on-device analysis. A small local model is too slow to label every signal by id,
 * so it only names and scores the themes from a sample (a short answer), and an embedding
 * model assigns every signal to its closest theme.
 */

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen3:8b";
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

const SAMPLE_TARGET = 60;
const SAMPLE_COMPETITOR = 10;
const MIN_SIMILARITY = 0.5;

const ThemesSchema = z.object({
  summary: z.string().describe("2-3 sentence executive summary in plain prose (no lists or numbering) of what users are struggling with"),
  themes: z
    .array(
      z.object({
        name: z.string().describe("short friction theme name, e.g. 'Offline Sync Failures'"),
        segment: z.string().describe("user segment most affected, e.g. 'Mobile Users'"),
        description: z.string().describe("one or two sentences describing the friction, using the words users use"),
        emotional_intensity: z.number().describe("integer from 0 to 100 (not 0-10): strength of emotional language (frustration, anger, churn threats) in this theme's feedback"),
        segment_impact: z.enum(["High", "Medium", "Low"]),
        recommendation: z.string().describe("one concrete product action to address the theme"),
      }),
    )
    .describe("3-6 friction themes for the target product, most severe first"),
  competitors: z.array(
    z.object({
      name: z.string(),
      strengths: z.array(z.string()).describe("1-3 short bullets"),
      weaknesses: z.array(z.string()).describe("1-3 short bullets"),
    }),
  ),
});
type Themes = z.infer<typeof ThemesSchema>;

const SYSTEM = `You are a product intelligence analyst. You receive a sample of public user feedback (Reddit, App Store reviews, Hacker News) about a target product and optionally its competitors.

Identify the target product's main friction themes by meaning, not keyword. Ignore off-topic feedback. Never invent feedback. Name themes the way a product manager would write them on a roadmap. For each competitor, list what its users praise and complain about. Keep every field short.`;

const NEGATIVE_ANCHORS = [
  "This is broken and frustrating, it keeps crashing and losing my data",
  "I hate this update, it's worse now and I'm cancelling my subscription",
  "Terrible experience, waste of money, the app doesn't work",
  "Annoying problem that makes the product hard to use",
];
const POSITIVE_ANCHORS = [
  "I love this app, it works great and helps me every day",
  "Excellent product, highly recommend it",
  "Really happy with it, the new feature is fantastic",
];

/** Round-robin across sources so no single source dominates a sample. */
function sample(list: Signal[], n: number): Signal[] {
  const bySource = (["reddit", "appstore", "hackernews"] as const).map((src) => list.filter((s) => s.source === src));
  const out: Signal[] = [];
  for (let i = 0; out.length < n && bySource.some((b) => i < b.length); i++) {
    for (const b of bySource) if (i < b.length && out.length < n) out.push(b[i]);
  }
  return out;
}

async function ollama(path: string, body: unknown): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${OLLAMA_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause?.code;
    if (cause === "UND_ERR_HEADERS_TIMEOUT") throw new Error("Ollama is busy with another request. Wait a minute and try again.");
    throw new Error(`Can't reach Ollama at ${OLLAMA_URL}. Start it with "brew services start ollama".`);
  }
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    const model = (body as { model: string }).model;
    if (detail.includes("not found")) throw new Error(`Model ${model} isn't downloaded. Run "ollama pull ${model}".`);
    throw new Error(`Ollama error ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res;
}

async function generateThemes(prompt: string): Promise<Themes> {
  const res = await ollama("/api/chat", {
    model: OLLAMA_MODEL,
    stream: true,
    think: false,
    format: z.toJSONSchema(ThemesSchema),
    options: { num_ctx: 12288, temperature: 0.2, num_predict: 2000 },
    messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: prompt },
    ],
  });

  // Streamed so a slow local generation never sits on an idle connection.
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.trim()) content += (JSON.parse(line) as { message?: { content?: string } }).message?.content ?? "";
    }
  }

  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    throw new Error("The local model returned malformed JSON. Try again.");
  }
  const parsed = ThemesSchema.safeParse(json);
  if (!parsed.success) throw new Error("The local model's analysis didn't match the expected shape. Try again.");
  return parsed.data;
}

async function embed(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += 64) {
    const res = await ollama("/api/embed", { model: EMBED_MODEL, input: texts.slice(i, i + 64).map((t) => `clustering: ${t.slice(0, 1200)}`) });
    out.push(...((await res.json()) as { embeddings: number[][] }).embeddings);
  }
  return out;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na * nb) || 1);
}

const maxSim = (v: number[], anchors: number[][]) => Math.max(...anchors.map((a) => cosine(v, a)));

export async function analyzeLocal(product: string, competitors: string[], signals: Signal[]): Promise<Report> {
  const target = signals.filter((s) => s.product === product);
  const promptSignals = [
    ...sample(target, SAMPLE_TARGET),
    ...competitors.flatMap((c) => sample(signals.filter((s) => s.product === c), SAMPLE_COMPETITOR)),
  ];
  const prompt = `Target product: ${product}\nCompetitors: ${competitors.join(", ") || "none"}\n\n${promptSignals
    .map((s) => `[${s.product} · ${s.source}${s.rating ? ` · ${s.rating}/5` : ""}] ${s.text.slice(0, 350)}`)
    .join("\n")}`;

  const out = await generateThemes(prompt);
  if (out.themes.length === 0) throw new Error("The local model found no themes. Try again or add more context.");

  const [signalVecs, themeVecs, negVecs, posVecs] = await Promise.all([
    embed(target.map((s) => s.text)),
    embed(out.themes.map((t) => `${t.name}. ${t.description}`)),
    embed(NEGATIVE_ANCHORS),
    embed(POSITIVE_ANCHORS),
  ]);

  // Sentiment: star ratings win where present; otherwise the closer anchor set decides.
  const negative = target.map((s, i) => {
    if (s.rating) return s.rating <= 3;
    return maxSim(signalVecs[i], negVecs) > maxSim(signalVecs[i], posVecs);
  });

  // Each signal joins its closest theme if it's similar enough; the rest stay unassigned.
  const members: { idx: number; sim: number }[][] = out.themes.map(() => []);
  signalVecs.forEach((v, idx) => {
    const sims = themeVecs.map((t) => cosine(v, t));
    const best = sims.indexOf(Math.max(...sims));
    if (sims[best] >= MIN_SIMILARITY) members[best].push({ idx, sim: sims[best] });
  });

  // Small models sometimes score on a 0-10 scale despite the instruction; rescale if so.
  const scale = out.themes.every((t) => t.emotional_intensity <= 10) ? 10 : 1;

  const themes: Theme[] = out.themes
    .map((t, ti) => {
      const m = members[ti];
      const quotes = [...m]
        .sort((a, b) => Number(negative[b.idx]) - Number(negative[a.idx]) || b.sim - a.sim)
        .slice(0, 3)
        .map(({ idx }) => ({ text: target[idx].text.slice(0, 280), source: target[idx].source, url: target[idx].url }));
      return {
        name: t.name,
        segment: t.segment,
        description: t.description,
        signalCount: m.length,
        emotionalIntensity: Math.round(Math.min(100, Math.max(0, t.emotional_intensity * scale))),
        recurrence: target.length ? Math.round((m.length / target.length) * 100) : 0,
        segmentImpact: t.segment_impact,
        recommendation: t.recommendation,
        quotes,
      };
    })
    .filter((t) => t.signalCount > 0)
    .sort((a, b) => b.emotionalIntensity * b.signalCount - a.emotionalIntensity * a.signalCount);

  const sourceCounts = { reddit: 0, appstore: 0, hackernews: 0 } as Record<SourceName, number>;
  for (const s of target) sourceCounts[s.source]++;

  const competitorNotes: CompetitorNote[] = out.competitors
    .filter((c) => competitors.some((name) => name.toLowerCase() === c.name.toLowerCase()))
    .map((c) => ({ ...c, signalCount: signals.filter((s) => s.product.toLowerCase() === c.name.toLowerCase()).length }));

  return {
    product,
    generatedAt: new Date().toISOString(),
    totalSignals: target.length,
    negativeRate: target.length ? Math.round((negative.filter(Boolean).length / target.length) * 100) : 0,
    sourceCounts,
    summary: out.summary,
    themes,
    competitors: competitorNotes,
  };
}
