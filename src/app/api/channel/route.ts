import { NextResponse } from "next/server";

import { channelIdSchema } from "@/lib/schemas";
import { YouTubeApiError, getChannelById } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = channelIdSchema.safeParse({
    channelId: url.searchParams.get("channelId") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  try {
    const channel = await getChannelById(parsed.data.channelId);
    if (!channel) {
      return NextResponse.json(
        { error: "NOT_FOUND", message: "Channel not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ channel });
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
