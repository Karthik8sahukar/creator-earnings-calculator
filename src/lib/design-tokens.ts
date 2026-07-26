/**
 * Design Tokens — Standardized values for the BeHumler design system.
 *
 * Every new component MUST use these tokens for consistency.
 * Import from '@/lib/design-tokens' instead of hardcoding values.
 *
 * Naming follows: {property}.{variant} (e.g. spacing.section, card.radius)
 */

// ─── Spacing ────────────────────────────────────────────────────────

/** Section spacing between major homepage sections. */
export const spacing = {
  /** Gap between major homepage sections (desktop). */
  section: "space-y-20 sm:space-y-28",
  /** Gap between subsections within a section. */
  subsection: "space-y-10 sm:space-y-12",
  /** Standard grid gap. */
  grid: "gap-4 sm:gap-5",
  /** Tight grid gap (compact cards). */
  gridTight: "gap-3 sm:gap-4",
  /** Content padding inside cards. */
  cardPadding: "p-5 sm:p-6",
  /** Section heading to content gap. */
  headingGap: "mb-8 sm:mb-10",
} as const;

// ─── Card Sizes ─────────────────────────────────────────────────────

export const card = {
  /** Border radius for all cards. */
  radius: "rounded-2xl",
  /** Hover animation (translate + shadow). */
  hover: "hover:-translate-y-1 hover:shadow-pop transition duration-200",
  /** Focus ring for keyboard navigation. */
  focus: "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60",
  /** Icon container size — standard. */
  iconSize: "h-11 w-11",
  /** Icon container size — large (featured cards). */
  iconSizeLg: "h-14 w-14",
  /** Icon container size — compact. */
  iconSizeSm: "h-10 w-10",
  /** Icon container border-radius. */
  iconRadius: "rounded-xl",
  /** Icon container background gradient. */
  iconGradient: "bg-gradient-to-br from-brand-500/12 to-accent-500/12",
} as const;

// ─── Typography ─────────────────────────────────────────────────────

export const typography = {
  /** Page section headings. */
  sectionTitle: "text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50",
  /** Section subtitle/description. */
  sectionSubtitle: "text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed",
  /** Card title. */
  cardTitle: "text-[15px] font-semibold text-slate-900 dark:text-slate-100 leading-snug",
  /** Card description. */
  cardDescription: "text-sm text-slate-600 dark:text-slate-400 leading-relaxed",
  /** Small meta text (badges, counts). */
  meta: "text-[10px] font-semibold uppercase tracking-wider",
  /** CTA link text. */
  cta: "text-sm font-medium text-brand-600 dark:text-brand-300",
  /** Hero headline. */
  heroTitle: "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]",
  /** Hero subtitle. */
  heroSubtitle: "text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed",
} as const;

// ─── Badges ─────────────────────────────────────────────────────────

export const badge = {
  /** Base badge classes (always applied). */
  base: "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
  /** Category-specific badge colors. */
  colors: {
    "creator-analytics": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "developer-tools": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    "text-tools": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    "decision-random": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "calculators": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "converters": "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
    "utilities": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    "web-tools": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  },
  /** Neutral/default badge. */
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  /** Highlighted/featured badge. */
  featured: "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200",
  /** Count badge (tool counts on category cards). */
  count: "bg-white/80 dark:bg-slate-800/80 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm",
} as const;

// ─── Gradients ──────────────────────────────────────────────────────

export const gradient = {
  /** Category card backgrounds. */
  category: {
    "creator-analytics": "from-brand-500/10 to-brand-600/5",
    "developer-tools": "from-accent-500/10 to-accent-600/5",
    "text-tools": "from-emerald-500/10 to-emerald-600/5",
    "decision-random": "from-purple-500/10 to-purple-600/5",
    "calculators": "from-amber-500/10 to-amber-600/5",
    "converters": "from-rose-500/10 to-rose-600/5",
    "utilities": "from-slate-500/10 to-slate-600/5",
    "web-tools": "from-indigo-500/10 to-indigo-600/5",
  },
  /** Icon background gradient. */
  iconBg: "from-brand-500/12 to-accent-500/12",
  /** Featured card border/bg gradient. */
  featured: "from-white to-brand-50/30 dark:from-slate-900 dark:to-brand-950/20",
} as const;

// ─── Grid Layouts ───────────────────────────────────────────────────

export const grid = {
  /** Homepage category grid. */
  categories: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5",
  /** Tool cards grid (standard). */
  tools: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  /** Quick actions (compact cards). */
  quick: "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  /** Featured tools (larger cards). */
  featured: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
} as const;

// ─── Animations ─────────────────────────────────────────────────────

export const animation = {
  /** Standard card hover. */
  cardHover: "transition duration-200 hover:-translate-y-1 hover:shadow-pop",
  /** Subtle card hover (less elevation). */
  cardHoverSubtle: "transition duration-200 hover:-translate-y-0.5 hover:shadow-pop",
  /** Arrow movement on hover. */
  arrowHover: "transition-transform duration-200 group-hover:translate-x-0.5",
  /** Larger arrow movement (featured cards). */
  arrowHoverLg: "transition-transform duration-200 group-hover:translate-x-1",
  /** Fade in animation class. */
  fadeIn: "animate-fade-in",
} as const;

export type BadgeCategoryColor = keyof typeof badge.colors;
