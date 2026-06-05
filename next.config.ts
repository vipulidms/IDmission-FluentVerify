import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["recharts"],
  serverExternalPackages: ["next-auth"],
  experimental: {},
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
