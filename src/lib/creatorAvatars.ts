import "server-only";

import type { Creator } from "./creators";
import { YouTubeApiError } from "./errors";
import { getChannelById } from "./youtube";

/**
 * Server-only helper: resolve creator records to their YouTube
 * profile-picture URLs, reusing the existing YouTube cache layer.
 *
 * Why a dedicated helper instead of `getCreatorProfile`?
 *
 *   The profile page's `getCreatorProfile()` also fetches recent
 *   videos and runs performance analysis — expensive work we don't
 *   need to render 200 avatars on `/creators`. This helper takes the
 *   cheapest path that still gives us a thumbnail:
 *
 *     * `channelId` present  → `getChannelById()` (1 quota unit,
 *       cached 24h). Returns the full `ChannelDetails` — we take
 *       only `.thumbnail`.
 *
 *     * `channelId` empty    → returns `null` immediately. No API
 *       call is made for unverified creators. The UI renders an
 *       initial-based placeholder.
 *
 *   NEVER uses search.list or getChannelByHandle for avatar resolution.
 *
 * Design rules:
 *
 *   1. **Never throws.** A single creator's failure must not
 *      prevent the other avatars from resolving. Errors are
 *      logged with just the slug + error code (never the raw
 *      YouTube error message, which may carry internal details).
 *
 *   2. **Never fabricates a URL.** If the API can't be reached, we
 *      return `null` and the UI renders its initial-based fallback.
 *
 *   3. **Batch is parallel via `Promise.allSettled`** — one slow
 *      lookup can't extend total wall-clock past the youtube
 *      timeout budget.
 */

/**
 * Resolve a single creator to an avatar URL. Returns `null` when
 * unavailable — never throws.
 *
 * For unverified creators (empty channelId), returns null immediately
 * without making any YouTube API call.
 */
async function resolveCreatorAvatar(creator: Creator): Promise<string | null> {
  try {
    if (creator.channelId) {
      const details = await getChannelById(creator.channelId);
      return details?.thumbnail?.trim() ? details.thumbnail : null;
    }

    // Unverified creator — do NOT call the YouTube API.
    // Return null so the UI renders its initial-based placeholder.
    return null;
  } catch (err) {
    const code = err instanceof YouTubeApiError
      ? err.code
      : err instanceof TypeError
        ? "MALFORMED_RESPONSE"
        : "UNEXPECTED";
    console.error("creator-avatar:resolve failed", {
      slug: creator.slug,
      code,
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
