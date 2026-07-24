/**
 * Pipeline types — shared across all ingestion scripts.
 *
 * These types represent the INTERMEDIATE format used by the pipeline.
 * They map 1:1 onto CreatorEntry but are expressed as a plain JSON
 * structure (no TypeScript module imports) so scripts can read/write
 * them as .json files without compiling the app.
 */

/**
 * A single creator record in the pipeline's intermediate JSON format.
 * Every field from CreatorEntry is represented, plus pipeline-specific
 * tracking fields.
 */
export interface PipelineCreator {
  // ─── Identity (required) ────────────────────────────────────────
  id: string;
  slug: string;
  name: string;
  handle: string;
  aliases: string[];

  // ─── YouTube ────────────────────────────────────────────────────
  youtubeChannelId: string | null;
  verified: boolean;

  // ─── Classification ─────────────────────────────────────────────
  country: string;
  countryCode: string;
  language: string;
  category: string;
  niche: string;
  contentType: "long" | "shorts" | "mixed";
  subscriberTier: "mega" | "large" | "mid" | "emerging";

  // ─── Content ────────────────────────────────────────────────────
  description: string;
  keywords: string[];

  // ─── Media ──────────────────────────────────────────────────────
  avatar: string | null;
  banner: string | null;

  // ─── Social ─────────────────────────────────────────────────────
  socialLinks: Record<string, string>;

  // ─── Pipeline metadata ──────────────────────────────────────────
  metadata: {
    importedAt: string;
    enrichedAt?: string;
    verifiedAt?: string;
    source: string;
    verificationConfidence?: number;
    subscriberCount?: number;
    viewCount?: number;
    videoCount?: number;
    joinedAt?: string;
  };
}

/**
 * Minimal input format for the import script.
 * Only truly required fields — everything else gets defaults.
 */
export interface ImportCreatorInput {
  /** Display name (required). */
  name: string;
  /** YouTube handle including @ (required). */
  handle: string;
  /** URL-safe slug. Auto-generated from name if not provided. */
  slug?: string;
  /** Alternative names/spellings. */
  aliases?: string[];
  /** YouTube channel ID if known. */
  youtubeChannelId?: string;
  /** Country name. */
  country?: string;
  /** ISO country code. */
  countryCode?: string;
  /** Primary language. */
  language?: string;
  /** Content category. */
  category?: string;
  /** Niche ID for RPM calculation. */
  niche?: string;
  /** Content type. */
  contentType?: "long" | "shorts" | "mixed";
  /** Short description. */
  description?: string;
  /** SEO keywords. */
  keywords?: string[];
  /** Subscriber tier if known. */
  subscriberTier?: "mega" | "large" | "mid" | "emerging";
  /** Source of this import (for tracking). */
  source?: string;
}

/**
 * Duplicate detection result.
 */
export interface DuplicateMatch {
  /** The incoming creator that is a duplicate. */
  incoming: { slug: string; name: string; handle: string };
  /** The existing creator it conflicts with. */
  existing: { slug: string; name: string; handle: string; channelId: string | null };
  /** Which field(s) matched. */
  matchedOn: ("slug" | "channelId" | "handle" | "normalizedName")[];
  /** Whether this is an exact or fuzzy match. */
  confidence: "exact" | "high" | "medium";
}

/**
 * Validation issue found during validate-creators.
 */
export interface ValidationIssue {
  slug: string;
  field: string;
  severity: "error" | "warning";
  message: string;
}

/**
 * Search index entry for a single creator.
 */
export interface SearchIndexEntry {
  slug: string;
  name: string;
  handle: string;
  aliases: string[];
  country: string;
  countryCode: string;
  category: string;
  niche: string;
  /** Pre-computed normalized tokens for fast matching. */
  tokens: string[];
}
