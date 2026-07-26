"use client";

import { Link } from "@/i18n/navigation";
import type { ToolEntry } from "@/lib/tools/registry";
import { getCategoryDef } from "@/lib/tools/categories";

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
 * Variants:
 *   - compact:  icon + title only (quick actions grid)
 *   - standard: icon + title + description + badge (main grids)
 *   - featured: larger icon + title + description + badge + CTA (hero section)
 *
 * Design:
 *   - 16-20px rounded corners
 *   - Soft shadow on hover (shadow-pop)
 *   - Smooth -translate-y animation on hover
 *   - Gradient icon background
 *   - Category badge in top-right
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
    <Link
      href={tool.href as never}
      className="group card flex h-full flex-col gap-4 rounded-2xl p-5 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/12 to-accent-500/12 text-brand-600 dark:text-brand-300 text-lg">
          {getCategoryEmoji(tool.category)}
        </span>
        {badgeText && (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badgeColor}`}>
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex-1 space-y-1.5">
        <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug">
          {tool.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {tool.description}
        </p>
      </div>

      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 dark:text-brand-300">
        Open
        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">&rarr;</span>
      </span>
    </Link>
  );
}

// ─── Compact Card ───────────────────────────────────────────────────

function CompactCard({ tool }: { tool: ToolEntry }) {
  return (
    <Link
      href={tool.href as never}
      className="group card flex flex-col items-center text-center gap-3 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-xl">
        {getCategoryEmoji(tool.category)}
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
    <Link
      href={tool.href as never}
      className="group card flex flex-col sm:flex-row items-start gap-5 rounded-2xl p-6 sm:p-7 border-2 border-brand-200/60 bg-gradient-to-br from-white to-brand-50/30 dark:border-brand-700/40 dark:from-slate-900 dark:to-brand-950/20 transition duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    >
      <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-500/10 text-2xl">
        {getCategoryEmoji(tool.category)}
      </span>
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {tool.title}
          </h3>
          {badgeText && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeColor}`}>
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          {tool.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-300 pt-1">
          Open tool
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
        </span>
      </div>
    </Link>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    "creator-analytics": "\uD83C\uDFA5", // 🎥
    "developer-tools": "\uD83D\uDCBB",   // 💻
    "text-tools": "\uD83D\uDCDD",        // 📝
    "decision-random": "\uD83C\uDFB2",   // 🎲
    "calculators": "\uD83D\uDCCA",       // 📊
    "converters": "\uD83D\uDD04",        // 🔄
    "utilities": "\u2699\uFE0F",          // ⚙️
    "web-tools": "\uD83C\uDF10",         // 🌐
  };
  return emojis[category] ?? "\uD83D\uDD27"; // 🔧 fallback
}
