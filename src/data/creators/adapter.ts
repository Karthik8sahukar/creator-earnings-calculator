/**
 * Adapter: converts CreatorEntry (new platform) → Creator (existing interface).
 *
 * This ensures backward compatibility. The existing pages, components,
 * and logic in src/lib/creators.ts continue to work unchanged.
 * New pages can import directly from the data platform.
 */

import type { Creator } from "@/lib/creators";
import type { CreatorEntry } from "./schema";
import { getRelatedCreators } from "./related";

/**
 * Convert a CreatorEntry to the legacy Creator interface.
 * Used by the existing creator profile system.
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
