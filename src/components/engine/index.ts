/**
 * Tool Engine — Component Barrel Export
 *
 * Import from '@/components/engine' to access all engine components.
 *
 * Architecture:
 *   - ToolLayout: Universal page layout (breadcrumbs, header, actions, related, FAQ)
 *   - ToolJsonLd: JSON-LD structured data (BreadcrumbList, SoftwareApplication, FAQPage)
 *   - Inputs: Standardized form inputs (NumberInput, TextInput, etc.)
 *   - Outputs: Standardized result displays (ResultCard, CopyableOutput, etc.)
 *
 * Usage (minimal tool page):
 *
 *   // page.tsx
 *   import { createToolMetadata } from "@/lib/engine";
 *   import { ToolLayout, ToolJsonLd } from "@/components/engine";
 *
 *   export const generateMetadata = createToolMetadata("my-tool");
 *
 *   export default function Page({ params }) {
 *     const { locale } = await params;
 *     return (
 *       <>
 *         <ToolLayout slug="my-tool" faq={FAQ}>
 *           <MyToolClient />
 *         </ToolLayout>
 *         <ToolJsonLd slug="my-tool" locale={locale} faq={FAQ} />
 *       </>
 *     );
 *   }
 */

// ─── Layout ─────────────────────────────────────────────────────────
export { ToolLayout } from "./ToolLayout";
export type { ToolLayoutProps } from "./ToolLayout";
export { ToolJsonLd } from "./ToolJsonLd";

// ─── Inputs ─────────────────────────────────────────────────────────
export {
  NumberInput,
  TextInput,
  SelectInput,
  SliderInput,
  ToggleInput,
  type SelectOption,
} from "./inputs";

// ─── Outputs ────────────────────────────────────────────────────────
export {
  ResultCard,
  ResultHighlight,
  CopyableOutput,
  FormulaDisplay,
} from "./outputs";
