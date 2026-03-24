import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN ?? '';
const sentryOrigin = sentryDsn ? new URL(sentryDsn).origin : '';

const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: ${supabaseUrl} https://asia.pokemon-card.com https://lh3.googleusercontent.com`,
  `font-src 'self'`,
  `connect-src 'self' ${supabaseUrl} ${sentryOrigin} https://accounts.google.com`,
  "frame-src https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
];

const nextConfig: NextConfig = {
  async headers() {
    return [
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

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "kartu-pokemon-indonesia",
  project: "kartu-pokemon-indonesia",
  widenClientFileUpload: true,
});
