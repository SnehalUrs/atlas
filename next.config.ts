import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root; another lockfile higher up the disk otherwise confuses file tracing.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // The monthly refresh builds into its own folder so it never disturbs a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Saved reports are read from disk at request time; make sure they ship with the function.
  outputFileTracingIncludes: {
    "/api/report": ["./src/data/reports/**/*.json"],
  },
};

export default nextConfig;
