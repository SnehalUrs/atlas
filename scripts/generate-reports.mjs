// Generates the report library: runs every product in src/data/catalog.json through
// a running Atlas server's /api/analyze and saves each report to src/data/reports/<slug>.json.
// Resumable: products that already have a report are skipped.
//
//   node scripts/generate-reports.mjs [serverUrl]      (default http://localhost:3000)

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const server = process.argv[2] ?? "http://localhost:3000";
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
  if (existsSync(file)) {
    done++;
    continue;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const started = Date.now();
    try {
      const report = await analyze(name);
      writeFileSync(file, JSON.stringify({ slug, category, ...report }, null, 2));
      done++;
      const secs = Math.round((Date.now() - started) / 1000);
      console.log(`[${time()}] ✓ ${name} (${done}/${catalog.length}) ${report.totalSignals} signals, ${report.themes.length} themes, ${secs}s`);
      break;
    } catch (err) {
      console.log(`[${time()}] ✗ ${name} attempt ${attempt}: ${err.message}`);
      if (attempt === 3) console.log(`[${time()}]   skipping ${name}`);
    }
  }
}
console.log(`[${time()}] finished: ${done}/${catalog.length} reports`);
