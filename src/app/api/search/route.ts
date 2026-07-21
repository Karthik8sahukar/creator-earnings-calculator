import { NextResponse } from "next/server";

import {
  applyRateLimit,
  safeErrorResponse,
  withRouteObservability,
} from "@/lib/apiHelpers";
import { searchQuerySchema } from "@/lib/schemas";
import { YouTubeApiError, resolveChannelFromInput } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
        { error: "INVALID_QUERY", message: parsed.error.issues[0]?.message },
        { status: 400 },
      );
    }

    try {
      const results = await resolveChannelFromInput(parsed.data.q);
      return NextResponse.json(
        { results },
        {
          headers: {
            "Cache-Control": "private, max-age=60, stale-while-revalidate=60",
          },
        },
      );
    } catch (err) {
      // Return UNSUPPORTED_INPUT as a 400 with a friendly message
      if (
        err instanceof YouTubeApiError &&
        err.code === "UNSUPPORTED_INPUT"
      ) {
        return NextResponse.json(
          { error: "UNSUPPORTED_INPUT", message: err.message },
          { status: 400 },
        );
      }
      return safeErrorResponse(err);
    }
  });
}
