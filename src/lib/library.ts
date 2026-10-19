import "server-only";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { LibraryReport } from "./types";

const dir = join(process.cwd(), "src/data/reports");

/** All pre-generated reports, alphabetical. */
export function getLibrary(): LibraryReport[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as LibraryReport)
    .sort((a, b) => a.product.localeCompare(b.product));
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Saved report matching a product name, ignoring case, spaces and punctuation. */
export function findReport(name: string): LibraryReport | null {
  const key = norm(name);
  return getLibrary().find((r) => norm(r.product) === key || norm(r.slug) === key) ?? null;
}

/**
 * Live analysis needs an LLM: Ollama on this machine, or Claude with an API key.
 * Hosted on Vercel without a key there is neither, so the site serves saved reports instead.
 * LIVE_ANALYSIS=on|off overrides the detection.
 */
export function liveAnalysisEnabled(): boolean {
  if (process.env.LIVE_ANALYSIS) return process.env.LIVE_ANALYSIS === "on";
  return !process.env.VERCEL || Boolean(process.env.ANTHROPIC_API_KEY);
}
