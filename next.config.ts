import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://static.zara.net/**')],
  },
};

export default nextConfig;
