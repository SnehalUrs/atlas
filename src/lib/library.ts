import "server-only";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { LibraryEntry, LibraryReport } from "./types";

const dir = join(process.cwd(), "src/data/reports");

/** All pre-generated reports, alphabetical. */
export function getLibrary(): LibraryReport[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as LibraryReport)
    .sort((a, b) => a.product.localeCompare(b.product));
}

export function getReport(slug: string): LibraryReport | null {
  const file = join(dir, `${slug}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, "utf8")) as LibraryReport) : null;
}

/** Lightweight index for client-side search. */
export function getLibraryIndex(): LibraryEntry[] {
  return getLibrary().map((r) => ({ slug: r.slug, product: r.product, category: r.category }));
}

/**
 * Live analysis needs an LLM: Ollama on this machine, or Claude with an API key.
 * Hosted on Vercel without a key there is neither, so the site serves the library only.
 * LIVE_ANALYSIS=on|off overrides the detection.
 */
export function liveAnalysisEnabled(): boolean {
  if (process.env.LIVE_ANALYSIS) return process.env.LIVE_ANALYSIS === "on";
  return !process.env.VERCEL || Boolean(process.env.ANTHROPIC_API_KEY);
}
