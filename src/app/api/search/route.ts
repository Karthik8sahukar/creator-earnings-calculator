import { NextResponse } from "next/server";

import {
  applyRateLimit,
  safeErrorResponse,
  withRouteObservability,
} from "@/lib/apiHelpers";
import { searchQuerySchema } from "@/lib/schemas";
import { searchChannels } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/search?q=<query>
 *
 * Response envelope:
 *   Success: { success: true, results: ChannelSearchResult[] }
 *   Error  : { success: false, error: { code, message } }
 *
 * Live searches are never cached at the framework / CDN layer — the
 * in-process TTL cache is authoritative. `Cache-Control: no-store`
 * both on 2xx and on error responses (built by `safeErrorResponse`).
 */
export async function GET(request: Request) {
  return withRouteObservability("api.search", async () => {
    const limited = applyRateLimit(request);
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = searchQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUERY",
            message:
              parsed.error.issues[0]?.message ?? "Please enter a search query.",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    try {
      const results = await searchChannels(parsed.data.q);
      return NextResponse.json(
        { success: true, results },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (err) {
      return safeErrorResponse(err);
    }
  });
}
