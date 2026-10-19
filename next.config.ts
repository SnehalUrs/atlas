import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Saved reports are read from disk at request time; make sure they ship with the function.
  outputFileTracingIncludes: {
    "/api/report": ["./src/data/reports/**/*.json"],
  },
};

export default nextConfig;
