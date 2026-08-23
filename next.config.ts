import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone for a minimal production Docker image.
  output: "standalone",
};

export default nextConfig;
