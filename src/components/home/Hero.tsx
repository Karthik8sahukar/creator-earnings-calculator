import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Homepage hero — Creator Analytics Platform positioning.
 *
 * The H1 is still "YouTube Money Calculator" for SEO continuity
 * (the `home.title` key), but the VISUAL hierarchy leads with the
 * platform tagline. The H1 is rendered as a smaller eyebrow chip
 * while the visually dominant heading is the platform description.
 *
 * Layout:
 *   - Platform tagline (visually dominant)
 *   - Subtitle describing multi-platform capabilities
 *   - Dual CTAs: "Search Creator" + "Browse Tools"
 *   - Platform badges row
 *   - Search box (children slot, still labeled as "Featured Tool")
 */
export function Hero({ children }: { children: ReactNode }) {
  const t = useTranslations();

  return (
    <section aria-labelledby="hero-title" className="pt-6 sm:pt-12">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* SEO H1 — kept for search engines but visually de-emphasized */}
        <h1 id="hero-title" className="sr-only">
          {t("home.title")}
        </h1>

        {/* Platform identity — visually dominant */}
        <p className="chip-brand mx-auto">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
          {t("brand.tagline")}
        </p>

        <h2
          aria-hidden="true"
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("home.platformHeadline")}
        </h2>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          {t("home.platformSubtitle")}
        </p>

        {/* Dual CTAs */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a
            href="#find-channel"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            {t("home.ctaSearch")}
          </a>
          <a
            href="#tools"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            {t("home.ctaTools")}
          </a>
        </div>

        {/* Platform badges */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {(
            [
              "home.badges.youtube",
              "home.badges.instagram",
              "home.badges.twitch",
              "home.badges.creatorEconomy",
              "home.badges.revenue",
              "home.badges.analytics",
            ] as const
          ).map((key) => (
            <span
              key={key}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400"
            >
              {t(key)}
            </span>
          ))}
        </div>
      </div>

      {/* Featured tool search — scroll target */}
      <div id="find-channel" className="mt-12 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            {t("home.featuredToolLabel")}
          </p>
          <div className="search-shell">
            <div className="search-shell-inner">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
