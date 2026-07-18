import type { ReactNode } from "react";

import { CheckIcon } from "../icons";
import { DashboardPreview } from "./DashboardPreview";

/**
 * Homepage hero.
 *
 * The H1 text "YouTube Money Calculator" is deliberately unchanged —
 * the E2E test `e2e/search.spec.ts` and the SEO metadata both rely on
 * this exact string being the sole H1 on the page.
 *
 * The search box is rendered via `children` (the homepage passes in
 * `<Suspense><ChannelWorkspace/></Suspense>`), wrapped in a decorative
 * gradient halo — the input's own markup is not modified.
 *
 * On `lg+` viewports, an illustrative `<DashboardPreview/>` sits to the
 * right. It is `aria-hidden` and clearly labelled as illustrative.
 */
export function Hero({ children }: { children: ReactNode }) {
  return (
    <section
      aria-labelledby="hero-title"
      className="pt-6 sm:pt-10"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div className="space-y-6 text-center lg:text-left">
          <p className="chip-brand mx-auto lg:mx-0">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Creator Analytics Platform
          </p>

          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            YouTube{" "}
            <span className="gradient-text">Money Calculator</span>
          </h1>

          <p className="max-w-2xl mx-auto lg:mx-0 text-lg text-slate-600 dark:text-slate-300">
            Estimate YouTube revenue, RPM, CPM, Shorts earnings and
            sponsorship value using real public YouTube channel data.
          </p>

          <ul className="flex flex-wrap justify-center lg:justify-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            {TRUST.map((t) => (
              <li
                key={t}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <CheckIcon
                  width={14}
                  height={14}
                  className="text-brand-600 dark:text-brand-300"
                />
                {t}
              </li>
            ))}
          </ul>

          <div id="find-channel" className="pt-2 scroll-mt-24">
            <div className="search-shell">
              <div className="search-shell-inner">{children}</div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}

const TRUST = [
  "Powered by YouTube Data API",
  "Free Forever",
  "No Login Required",
] as const;
