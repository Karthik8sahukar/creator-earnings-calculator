import "server-only";

import { channelCache } from "./cache";
import type { Creator } from "./creators";
import { getChannelByHandle } from "./youtube";
import type { ChannelDetails } from "@/types/youtube";

/**
 * Background channel resolution for unverified creators.
 *
 * When a visitor opens an unverified creator page, this system
 * attempts ONE handle-based lookup (1 quota unit). If a high-confidence
 * match is found, the result is cached for future visits.
 *
 * Design constraints:
 *   - Never exceeds 1 API call per creator per cache TTL period
 *   - Never blocks page rendering (fire-and-forget)
 *   - Never modifies the static dataset at runtime
 *   - Reuses the existing TtlCache infrastructure
 *   - Throttled: max 5 background lookups per minute
 */

// ─── Throttle ───────────────────────────────────────────────────────

const THROTTLE_WINDOW_MS = 60_000; // 1 minute
const MAX_LOOKUPS_PER_WINDOW = 5;

let windowStart = Date.now();
let lookupsInWindow = 0;

function canPerformLookup(): boolean {
  const now = Date.now();
  if (now - windowStart > THROTTLE_WINDOW_MS) {
    windowStart = now;
    lookupsInWindow = 0;
  }
  return lookupsInWindow < MAX_LOOKUPS_PER_WINDOW;
}

function recordLookup(): void {
  lookupsInWindow++;
}

// ─── Negative cache (avoid repeated failed lookups) ─────────────────

const failedLookups = new Set<string>();
const FAILED_CACHE_MAX = 500;

function markFailed(slug: string): void {
  if (failedLookups.size >= FAILED_CACHE_MAX) {
    // Evict oldest entries (approximate — Set doesn't have order)
    const first = failedLookups.values().next().value;
    if (first) failedLookups.delete(first);
  }
  failedLookups.add(slug);
}

function wasAlreadyFailed(slug: string): boolean {
  return failedLookups.has(slug);
}

// ─── Success cache (keyed by slug → channelId) ─────────────────────

const resolvedChannels = new Map<string, string>();

/**
 * Check if a background resolution has already found this creator's
 * channel in a previous visit during this server lifecycle.
 */
export function getBackgroundResolvedChannelId(
  slug: string,
): string | undefined {
  return resolvedChannels.get(slug);
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Attempt a background channel lookup for an unverified creator.
 *
 * This function is fire-and-forget — it does NOT block page rendering.
 * Call it AFTER the page has started streaming to the client.
 *
 * Returns the resolved ChannelDetails if immediately available from
 * a prior background resolution (cache hit). Otherwise returns null
 * and kicks off the lookup asynchronously.
 */
export function attemptBackgroundResolution(
  creator: Creator,
): ChannelDetails | null {
  // Already verified — no background work needed
  if (creator.channelId) return null;

  // Already resolved in a previous background lookup
  const cachedId = resolvedChannels.get(creator.slug);
  if (cachedId) {
    // The channel data is likely in the TtlCache from the previous lookup
    // Return null here — the caller should use getChannelById(cachedId)
    return null;
  }

  // Already tried and failed
  if (wasAlreadyFailed(creator.slug)) return null;

  // Throttle check
  if (!canPerformLookup()) return null;

  // Fire and forget — do NOT await
  recordLookup();
  performLookup(creator).catch(() => {
    // Silently swallow — background enrichment must never crash
  });

  return null;
}

/**
 * Internal: perform the actual YouTube API lookup.
 * This runs asynchronously after the page has rendered.
 */
async function performLookup(creator: Creator): Promise<void> {
  try {
    const handle = creator.youtubeHandle.replace(/^@/, "");
    if (!handle) {
      markFailed(creator.slug);
      return;
    }

    const channel = await getChannelByHandle(handle);

    if (!channel) {
      markFailed(creator.slug);
      return;
    }

    // Validate: does the resolved channel plausibly match?
    const titleMatch = isPlausibleMatch(creator.displayName, channel.title);
    const handleMatch = isPlausibleMatch(
      creator.youtubeHandle.replace(/^@/, ""),
      (channel.handle ?? "").replace(/^@/, ""),
    );

    if (titleMatch || handleMatch) {
      // High confidence — cache the resolved channel ID
      resolvedChannels.set(creator.slug, channel.channelId);
    } else {
      // Low confidence — don't cache, mark as failed to avoid re-trying
      markFailed(creator.slug);
    }
  } catch {
    markFailed(creator.slug);
  }
}

/**
 * Simple plausibility check: normalized strings are similar enough.
 */
function isPlausibleMatch(expected: string, actual: string): boolean {
  const ne = expected.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = actual.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!ne || !na) return false;
  if (ne === na) return true;
  if (ne.includes(na) || na.includes(ne)) return true;
  // Simple character overlap ratio
  const overlap = [...ne].filter((c) => na.includes(c)).length;
  return overlap / Math.max(ne.length, na.length) > 0.7;
}
