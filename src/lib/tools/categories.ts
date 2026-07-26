/**
 * Tool Category Definitions
 *
 * Category metadata with dynamically computed tool counts derived
 * from the unified registry. Adding a tool to the registry
 * automatically updates the count here.
 */

import { type ToolCategoryId, getToolCountByCategory } from "./registry";

export interface ToolCategoryDef {
  id: ToolCategoryId;
  /** Display name for the category. */
  label: string;
  /** Emoji icon shown on category cards. */
  emoji: string;
  /** Short description (shown on homepage cards). */
  description: string;
  /** Link target — category index page or best entry point. */
  href: string;
  /** Gradient classes for the card background. */
  gradient: string;
  /** Badge color classes. */
  badgeColor: string;
}

/**
 * All tool categories with their display metadata.
 * Order here determines display order on the homepage category grid.
 */
export const TOOL_CATEGORIES: readonly ToolCategoryDef[] = [
  {
    id: "creator-analytics",
    label: "Creator Tools",
    emoji: "\uD83C\uDFA5", // 🎥
    description: "Revenue calculators, RPM analysis, and monetization tools for YouTube, Instagram, and Twitch creators.",
    href: "/tools/creator-analytics",
    gradient: "from-brand-500/10 to-brand-600/5",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    id: "developer-tools",
    label: "Developer Tools",
    emoji: "\uD83D\uDCBB", // 💻
    description: "JSON, JWT, Base64, UUID, regex, cron, and more — all running locally in your browser.",
    href: "/tools/developer-tools",
    gradient: "from-accent-500/10 to-accent-600/5",
    badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  {
    id: "text-tools",
    label: "Text Tools",
    emoji: "\uD83D\uDCDD", // 📝
    description: "Character counting, word analysis, keyword density, and text statistics.",
    href: "/tools/text-tools",
    gradient: "from-emerald-500/10 to-emerald-600/5",
    badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    id: "decision-random",
    label: "Random & Decision",
    emoji: "\uD83C\uDFB2", // 🎲
    description: "Wheels, coin flips, dice, name pickers, and team generators for quick decisions.",
    href: "/tools/decision-random",
    gradient: "from-purple-500/10 to-purple-600/5",
    badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  {
    id: "calculators",
    label: "Calculators",
    emoji: "\uD83D\uDCCA", // 📊
    description: "Financial and analytics calculators for creators and businesses.",
    href: "/tools/calculators",
    gradient: "from-amber-500/10 to-amber-600/5",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    id: "converters",
    label: "Converters",
    emoji: "\uD83D\uDD04", // 🔄
    description: "Convert between data formats: SQL, CSV, JSON, timestamps, and URLs.",
    href: "/tools/converters",
    gradient: "from-rose-500/10 to-rose-600/5",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
  {
    id: "utilities",
    label: "Utilities",
    emoji: "\u2699\uFE0F", // ⚙️
    description: "Color generators, design helpers, and miscellaneous utility tools.",
    href: "/tools/utilities",
    gradient: "from-slate-500/10 to-slate-600/5",
    badgeColor: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    id: "web-tools",
    label: "Web Tools",
    emoji: "\uD83C\uDF10", // 🌐
    description: "URL encoding, regex testing, and web development helpers.",
    href: "/tools/web-tools",
    gradient: "from-indigo-500/10 to-indigo-600/5",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
];

/**
 * Get category definition by ID.
 */
export function getCategoryDef(id: ToolCategoryId): ToolCategoryDef | undefined {
  return TOOL_CATEGORIES.find((c) => c.id === id);
}

/**
 * Get all categories with their dynamically computed tool counts.
 * Only returns categories that have at least one tool.
 */
export function getCategoriesWithCounts(): Array<ToolCategoryDef & { count: number }> {
  const counts = getToolCountByCategory();
  return TOOL_CATEGORIES
    .map((cat) => ({ ...cat, count: counts[cat.id] ?? 0 }))
    .filter((cat) => cat.count > 0);
}

/**
 * Total tool count across all categories.
 * Used for the dynamic search placeholder.
 */
export function getTotalToolCount(): number {
  const counts = getToolCountByCategory();
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}
