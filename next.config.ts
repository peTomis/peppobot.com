import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Let phones on the LAN load dev assets (JS, HMR) so the page hydrates.
  allowedDevOrigins: ["192.168.1.13"],
  cacheComponents: true,
  // Placeholder report images until real screenshots are uploaded.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
