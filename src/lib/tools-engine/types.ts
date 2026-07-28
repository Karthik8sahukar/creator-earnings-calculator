/**
 * Shared types for the tools engine.
 *
 * Every tool — regardless of category — shares these primitives
 * for metadata, FAQ, and registry integration.
 */

export interface ToolFaq {
  q: string;
  a: string;
}

export interface ToolMeta {
  /** URL slug (used in route and registry). */
  slug: string;
  /** Display title. */
  title: string;
  /** Short description for cards (max ~100 chars). */
  description: string;
  /** Long description for the tool page hero. */
  longDescription: string;
  /** Category identifier. */
  category: "developer" | "text" | "pdf";
  /** Route path. */
  href: string;
  /** SEO keywords. */
  keywords: string[];
  /** Related tool slugs. */
  relatedTools: string[];
  /** FAQ items. */
  faq: ToolFaq[];
}
