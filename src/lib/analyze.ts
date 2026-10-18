import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import * as z from "zod/v4";
import { OLLAMA_MODEL, analyzeLocal } from "./local";
import type { CompetitorNote, Report, Signal, SourceName, Theme } from "./types";

const AnalysisSchema = z.object({
  summary: z.string().describe("2-3 sentence executive summary of what users are struggling with"),
  negative_signal_ids: z.array(z.number()).describe("ids of target-product signals that express a complaint, frustration or unmet need"),
  themes: z
    .array(
      z.object({
        name: z.string().describe("short friction theme name, e.g. 'Offline Sync Failures'"),
        segment: z.string().describe("user segment most affected, e.g. 'Mobile Users'"),
        description: z.string().describe("one or two sentences describing the friction"),
        signal_ids: z.array(z.number()).describe("ids of every target-product signal that belongs to this theme"),
        emotional_intensity: z.number().describe("0-100: strength of emotional language (frustration, anger, churn threats) across the theme's signals"),
        segment_impact: z.enum(["High", "Medium", "Low"]).describe("how much the affected segment matters to retention or revenue"),
        recommendation: z.string().describe("one concrete product action to address the theme"),
        quote_ids: z.array(z.number()).describe("2-3 signal ids whose text best represents the theme"),
      }),
    )
    .describe("3-6 friction themes for the target product, most severe first"),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        strengths: z.array(z.string()).describe("what users praise, 1-3 short bullets"),
        weaknesses: z.array(z.string()).describe("what users complain about, 1-3 short bullets"),
      }),
    )
    .describe("one entry per competitor that has signals; empty if none"),
});

export const SYSTEM = `You are a product intelligence analyst. You receive raw public user feedback (Reddit posts and comments, App Store reviews, Hacker News comments) about a target product and optionally its competitors. Each signal is tagged with an id, its source and which product it is about.

Cluster the target product's feedback into friction themes by meaning, not by keyword. A signal can belong to more than one theme. Ignore signals that are off-topic (a different product with the same name, spam, pure news). Base every score on the signals themselves; never invent feedback. Name themes the way a product manager would write them on a roadmap.`;

export function formatSignals(signals: Signal[], maxText: number): string {
  return signals
    .map((s) => {
      const rating = s.rating ? ` rating=${s.rating}/5` : "";
      return `<signal id="${s.id}" product="${s.product}" source="${s.source}"${rating}>${s.text.slice(0, maxText)}</signal>`;
    })
    .join("\n");
}

type Analysis = z.infer<typeof AnalysisSchema>;

/** Claude when an API key is configured, otherwise a free local model through Ollama. */
export function isLocalModel(): boolean {
  if (process.env.LLM_PROVIDER) return process.env.LLM_PROVIDER === "ollama";
  return !process.env.ANTHROPIC_API_KEY;
}

export function providerLabel(): string {
  return isLocalModel() ? `${OLLAMA_MODEL} (local)` : "Claude";
}

async function runClaude(prompt: string): Promise<Analysis> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: betaZodOutputFormat(AnalysisSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("The model declined to analyze this feedback.");
  if (!response.parsed_output) throw new Error("The model returned an unreadable analysis. Try again.");
  return response.parsed_output;
}

export async function analyze(product: string, competitors: string[], signals: Signal[]): Promise<Report> {
  if (isLocalModel()) return analyzeLocal(product, competitors, signals);
  const target = signals.filter((s) => s.product === product);
  const byId = new Map(signals.map((s) => [s.id, s]));
  const sourceCounts = { reddit: 0, appstore: 0, hackernews: 0 } as Record<SourceName, number>;
  for (const s of target) sourceCounts[s.source]++;

  const out = await runClaude(`Target product: ${product}\nCompetitors: ${competitors.join(", ") || "none"}\n\n${formatSignals(signals, 1500)}`);

  // Counts come from the ids the model assigned, so they always match the data we sent.
  const valid = (ids: number[]) => [...new Set(ids)].filter((id) => byId.get(id)?.product === product);
  const negatives = valid(out.negative_signal_ids);

  const themes: Theme[] = out.themes
    .map((t) => {
      const ids = valid(t.signal_ids);
      return {
        name: t.name,
        segment: t.segment,
        description: t.description,
        signalCount: ids.length,
        emotionalIntensity: Math.round(Math.min(100, Math.max(0, t.emotional_intensity))),
        recurrence: target.length ? Math.round((ids.length / target.length) * 100) : 0,
        segmentImpact: t.segment_impact,
        recommendation: t.recommendation,
        quotes: valid(t.quote_ids)
          .slice(0, 3)
          .map((id) => {
            const s = byId.get(id)!;
            return { text: s.text.slice(0, 280), source: s.source, url: s.url };
          }),
      };
    })
    .filter((t) => t.signalCount > 0)
    .sort((a, b) => b.emotionalIntensity * b.signalCount - a.emotionalIntensity * a.signalCount);

  const competitorNotes: CompetitorNote[] = out.competitors.map((c) => ({
    ...c,
    signalCount: signals.filter((s) => s.product.toLowerCase() === c.name.toLowerCase()).length,
  }));

  return {
    product,
    generatedAt: new Date().toISOString(),
    totalSignals: target.length,
    negativeRate: target.length ? Math.round((negatives.length / target.length) * 100) : 0,
    sourceCounts,
    summary: out.summary,
    themes,
    competitors: competitorNotes,
  };
}
