import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'amra-turistik.ru',
      },
      {
        protocol: 'https',
        hostname: 'bogema.ru',
      },
    ],
  },
};

export default nextConfig;
