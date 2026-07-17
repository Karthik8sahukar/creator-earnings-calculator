import { NextResponse } from "next/server";

import { isYoutubeApiConfigured } from "@/lib/env.server";

/**
 * Health / readiness endpoint.
 *
 * Deliberate design constraints:
 *   - Never call the YouTube API. This must be free to hit as often as
 *     uptime monitors need to.
 *   - Never return the API key or any other environment variable value.
 *     Only expose whether the API key is *configured* (a boolean).
 *   - `status: "ok"` and HTTP 200 whenever the app server is running.
 *     `youtubeApiConfigured: false` is a readiness signal, not an
 *     error — the app still serves static pages fine without a key.
 *
 * The route is `force-dynamic` so the timestamp reflects the live
 * server and static site generation doesn't freeze it at build time.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HealthResponseBody {
  status: "ok";
  service: "youtube-money-calculator";
  timestamp: string;
  youtubeApiConfigured: boolean;
}

export async function GET() {
  const body: HealthResponseBody = {
    status: "ok",
    service: "youtube-money-calculator",
    timestamp: new Date().toISOString(),
    youtubeApiConfigured: isYoutubeApiConfigured(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      // Uptime pings shouldn't be cached by intermediaries.
      "Cache-Control": "no-store",
    },
  });
}

// Also allow HEAD probes (some load balancers / uptime services use HEAD).
export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
