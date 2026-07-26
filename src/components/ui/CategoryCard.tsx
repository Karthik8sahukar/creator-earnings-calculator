"use client";

import { Link } from "@/i18n/navigation";
import type { ToolCategoryDef } from "@/lib/tools/categories";

interface Props {
  category: ToolCategoryDef & { count: number };
}

/**
 * Category Card — displays a tool category with dynamic tool count.
 *
 * Design:
 *   - Large emoji icon
 *   - Category name (bold)
 *   - Dynamic tool count badge
 *   - Short description
 *   - Gradient background
 *   - Hover elevation + arrow animation
 *   - 16-20px rounded corners
 */
export function CategoryCard({ category }: Props) {
  return (
    <Link
      href={category.href as never}
      className={`group card flex flex-col gap-4 rounded-2xl p-6 bg-gradient-to-br ${category.gradient} transition-all duration-200 hover:-translate-y-1 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60`}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl" aria-hidden>
          {category.emoji}
        </span>
        <span className="inline-flex items-center justify-center min-w-[28px] rounded-full bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm">
          {category.count}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
          {category.label}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
          {category.description}
        </p>
      </div>

      <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
        Explore
        <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
      </span>
    </Link>
  );
}
