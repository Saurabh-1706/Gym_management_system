import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // optimizeCss: true, // Disabled to avoid critters dependency issue
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
