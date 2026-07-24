import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Homepage hero — dual-category positioning.
 *
 * Communicates BOTH product categories (Creator Analytics + Decision Tools)
 * within the first viewport. The H1 remains "YouTube Money Calculator" for
 * SEO (screen-reader only); the visual headline conveys the platform scope.
 */
export function Hero({ children }: { children: ReactNode }) {
  const t = useTranslations();

  return (
    <section aria-labelledby="hero-title" className="pt-6 sm:pt-10">
      <div className="max-w-4xl mx-auto text-center space-y-5">
        {/* SEO H1 — preserved for search engines */}
        <h1 id="hero-title" className="sr-only">
          {t("home.title")}
        </h1>

        {/* Platform badge */}
        <p className="chip-brand mx-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {t("brand.tagline")}
        </p>

        {/* Dual-category headline */}
        <h2
          aria-hidden="true"
          className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight"
        >
          Creator Analytics &amp;{" "}
          <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">
            Decision Tools
          </span>
        </h2>

        {/* Subtitle mentioning both categories */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Estimate YouTube, Instagram &amp; Twitch creator earnings — or use free decision tools
          like Spin the Wheel, Coin Flip, Dice Roller, and Random Team Generator. All in one platform.
        </p>

        {/* Dual CTAs — one per category */}
        <div className="flex flex-wrap justify-center gap-3 pt-1">
          <a
            href="#creator-tools"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            Creator Tools
          </a>
          <a
            href="#decision-tools"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-purple-700 hover:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
          >
            Decision Tools
          </a>
        </div>

        {/* Balanced badges — both categories */}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {[
            "YouTube", "Instagram", "Spin Wheel", "Coin Flip",
            "Analytics", "Random Picker", "Revenue", "Decision Tools",
          ].map((label) => (
            <span
              key={label}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400"
            >
              {label}
            </span>
          ))}
        </div>

        {/* Trust metrics */}
        <div className="flex flex-wrap justify-center gap-6 pt-3 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">20+</span>
            Creator Tools
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">7</span>
            Decision Tools
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">200+</span>
            Creator Profiles
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Free</span>
            Forever
          </span>
        </div>
      </div>

      {/* Featured tool search — after category context is established */}
      <div id="find-channel" className="mt-10 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Featured Tool — YouTube Money Calculator
          </p>
          <div className="search-shell">
            <div className="search-shell-inner">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
