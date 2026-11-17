import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // Assets are already AVIF/WebP at the right dimensions; skipping the runtime
    // optimiser keeps the container free of a native image pipeline.
    unoptimized: true,
  },
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/**": ["./node_modules/better-sqlite3/build/Release/*.node"],
  },
};

export default nextConfig;
