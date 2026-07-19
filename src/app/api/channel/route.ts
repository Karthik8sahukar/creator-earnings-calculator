import { NextResponse } from "next/server";

import {
  applyRateLimit,
  safeErrorResponse,
  withRouteObservability,
} from "@/lib/apiHelpers";
import { channelIdSchema } from "@/lib/schemas";
import { getChannelById } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/channel?channelId=<UC...>
 *
 * Response envelope:
 *   Success (found)     : { success: true,  channel: ChannelDetails }
 *   Success (not found) : { success: false, error: { code: "NOT_FOUND", ... } } with HTTP 404
 *   Error               : { success: false, error: { code, message } }
 */
export async function GET(request: Request) {
  return withRouteObservability("api.channel", async () => {
    const limited = applyRateLimit(request);
    if (limited) return limited;

    const url = new URL(request.url);
    const parsed = channelIdSchema.safeParse({
      channelId: url.searchParams.get("channelId") ?? "",
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_QUERY",
            message:
              parsed.error.issues[0]?.message ?? "Invalid channel id.",
          },
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    try {
      const channel = await getChannelById(parsed.data.channelId);
      if (!channel) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_FOUND",
              message: "No matching YouTube channel was found.",
            },
          },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json(
        { success: true, channel },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch (err) {
      return safeErrorResponse(err);
    }
  });
}
