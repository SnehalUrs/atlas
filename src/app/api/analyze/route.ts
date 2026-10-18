import Anthropic from "@anthropic-ai/sdk";
import { analyze, providerLabel } from "@/lib/analyze";
import { collectSignals } from "@/lib/sources";
import type { Signal, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const PER_SOURCE = 100;
const PER_SOURCE_COMPETITOR = 30;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { product?: string; competitors?: string };
  const product = body.product?.trim();
  if (!product) return Response.json({ error: "Product name is required." }, { status: 400 });
  const competitors = (body.competitors ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 3);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        send({ type: "progress", message: `Collecting feedback about ${product}` });
        const main = await collectSignals(product, PER_SOURCE);
        send({
          type: "progress",
          message: `Found ${main.signals.length} signals: ${main.counts.reddit} Reddit, ${main.counts.appstore} App Store, ${main.counts.hackernews} Hacker News`,
        });
        if (main.signals.length === 0) {
          send({ type: "error", message: `No public feedback found for "${product}". Check the spelling or try the app's full name.` });
          return;
        }

        const comp = await Promise.all(
          competitors.map(async (name) => {
            send({ type: "progress", message: `Collecting feedback about ${name}` });
            return { name, ...(await collectSignals(name, PER_SOURCE_COMPETITOR)) };
          }),
        );

        let nextId = 1;
        const signals: Signal[] = [
          ...main.signals.map((s) => ({ ...s, id: nextId++, product })),
          ...comp.flatMap((c) => c.signals.map((s) => ({ ...s, id: nextId++, product: c.name }))),
        ];

        send({ type: "progress", message: `Clustering ${signals.length} signals into themes with ${providerLabel()}` });
        const report = await analyze(product, competitors, signals);
        send({ type: "report", report });
      } catch (err) {
        let message = "Analysis failed. Try again.";
        if (err instanceof Anthropic.AuthenticationError || (err instanceof Error && err.message.includes("authentication method"))) message = "Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY in .env.local.";
        else if (err instanceof Anthropic.RateLimitError) message = "Rate limited by the Anthropic API. Wait a minute and retry.";
        else if (err instanceof Anthropic.APIError) message = `Anthropic API error: ${err.message}`;
        else if (err instanceof Error) message = err.message;
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
