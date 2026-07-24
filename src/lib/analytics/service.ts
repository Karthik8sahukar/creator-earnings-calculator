/**
 * Analytics Service — Server-side API for creator history.
 *
 * This is the public interface that server components and API routes
 * use to retrieve historical analytics. It composes the storage
 * adapter with the growth calculation functions.
 */

import "server-only";

import type { CreatorAnalytics, TimeRange } from "./types";
import { getAnalyticsStorage } from "./storage";
import { calculateAllGrowth } from "./growth";

/**
 * Get complete analytics for a creator.
 *
 * Returns snapshots for the requested range plus pre-computed growth
 * metrics for all standard periods (7d, 30d, 90d, 1y).
 *
 * Never throws — returns empty analytics when no data exists.
 */
export async function getCreatorAnalytics(
  creatorSlug: string,
  range: TimeRange = "all",
): Promise<CreatorAnalytics> {
  const storage = getAnalyticsStorage();

  // Fetch all snapshots (we need the full history for growth calcs)
  const allSnapshots = await storage.getSnapshots({
    creatorSlug,
    range: "all",
  });

  // Fetch the range-specific snapshots for the chart
  const rangeSnapshots =
    range === "all"
      ? allSnapshots
      : await storage.getSnapshots({ creatorSlug, range });

  // Calculate growth for all standard periods
  const growth = calculateAllGrowth(allSnapshots);

  // Last updated
  const latest = allSnapshots.length > 0 ? allSnapshots[allSnapshots.length - 1] : null;

  return {
    creatorSlug,
    snapshots: rangeSnapshots,
    growth,
    lastUpdated: latest?.capturedAt ?? null,
  };
}
