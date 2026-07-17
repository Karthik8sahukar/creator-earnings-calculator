import { NextResponse } from "next/server";
import { z } from "zod";

import { searchQuerySchema } from "@/lib/schemas";
import { YouTubeApiError, searchChannels } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
    const results = await searchChannels(parsed.data.q);
    return NextResponse.json(
      { results },
      {
        headers: {
          "Cache-Control": "private, max-age=60, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    return handleApiError(err);
  }
}

function handleApiError(err: unknown) {
  if (err instanceof YouTubeApiError) {
    return NextResponse.json(
      { error: err.code, message: err.message },
      { status: err.status },
    );
  }
  if (err instanceof z.ZodError) {
    return NextResponse.json(
      { error: "INVALID_QUERY", message: err.issues[0]?.message },
      { status: 400 },
    );
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return NextResponse.json(
    { error: "INTERNAL_ERROR", message },
    { status: 500 },
  );
}
