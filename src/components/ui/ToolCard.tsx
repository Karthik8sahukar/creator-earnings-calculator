"use client";

import Link from "next/link";
import type { ToolEntry } from "@/lib/tools/registry";
import { getCategoryDef } from "@/lib/tools/categories";
import { CategoryIcon } from "./Icon";
import { FavoriteButton } from "./FavoriteButton";
import { card, typography, badge as badgeTokens, animation } from "@/lib/design-tokens";

// ─── Variants ───────────────────────────────────────────────────────

type Variant = "compact" | "standard" | "featured";

interface Props {
  tool: ToolEntry;
  /** Card size variant. Default: "standard". */
  variant?: Variant;
  /** Override the badge text (default: category label). */
  badgeOverride?: string;
}

/**
 * Universal Tool Card — the primary reusable card component
 * for displaying tools across the entire platform.
 *
 * Uses the "stretched link" pattern:
 *   - Card container is a `<div>` (not a `<Link>`)
 *   - Navigation link uses `after:absolute after:inset-0` to cover the full card
 *   - FavoriteButton sits at `relative z-10` above the stretched link
 *   - This avoids invalid nested `<a><button>` HTML
 *   - Keyboard navigation: Tab focuses the link first, then the button
 *
 * Variants:
 *   - compact:  icon + title only (quick actions grid)
 *   - standard: icon + title + description + badge + FavoriteButton
 *   - featured: larger icon + title + description + badge + CTA + FavoriteButton
 */
export function ToolCard({ tool, variant = "standard", badgeOverride }: Props) {
  const category = getCategoryDef(tool.category);
  const badgeText = badgeOverride ?? tool.badge ?? category?.label ?? "";
  const badgeColor = category?.badgeColor ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (variant === "compact") {
    return <CompactCard tool={tool} />;
  }

  if (variant === "featured") {
    return <FeaturedCard tool={tool} badgeText={badgeText} badgeColor={badgeColor} />;
  }

  return <StandardCard tool={tool} badgeText={badgeText} badgeColor={badgeColor} />;
}

// ─── Standard Card ──────────────────────────────────────────────────

function StandardCard({
  tool,
  badgeText,
  badgeColor,
}: {
  tool: ToolEntry;
  badgeText: string;
  badgeColor: string;
}) {
  return (
    <div
      className={`group card relative flex h-full flex-col gap-4 ${card.radius} ${card.hover} p-5`}
    >
      {/* Stretched link — covers full card for navigation */}
      <Link
        href={tool.href as never}
        className={`absolute inset-0 ${card.radius} ${card.focus}`}
        aria-label={tool.title}
        tabIndex={0}
      >
        <span className="sr-only">{tool.title}</span>
      </Link>

      <div className="flex items-start justify-between">
        <span className={`inline-flex ${card.iconSize} items-center justify-center ${card.iconRadius} ${card.iconGradient} text-brand-600 dark:text-brand-300`}>
          <CategoryIcon category={tool.category} size={18} />
        </span>

        {/* FavoriteButton above the stretched link */}
        <span className="relative z-10" onClick={(e) => e.stopPropagation()}>
          <FavoriteButton slug={tool.slug} compact className="!p-1.5 !rounded-lg !border-0 !bg-transparent hover:!bg-slate-100 dark:hover:!bg-slate-800" />
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        <h3 className={typography.cardTitle}>
          {tool.title}
        </h3>
        <p className={`${typography.cardDescription} line-clamp-2`}>
          {tool.description}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 ${typography.cta}`}>
          Open
          <span aria-hidden className={animation.arrowHover}>&rarr;</span>
        </span>
        {badgeText && (
          <span className={`${badgeTokens.base} ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Compact Card ───────────────────────────────────────────────────

function CompactCard({ tool }: { tool: ToolEntry }) {
  return (
    <Link
      href={tool.href as never}
      className={`group card flex flex-col items-center text-center gap-3 ${card.radius} p-5 ${card.hover} ${card.focus}`}
    >
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconGradient} text-brand-600 dark:text-brand-300`}>
        <CategoryIcon category={tool.category} size={20} />
      </span>
      <div className="space-y-0.5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tool.title}</h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{tool.description}</p>
      </div>
    </Link>
  );
}

// ─── Featured Card ──────────────────────────────────────────────────

function FeaturedCard({
  tool,
  badgeText,
  badgeColor,
}: {
  tool: ToolEntry;
  badgeText: string;
  badgeColor: string;
}) {
  return (
    <div
      className={`group card relative flex flex-col sm:flex-row items-start gap-5 ${card.radius} p-6 sm:p-7 border-2 border-brand-200/60 bg-gradient-to-br from-white to-brand-50/30 dark:border-brand-700/40 dark:from-slate-900 dark:to-brand-950/20 ${card.hover}`}
    >
      {/* Stretched link — covers full card for navigation */}
      <Link
        href={tool.href as never}
        className={`absolute inset-0 ${card.radius} ${card.focus}`}
        aria-label={tool.title}
        tabIndex={0}
      >
        <span className="sr-only">{tool.title}</span>
      </Link>

      <span className={`inline-flex ${card.iconSizeLg} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-500/10 text-brand-600 dark:text-brand-300`}>
        <CategoryIcon category={tool.category} size={26} />
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {tool.title}
          </h3>
          {badgeText && (
            <span className={`${badgeTokens.base} ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          {tool.description}
        </p>
        <div className="flex items-center gap-3 pt-1">
          <span className={`inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300`}>
            Open tool
            <span aria-hidden className={animation.arrowHoverLg}>&rarr;</span>
          </span>
        </div>
      </div>

      {/* FavoriteButton above the stretched link — top-right */}
      <span className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
        <FavoriteButton slug={tool.slug} compact className="!p-1.5 !rounded-lg !border-0 !bg-transparent hover:!bg-slate-100 dark:hover:!bg-slate-800" />
      </span>
    </div>
  );
}
