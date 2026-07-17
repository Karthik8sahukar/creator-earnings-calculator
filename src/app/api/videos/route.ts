import { NextResponse } from "next/server";

import { applyRateLimit, safeErrorResponse } from "@/lib/apiHelpers";
import { videosQuerySchema } from "@/lib/schemas";
import { getRecentVideos } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = applyRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const parsed = videosQuerySchema.safeParse({
    playlistId: url.searchParams.get("playlistId") ?? "",
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  try {
    const videos = await getRecentVideos(
      parsed.data.playlistId,
      parsed.data.limit,
    );
    return NextResponse.json({ videos });
  } catch (err) {
    return safeErrorResponse(err);
  }
}
