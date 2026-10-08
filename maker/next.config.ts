import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev badge would sit on top of the editor and the preview.
  devIndicators: false,
  // Same image hosts as the site's next.config.ts (keep them in sync), so covers and report images load in the preview.
  images: {
    remotePatterns: [
      // Uploaded images: S3 bucket behind CloudFront.
      { protocol: "https", hostname: "media.peppobot.com" },
      // Placeholders, until the seeded games get real images.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  turbopack: {
    // The repository root: the maker imports the site's components from ../src and uses its node_modules.
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
