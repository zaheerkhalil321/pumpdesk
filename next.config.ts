import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Pages visited in the last 2 minutes show at once on return, with no loader.
    // A save revalidates its pages, which clears this cache, so new data is never hidden.
    staleTimes: { dynamic: 120 },
  },
};

export default nextConfig;
