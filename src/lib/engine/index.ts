/**
 * Tool Engine — Library Barrel Export
 *
 * Import from '@/lib/engine' to access metadata generators and utilities.
 *
 * Usage:
 *   import { createToolMetadata, generateToolJsonLd } from "@/lib/engine";
 *
 *   // In page.tsx generateMetadata export:
 *   export const generateMetadata = createToolMetadata("coin-flip");
 *
 *   // For JSON-LD in the component:
 *   const jsonLd = generateToolJsonLd({ slug: "coin-flip", locale, faq: FAQ });
 */

export {
  createToolMetadata,
  generateToolJsonLd,
  getToolEyebrow,
  getToolMaxWidth,
  type FaqItem,
  type ToolMetadataOverrides,
  type ToolJsonLdOptions,
} from "./metadata";
