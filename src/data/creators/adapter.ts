/**
 * Adapter: converts CreatorEntry (data platform) → Creator (service layer).
 *
 * NOTE: The primary conversion now lives in `src/lib/creators.ts` which
 * imports the dataset directly. This adapter remains available for any
 * code that needs to convert individual entries without going through
 * the service layer.
 *
 * Uses `import type` to avoid circular runtime dependencies.
 */

import type { Creator } from "@/lib/creators";
import type { CreatorEntry } from "./schema";
import { getRelatedCreators } from "./related";

/**
 * Convert a CreatorEntry to the legacy Creator interface.
 */
export function toCreator(entry: CreatorEntry): Creator {
  const related = getRelatedCreators(entry, 4);
  return {
    slug: entry.slug,
    displayName: entry.name,
    youtubeHandle: entry.handle,
    channelId: entry.youtubeChannelId ?? "",
    country: entry.country,
    countryCode: entry.countryCode,
    category: entry.category,
    nicheId: entry.niche,
    contentType: entry.contentType,
    description: entry.description,
    fallbackAvatarUrl: entry.avatar ?? undefined,
    fallbackBannerUrl: entry.banner ?? undefined,
    relatedCreators: related.map((r) => r.slug),
  };
}

/**
 * Convert all entries to legacy Creator format.
 */
export function toCreatorList(entries: readonly CreatorEntry[]): Creator[] {
  return entries.map(toCreator);
}
