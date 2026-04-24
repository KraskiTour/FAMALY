import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hosts that appear in real tour gallery data (data/mock-tours.ts).
    // Most places render plain <img> (so patterns don't block them), but
    // next/image is used inside tour-itinerary day photos — those DO need
    // the host whitelisted to avoid "hostname not configured" errors.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'amra-turistik.ru' },
      { protocol: 'http',  hostname: 'amra-turistik.ru' },
      { protocol: 'https', hostname: 'bogema.ru' },
      { protocol: 'https', hostname: 'imcdn.bolshayastrana.com' },
      { protocol: 'https', hostname: 'rt.plus' },
      { protocol: 'https', hostname: 'storage.yandexcloud.net' },
    ],
  },
};

export default nextConfig;
