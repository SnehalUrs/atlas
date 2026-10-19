// Generates the report library: runs every product in src/data/catalog.json through
// a running Atlas server's /api/analyze and saves each report to src/data/reports/<slug>.json.
// Resumable: products that already have a report are skipped, unless --refresh is given,
// in which case every report is regenerated and replaced only when the new run succeeds.
//
//   node scripts/generate-reports.mjs [serverUrl] [--refresh]      (default http://localhost:3000)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const args = process.argv.slice(2);
const refresh = args.includes("--refresh");
const server = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const catalog = JSON.parse(readFileSync(join(root, "src/data/catalog.json"), "utf8"));
const outDir = join(root, "src/data/reports");

export const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function analyze(product) {
  const res = await fetch(`${server}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });
  const lines = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
  const last = lines.at(-1);
  if (last?.type !== "report") throw new Error(last?.message ?? "no report returned");
  return last.report;
}

const time = () => new Date().toLocaleTimeString("en-GB");
let done = 0;
for (const { name, category } of catalog) {
  const slug = slugify(name);
  const file = join(outDir, `${slug}.json`);
  if (existsSync(file) && !refresh) {
    done++;
    continue;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now();
    try {
      const report = await analyze(name);
      // On refresh, don't let a degraded run (e.g. a source rate-limited) replace a fuller report.
      if (refresh && existsSync(file)) {
        const old = JSON.parse(readFileSync(file, "utf8"));
        if (report.totalSignals < old.totalSignals * 0.6 || report.themes.length < 3) {
          throw new Error(`weaker than the saved report (${report.totalSignals} vs ${old.totalSignals} signals)`);
        }
      }
      writeFileSync(file, JSON.stringify({ slug, category, ...report }, null, 2));
      done++;
      const secs = Math.round((Date.now() - started) / 1000);
      console.log(`[${time()}] ✓ ${name} (${done}/${catalog.length}) ${report.totalSignals} signals, ${report.themes.length} themes, ${secs}s`);
      break;
    } catch (err) {
      console.log(`[${time()}] ✗ ${name} attempt ${attempt}: ${err.message}`);
      if (attempt === 3) console.log(`[${time()}]   skipping ${name}${existsSync(file) ? " (kept the previous report)" : ""}`);
    }
  }
}
console.log(`[${time()}] finished: ${done}/${catalog.length} reports`);
