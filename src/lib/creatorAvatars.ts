import "server-only";

import type { Creator } from "./creators";
import { YouTubeApiError } from "./errors";
import { getChannelById, getChannelByHandle } from "./youtube";

/**
 * Server-only helper: resolve creator records to their YouTube
 * profile-picture URLs using ONLY the cheap 1-quota-unit endpoints.
 *
 * Why this file exists:
 *
 *   Rendering the 20-creator homepage strip used to call
 *   `searchChannels("@handle")` once per creator whose `channelId`
 *   was unknown — that endpoint costs **100 quota units** per call.
 *   Twenty creators × 100 = 2 000 units per cold cache render, which
 *   alone could burn 20 % of the free-tier daily quota (10 000 units).
 *
 *   This helper takes the cheapest path in every branch:
 *
 *     * `channelId` present  → `getChannelById()` (1 unit,
 *       cached 24 h). Returns full `ChannelDetails`; we take only
 *       `.thumbnail`.
 *
 *     * `channelId` empty    → `getChannelByHandle()` which uses
 *       `channels.list?forHandle=@…` (1 unit, cached 24 h). This
 *       replaces the previous `search.list` path (100 units) with a
 *       function that costs 1 unit — a 99 % reduction.
 *
 *   Result: rendering the homepage strip on a fully cold cache now
 *   costs at most 20 quota units instead of 2 000. Steady-state with
 *   warm caches: 0 units.
 *
 * Design rules (unchanged):
 *
 *   1. **Never throws.** A single creator's failure must not prevent
 *      the other 19 avatars from resolving. Errors are logged with
 *      just the slug + error code (never the raw YouTube error
 *      message, which may carry internal details).
 *
 *   2. **Never fabricates a URL.** If the API can't be reached, we
 *      return `null` and the UI renders its initial-based fallback.
 *
 *   3. **Batch is parallel via `Promise.allSettled`** — one slow
 *      lookup can't extend total wall-clock past the YouTube timeout
 *      budget.
 */

/**
 * Resolve a single creator to an avatar URL. Returns `null` when
 * unavailable — never throws.
 */
async function resolveCreatorAvatar(creator: Creator): Promise<string | null> {
  try {
    // Prefer a known channelId — cheapest and most stable.
    if (creator.channelId) {
      const details = await getChannelById(creator.channelId);
      return details?.thumbnail?.trim() ? details.thumbnail : null;
    }

    // No channelId on the record — resolve via the handle. This path
    // now uses `channels.list?forHandle=` (1 unit), NOT `search.list`
    // (100 units). See getChannelByHandle() in `youtube.ts`.
    const handle = creator.youtubeHandle.replace(/^@/, "");
    if (!handle) return null;

    const details = await getChannelByHandle(handle);
    return details?.thumbnail?.trim() ? details.thumbnail : null;
  } catch (err) {
    console.error("creator-avatar:resolve failed", {
      slug: creator.slug,
      code: err instanceof YouTubeApiError ? err.code : "UNEXPECTED",
    });
    return null;
  }
}

/**
 * Resolve avatars for a batch of creators. Returns a plain object
 * map (serializable across the RSC → client-component boundary)
 * keyed by `slug`. Missing / failed slugs map to `null`.
 *
 * The returned map is guaranteed to contain an entry for every
 * requested slug — callers can safely index by slug without
 * checking for undefined.
 */
export async function getCreatorAvatars(
  creators: readonly Creator[],
): Promise<Record<string, string | null>> {
  // Seed with nulls so every requested slug has a definitive answer
  // even if `Promise.allSettled` reports a fulfilled-but-null value.
  const out: Record<string, string | null> = {};
  for (const c of creators) out[c.slug] = null;

  if (creators.length === 0) return out;

  const settled = await Promise.allSettled(
    creators.map(async (c) => {
      const url = await resolveCreatorAvatar(c);
      return { slug: c.slug, url };
    }),
  );

  for (const r of settled) {
    if (r.status === "fulfilled") {
      out[r.value.slug] = r.value.url;
    }
    // Rejected promises stay `null` — resolveCreatorAvatar is a
    // never-throw function, so this branch is defensive only.
  }

  return out;
}

// Exported for testing.
export { resolveCreatorAvatar as _resolveCreatorAvatarForTests };
