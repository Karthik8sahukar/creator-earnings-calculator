import type { ReactNode } from "react";

/**
 * AppShell — Reusable layout wrapper for page content.
 *
 * Provides consistent:
 *   - Max-width container
 *   - Responsive padding
 *   - Vertical section spacing
 *   - Scroll-margin for anchor navigation
 *
 * Usage:
 *   <AppShell>
 *     <Section>...</Section>
 *     <Section>...</Section>
 *   </AppShell>
 *
 * The AppShell sits INSIDE the existing locale layout (which provides
 * <Header>, <main>, <Footer>). It wraps the page content within <main>.
 *
 * For the homepage:
 *   <AppShell variant="landing">...</AppShell>
 *
 * For tool pages:
 *   <AppShell variant="tool">...</AppShell>
 */

type Variant = "landing" | "tool" | "content";

interface Props {
  children: ReactNode;
  /** Layout variant. Default: "content". */
  variant?: Variant;
  /** Additional className. */
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  /** Landing page — generous vertical spacing between sections. */
  landing: "space-y-20 sm:space-y-28",
  /** Tool page — moderate spacing, max-width constrained. */
  tool: "space-y-10 sm:space-y-14 max-w-5xl mx-auto",
  /** Content page (about, legal, blog) — tighter spacing. */
  content: "space-y-8 sm:space-y-12 max-w-4xl mx-auto",
};

export function AppShell({ children, variant = "content", className = "" }: Props) {
  return (
    <div className={`${VARIANT_CLASSES[variant]} ${className}`}>
      {children}
    </div>
  );
}

// ─── Section Component ──────────────────────────────────────────────

interface SectionProps {
  children: ReactNode;
  /** HTML id for anchor linking. */
  id?: string;
  /** Accessible label for the section. */
  "aria-labelledby"?: string;
  /** Additional className. */
  className?: string;
}

/**
 * Section — semantic wrapper for a major content block.
 * Adds scroll-margin-top so anchor links clear the sticky header.
 */
export function Section({ children, id, className = "", ...props }: SectionProps) {
  return (
    <section id={id} className={`scroll-mt-20 ${className}`} {...props}>
      {children}
    </section>
  );
}

// ─── SectionHeader Component ────────────────────────────────────────

interface SectionHeaderProps {
  /** Main section heading. */
  title: string;
  /** Optional subtitle/description. */
  subtitle?: string;
  /** Heading id (for aria-labelledby references). */
  id?: string;
  /** Optional right-aligned action (e.g. "View all →" link). */
  action?: ReactNode;
  /** Center the text. */
  centered?: boolean;
}

/**
 * SectionHeader — consistent heading + subtitle for homepage sections.
 */
export function SectionHeader({
  title,
  subtitle,
  id,
  action,
  centered = false,
}: SectionHeaderProps) {
  return (
    <div className={`mb-8 sm:mb-10 ${centered ? "text-center" : ""} ${action ? "flex flex-wrap items-end justify-between gap-4" : ""}`}>
      <div>
        <h2
          id={id}
          className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {title}
        </h2>
        {subtitle && (
          <p className={`mt-2 text-slate-600 dark:text-slate-300 leading-relaxed ${centered ? "max-w-xl mx-auto" : "max-w-2xl"}`}>
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
