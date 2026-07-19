/**
 * Small, dependency-free helpers for building the JSON-LD payloads
 * that ship inside `<script type="application/ld+json">` tags.
 *
 * The rest of the codebase used to inline these objects at every
 * emit-site (see `src/app/[locale]/blog/[slug]/page.tsx` and
 * `src/app/[locale]/layout.tsx`). That was fine when we had two
 * emit sites — with the Creator Profile system we grow to five
 * distinct schema types, so a tiny shared helper keeps them
 * consistent and testable.
 *
 * Design rules:
 *
 *   1. Every helper returns a plain JS object. We do NOT stringify
 *      here — the caller does that in the `dangerouslySetInnerHTML`
 *      block so React can decide when the payload changes.
 *
 *   2. Optional fields are OMITTED (not set to `undefined` or `""`)
 *      because Google's validator flags empty properties as errors.
 *
 *   3. All URLs must be absolute — schema.org validators reject
 *      relative refs. Helpers assume the caller has already joined
 *      the base URL.
 */

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL. */
  url: string;
}

/**
 * Build a `BreadcrumbList` LD object.
 *
 * Position numbering is 1-based per schema.org — the first item is
 * position 1 (usually the homepage).
 */
export function buildBreadcrumbListLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export interface PersonLdInput {
  name: string;
  /** Absolute canonical URL (e.g. the creator's profile page). */
  url: string;
  description?: string;
  /** Handle, native display name, etc. */
  alternateName?: string;
  /** Absolute image URL. */
  image?: string;
  /**
   * Rich links to authoritative sources for the same entity —
   * usually the creator's YouTube channel URL. Google reads these
   * as "same as" references and can boost Knowledge Graph accuracy.
   */
  sameAs?: string[];
  /** Free-form label — we set this to the creator's category. */
  jobTitle?: string;
  /** Country the person is (publicly) associated with. */
  nationality?: string;
}

/**
 * Build a `Person` LD object.
 *
 * Not every field maps 1:1 to a creator record — we deliberately
 * omit properties we don't have a verified value for (birth date,
 * award list, height, etc.).
 */
export function buildPersonLd(p: PersonLdInput) {
  const out: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.name,
    url: p.url,
  };
  if (p.description) out.description = p.description;
  if (p.alternateName) out.alternateName = p.alternateName;
  if (p.image) out.image = p.image;
  if (p.sameAs && p.sameAs.length > 0) out.sameAs = p.sameAs;
  if (p.jobTitle) out.jobTitle = p.jobTitle;
  if (p.nationality) out.nationality = p.nationality;
  return out;
}

export interface OrganizationLdInput {
  name: string;
  url: string;
  /** Absolute logo URL. Omit if not known — Google prefers no logo to a bad one. */
  logo?: string;
  sameAs?: string[];
}

/**
 * Build an `Organization` LD object for the publisher — used both
 * at the root layout (site-wide) and nested inside creator pages.
 */
export function buildOrganizationLd(o: OrganizationLdInput) {
  const out: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: o.name,
    url: o.url,
  };
  if (o.logo) out.logo = o.logo;
  if (o.sameAs && o.sameAs.length > 0) out.sameAs = o.sameAs;
  return out;
}

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Build a `FAQPage` LD object. Google requires that every listed
 * question be visible on the page (not hidden behind a tab), which
 * the UI honours — we render the same list the JSON-LD encodes.
 *
 * Empty answers are dropped rather than emitted as empty strings.
 */
export function buildFaqPageLd(entries: FaqEntry[]) {
  const cleaned = entries.filter(
    (e) => e.question.trim().length > 0 && e.answer.trim().length > 0,
  );
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: cleaned.map((e) => ({
      "@type": "Question",
      name: e.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: e.answer,
      },
    })),
  };
}

export interface ItemListEntry {
  /** Display name for the item. */
  name: string;
  /** Absolute URL for the item. */
  url: string;
  /** Optional summary text (`description`). */
  description?: string;
}

/**
 * Build an `ItemList` LD object. Used on the /creators index page.
 * Google renders these as carousels in some SERP layouts.
 */
export function buildItemListLd(items: ItemListEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((it, i) => {
      const entry: Record<string, unknown> = {
        "@type": "ListItem",
        position: i + 1,
        url: it.url,
        name: it.name,
      };
      if (it.description) entry.description = it.description;
      return entry;
    }),
  };
}

/**
 * Serialize one or more JSON-LD payloads for embedding in a
 * `<script type="application/ld+json">` tag. Accepts an array so a
 * single page can emit multiple schemas in one call.
 *
 * We use `JSON.stringify` with no indentation — search engines don't
 * mind, and it keeps the response body small.
 */
export function serializeJsonLd(payloads: unknown[]): string {
  return JSON.stringify(payloads.length === 1 ? payloads[0] : payloads);
}
