/**
 * API Route: GET /api/analytics/[slug]
 *
 * Returns historical analytics for a creator.
 *
 * Query params:
 *   - range: "7d" | "30d" | "90d" | "1y" | "all" (default: "all")
 *   - limit: number (max data points, for downsampling)
 *
 * Response: CreatorAnalytics JSON
 *
 * Caching:
 *   - 5 minute s-maxage (CDN/edge caching)
 *   - 1 minute stale-while-revalidate
 *   - Private data is never exposed — all analytics are derived from
 *     public YouTube statistics
 */

import { NextResponse } from "next/server";
import { getCreatorBySlug } from "@/lib/creators";
import { getCreatorAnalytics } from "@/lib/analytics/service";
import type { TimeRange } from "@/lib/analytics/types";

const VALID_RANGES = new Set<TimeRange>(["7d", "30d", "90d", "1y", "all"]);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  // Validate slug exists in our catalog
  const creator = getCreatorBySlug(slug);
  if (!creator) {
    return NextResponse.json(
      { error: "Creator not found" },
      { status: 404 },
    );
  }

  // Parse query params
  const url = new URL(request.url);
  const rangeParam = url.searchParams.get("range") ?? "all";
  const limitParam = url.searchParams.get("limit");

  // Validate range
  if (!VALID_RANGES.has(rangeParam as TimeRange)) {
    return NextResponse.json(
      { error: "Invalid range. Must be one of: 7d, 30d, 90d, 1y, all" },
      { status: 400 },
    );
  }

  // Validate limit
  let limit: number | undefined;
  if (limitParam) {
    limit = parseInt(limitParam, 10);
    if (!Number.isFinite(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: "Invalid limit. Must be 1-1000." },
        { status: 400 },
      );
    }
  }

  // Fetch analytics
  const analytics = await getCreatorAnalytics(slug, rangeParam as TimeRange);

  // Apply point limit if specified
  if (limit && analytics.snapshots.length > limit) {
    const step = Math.ceil(analytics.snapshots.length / limit);
    const downsampled = [];
    for (let i = 0; i < analytics.snapshots.length; i += step) {
      downsampled.push(analytics.snapshots[i]);
    }
    // Always include last point
    const last = analytics.snapshots[analytics.snapshots.length - 1];
    if (downsampled[downsampled.length - 1] !== last) {
      downsampled.push(last);
    }
    analytics.snapshots = downsampled;
  }

  return NextResponse.json(analytics, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
