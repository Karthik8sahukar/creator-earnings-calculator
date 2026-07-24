import createNextIntlPlugin from "next-intl/plugin";

/** @type {import('next').NextConfig} */

/**
 * Security headers applied to every response.
 *
 * We deliberately DO NOT set Strict-Transport-Security here — Vercel
 * (and most hosts) add it at the edge. Setting it twice can cause
 * subtle differences between local and production behavior.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    // Only YouTube-hosted image domains are allowed. Any request that
    // isn't on this list will fail the built-in <Image> optimizer.
    remotePatterns: [
      { protocol: "https", hostname: "yt3.ggpht.com" },
      { protocol: "https", hostname: "yt3.googleusercontent.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i9.ytimg.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    // Reasonable device breakpoints keep the srcset small.
    deviceSizes: [640, 828, 1080, 1200, 1920],
  },

  async headers() {
    return [
      // Baseline security headers for every route.
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // API routes get security headers. Cache-Control is managed by
      // each route handler individually (analytics uses s-maxage,
      // search uses private max-age, health uses no-store, and
      // force-dynamic routes get no-cache from Next.js automatically).
      {
        source: "/api/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Wrap the config with the next-intl plugin so per-request messages
// are loaded through src/i18n/request.ts. This must come last so any
// future wrappers (Sentry, etc.) can layer on top.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
