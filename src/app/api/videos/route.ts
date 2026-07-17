import { NextResponse } from "next/server";

import { videosQuerySchema } from "@/lib/schemas";
import { YouTubeApiError, getRecentVideos } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
    if (err instanceof YouTubeApiError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message },
      { status: 500 },
    );
  }
}
