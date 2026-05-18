import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow images from common CDNs and our own backend storage
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "**.railway.app" },       // Railway backend
      { protocol: "https", hostname: "**.supabase.co" },       // Supabase storage if used
      { protocol: "https", hostname: "**.cloudinary.com" },    // Cloudinary CDN if used
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
    ],
    // Force modern image formats for performance
    formats: ["image/avif", "image/webp"],
    // Reasonable quality for fashion photography
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Strict mode for catching React issues early
  reactStrictMode: true,

  // Production-safe HTTP security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
