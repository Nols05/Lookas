import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.zara.net',

      },
    ],
    domains: ['ailab-result-rapidapi.oss-accelerate.aliyuncs.com'],
  },
};

export default nextConfig;
