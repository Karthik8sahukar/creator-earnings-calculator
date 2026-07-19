import { NextResponse } from "next/server";

import {
  applyRateLimit,
  safeErrorResponse,
  withRouteObservability,
} from "@/lib/apiHelpers";
import { videosQuerySchema } from "@/lib/schemas";
import { getRecentVideos } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/videos?playlistId=<UU...>&limit=<n>
 *
 * Response envelope:
 *   Success: { success: true, videos: VideoItem[] }
 *   Error  : { success: false, error: { code, message } }
 */
export async function GET(request: Request) {
  return withRouteObservability("api.videos", async () => {
    const limited = applyRateLimit(request);
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = videosQuerySchema.safeParse({
      playlistId: url.searchParams.get("playlistId") ?? "",
      limit: url.searchParams.get("limit") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUERY",
            message:
              parsed.error.issues[0]?.message ?? "Invalid playlist id.",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    try {
      const videos = await getRecentVideos(
        parsed.data.playlistId,
        parsed.data.limit,
      );
      return NextResponse.json(
        { success: true, videos },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (err) {
      return safeErrorResponse(err);
    }
  });
}
