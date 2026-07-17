import { NextResponse } from "next/server";

import { applyRateLimit, safeErrorResponse } from "@/lib/apiHelpers";
import { searchQuerySchema } from "@/lib/schemas";
import { searchChannels } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
    return safeErrorResponse(err);
  }
}
