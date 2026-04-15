import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${supabaseUrl} https://asia.pokemon-card.com https://lh3.googleusercontent.com`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseUrl} https://accounts.google.com`,
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "asia.pokemon-card.com",
      },
    ],
    minimumCacheTTL: 86400,
    formats: ['image/webp'],
    deviceSizes: [640, 828, 1080, 1200],
    imageSizes: [256, 384, 512],
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)\\.(svg|ico|png|jpg|jpeg|webp|avif|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Content-Security-Policy", value: cspDirectives.join('; ') },
        ],
      },
    ];
  },
};

export default nextConfig;
