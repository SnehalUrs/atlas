import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The monthly refresh builds into its own folder so it never disturbs a running dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Saved reports are read from disk at request time; make sure they ship with the function.
  outputFileTracingIncludes: {
    "/api/report": ["./src/data/reports/**/*.json"],
  },
};

export default nextConfig;
