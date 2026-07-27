"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { getToolBySlug, getCategoryDef, type ToolEntry } from "@/lib/tools";
import { getRelatedTools } from "@/lib/tools/collections";
import { ToolPageActions } from "@/components/ui/ToolPageActions";
import { CategoryIcon } from "@/components/ui/Icon";
import type { FaqItem, ToolMaxWidth } from "@/lib/engine/metadata";
import { getToolMaxWidth as getDefaultMaxWidth, getToolEyebrow } from "@/lib/engine/metadata";

// ─── Types ──────────────────────────────────────────────────────────

export interface ToolLayoutProps {
  /** Tool slug from the registry. Drives all automatic behavior. */
  slug: string;
  /** The interactive tool component (business logic). */
  children: React.ReactNode;

  // ─── Content overrides ──────────────────────────────────────────
  /** Override the page title (default: registry title). */
  title?: string;
  /** Override the intro paragraph (default: registry description). */
  intro?: string;
  /** Override the eyebrow badge text (default: category label). */
  eyebrow?: string;

  // ─── Optional sections ──────────────────────────────────────────
  /** FAQ items rendered below the tool. */
  faq?: FaqItem[];
  /** Explicit related tools override (bypasses registry computation). */
  relatedTools?: ToolEntry[];
  /** Number of related tools to show (default: 6). */
  relatedLimit?: number;

  // ─── Content slots ──────────────────────────────────────────────
  /** Rendered above the children (tool content). */
  beforeTool?: React.ReactNode;
  /** Rendered below the children (tool content). */
  afterTool?: React.ReactNode;
  /** Rendered before the Related Tools section. */
  beforeRelated?: React.ReactNode;
  /** Rendered after the Related Tools section. */
  afterRelated?: React.ReactNode;
  /** Formula or explanation section (rendered after the tool). */
  formula?: React.ReactNode;
  /** Notes section (rendered after formula). */
  notes?: React.ReactNode;
  /** Examples section (rendered after notes). */
  examples?: React.ReactNode;

  // ─── Visibility toggles ─────────────────────────────────────────
  /** Show breadcrumbs. Default: true. */
  showBreadcrumbs?: boolean;
  /** Show page header (eyebrow, H1, intro). Default: true. */
  showHeader?: boolean;
  /** Show ToolPageActions (favorite, share, tracking). Default: true. */
  showActions?: boolean;
  /** Show Related Tools section. Default: true. */
  showRelatedTools?: boolean;
  /** Show FAQ section. Default: true (only renders if faq has items). */
  showFaq?: boolean;

  // ─── Layout customization ───────────────────────────────────────
  /** Override max-width (default: derived from category). */
  maxWidth?: ToolMaxWidth;
  /** Additional className on the tool content wrapper. */
  contentClassName?: string;
  /** Additional className on the outer container. */
  toolClassName?: string;
  /** Additional breadcrumb items (inserted between Home and tool). */
  breadcrumbMiddle?: Array<{ label: string; href: string }>;
}

// ─── Component ──────────────────────────────────────────────────────

/**
 * ToolLayout — The universal layout for all tool pages.
 *
 * Automatically provides:
 *   - Breadcrumbs (Home → [middle] → Tool Name)
 *   - Header with eyebrow badge, H1, intro paragraph
 *   - ToolPageActions (FavoriteButton + ShareButton + VisitTracker)
 *   - Children slot for the interactive tool (business logic)
 *   - Optional formula/notes/examples sections
 *   - Related Tools grid (registry-computed or explicit override)
 *   - FAQ section
 *
 * All sections are optional and don't render empty wrappers.
 * Backward-compatible: existing usage with just slug + children + faq works unchanged.
 */
export function ToolLayout({
  slug,
  children,
  title: titleOverride,
  intro: introOverride,
  eyebrow: eyebrowOverride,
  faq,
  relatedTools: explicitRelated,
  relatedLimit = 6,
  beforeTool,
  afterTool,
  beforeRelated,
  afterRelated,
  formula,
  notes,
  examples,
  showBreadcrumbs = true,
  showHeader = true,
  showActions = true,
  showRelatedTools = true,
  showFaq = true,
  maxWidth: maxWidthOverride,
  contentClassName,
  toolClassName,
  breadcrumbMiddle,
}: ToolLayoutProps) {
  const t = useTranslations();
  const tool = getToolBySlug(slug);

  if (!tool) {
    return (
      <div className="mx-auto max-w-4xl p-8 text-center">
        <p className="text-slate-500">Tool not found: {slug}</p>
      </div>
    );
  }

  const pageTitle = titleOverride ?? tool.title;
  const pageIntro = introOverride ?? tool.description;
  const pageEyebrow = eyebrowOverride ?? getToolEyebrow(slug);
  const maxWidth = maxWidthOverride ?? getDefaultMaxWidth(tool);
  const categoryDef = getCategoryDef(tool.category);
  const eyebrowColor = getEyebrowColor(tool.category);

  // Compute related tools: explicit override OR registry computation
  const relatedTools = showRelatedTools
    ? (explicitRelated ?? getRelatedTools(slug, relatedLimit))
    : [];

  // Filter valid FAQs
  const validFaqs = showFaq
    ? (faq ?? []).filter((item) => item.q.trim().length > 0 && item.a.trim().length > 0)
    : [];

  return (
    <div className={`mx-auto ${maxWidth} space-y-10 ${toolClassName ?? ""}`}>
      {/* Breadcrumbs */}
      {showBreadcrumbs && (
        <nav
          aria-label={t("channelPage.breadcrumbAria")}
          data-testid="breadcrumb-nav"
          className="text-xs text-slate-500 dark:text-slate-400"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
                {t("common.breadcrumbs.home")}
              </Link>
            </li>
            {breadcrumbMiddle?.map((b) => (
              <li key={b.href} className="flex items-center gap-1">
                <span aria-hidden>&rsaquo;</span>
                <Link
                  href={b.href as never}
                  className="hover:text-slate-900 dark:hover:text-slate-100"
                >
                  {b.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-1">
              <span aria-hidden>&rsaquo;</span>
              <span className="text-slate-700 dark:text-slate-300">{pageTitle}</span>
            </li>
          </ol>
        </nav>
      )}

      {/* Header */}
      {showHeader && (
        <header className="space-y-3 text-center sm:text-left">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${eyebrowColor}`}>
                {pageEyebrow}
              </p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {pageTitle}
              </h1>
            </div>
            {showActions && <ToolPageActions slug={slug} title={pageTitle} />}
          </div>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl">{pageIntro}</p>
        </header>
      )}

      {/* Actions without header (edge case) */}
      {!showHeader && showActions && (
        <div className="flex justify-end">
          <ToolPageActions slug={slug} title={pageTitle} />
        </div>
      )}

      {/* Before Tool slot */}
      {beforeTool}

      {/* Tool Content (business logic) */}
      <div className={contentClassName}>
        {children}
      </div>

      {/* After Tool slot */}
      {afterTool}

      {/* Formula section */}
      {formula && (
        <section aria-labelledby="formula-title" className="space-y-3">
          <h2 id="formula-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            How it works
          </h2>
          {formula}
        </section>
      )}

      {/* Notes section */}
      {notes && (
        <section aria-labelledby="notes-title" className="space-y-3">
          <h2 id="notes-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Notes
          </h2>
          {notes}
        </section>
      )}

      {/* Examples section */}
      {examples && (
        <section aria-labelledby="examples-title" className="space-y-3">
          <h2 id="examples-title" className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Examples
          </h2>
          {examples}
        </section>
      )}

      {/* Before Related slot */}
      {beforeRelated}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <RelatedToolsSection tools={relatedTools} categoryLabel={categoryDef?.label} />
      )}

      {/* After Related slot */}
      {afterRelated}

      {/* FAQ */}
      {validFaqs.length > 0 && (
        <section aria-labelledby="faq-title" className="card p-6 sm:p-8 space-y-4">
          <h2 id="faq-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Frequently Asked Questions
          </h2>
          <dl className="space-y-4">
            {validFaqs.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}

// ─── Related Tools Sub-component ────────────────────────────────────

function RelatedToolsSection({
  tools,
  categoryLabel,
}: {
  tools: ToolEntry[];
  categoryLabel?: string;
}) {
  return (
    <section aria-labelledby="related-tools-title" className="space-y-5">
      <div>
        <h2
          id="related-tools-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Related Tools
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {categoryLabel
            ? `More ${categoryLabel} tools you might find useful.`
            : "Other tools you might find useful."}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => {
          const catDef = getCategoryDef(tool.category);
          return (
            <li key={tool.slug}>
              <Link
                href={tool.href as never}
                className="group card flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
              >
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300">
                    <CategoryIcon category={tool.category} size={16} />
                  </span>
                  {catDef && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${catDef.badgeColor}`}>
                      {catDef.label}
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {tool.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                  {tool.description}
                </p>

                <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-300">
                  Open
                  <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    &rarr;
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function getEyebrowColor(category: string): string {
  switch (category) {
    case "creator-analytics":
      return "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-200";
    case "developer-tools":
      return "bg-accent-500/10 text-accent-600 dark:text-accent-400";
    case "decision-random":
      return "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200";
    case "text-tools":
      return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "calculators":
      return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200";
    case "converters":
      return "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-200";
    case "web-tools":
      return "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}
