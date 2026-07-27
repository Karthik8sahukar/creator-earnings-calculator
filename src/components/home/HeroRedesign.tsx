import { useT } from "@/lib/t";
import type { ReactNode } from "react";

/**
 * Redesigned hero — clean premium landing page style.
 * Stripe/Linear/Vercel-inspired with generous whitespace.
 */
export function HeroRedesign({ children }: { children: ReactNode }) {
  const t = useT();

  return (
    <section aria-labelledby="hero-title" className="relative pt-12 sm:pt-20 pb-8">
      {/* Decorative background shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-gradient-to-br from-brand-500/8 via-accent-500/6 to-transparent blur-3xl" />
        <div className="absolute top-20 -right-20 w-[300px] h-[300px] rounded-full bg-accent-500/5 blur-2xl" />
        <div className="absolute top-40 -left-20 w-[200px] h-[200px] rounded-full bg-brand-500/5 blur-2xl" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center space-y-8">
        {/* SEO H1 */}
        <h1 id="hero-title" className="sr-only">{t("home.title")}</h1>

        {/* Visual headline */}
        <h2 aria-hidden="true" className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-[1.1]">
          <span className="block">One Platform.</span>
          <span className="block gradient-text">Dozens of Free Tools.</span>
        </h2>

        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
          Creator analytics, developer utilities, and decision tools — all browser-based, privacy-friendly, and free.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <a href="#find-channel" className="btn-primary px-8 py-3.5 text-base rounded-xl shadow-lg hover:shadow-pop transition-all">
            Search Creator
          </a>
          <a href="#tools" className="btn-secondary px-8 py-3.5 text-base rounded-xl">
            Browse All Tools
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">✓</span> Browser Based
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">✓</span> No Login
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">✓</span> Free Forever
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-green-500">✓</span> Fast
          </span>
        </div>

        {/* Platform indicators */}
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {["YouTube", "Instagram", "Twitch"].map((platform) => (
            <span key={platform} className="inline-flex items-center rounded-full border border-slate-200/80 bg-white/60 backdrop-blur px-4 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700/80 dark:bg-slate-900/60 dark:text-slate-300">
              {platform}
            </span>
          ))}
        </div>
      </div>

      {/* Search */}
      <div id="find-channel" className="relative mt-14 scroll-mt-24">
        <div className="max-w-2xl mx-auto">
          <div className="search-shell">
            <div className="search-shell-inner">{children}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
