import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { CheckIcon } from "../icons";
import { DashboardPreview } from "./DashboardPreview";

/**
 * Homepage hero.
 *
 * The H1 renders `home.title`, which in every locale's message bundle
 * is the string "YouTube Money Calculator" — the canonical product
 * name (proper noun, not translated) required for SEO. E2E tests
 * assert on this exact H1, and the SEO metadata block in the page
 * relies on the same wording.
 *
 * The search box is rendered via `children` (the homepage passes in
 * `<Suspense><ChannelWorkspace/></Suspense>`), wrapped in a decorative
 * gradient halo — the input's own markup is not modified.
 *
 * On `lg+` viewports, an illustrative `<DashboardPreview/>` sits to the
 * right. It is `aria-hidden` and clearly labelled as illustrative.
 */
export function Hero({ children }: { children: ReactNode }) {
  const t = useTranslations();
  return (
    <section aria-labelledby="hero-title" className="pt-6 sm:pt-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div className="space-y-6 text-center lg:text-left">
          <p className="chip-brand mx-auto lg:mx-0">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            {t("brand.tagline")}
          </p>

          <h1
            id="hero-title"
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("home.title")}
          </h1>

          <p className="max-w-2xl mx-auto lg:mx-0 text-lg text-slate-600 dark:text-slate-300">
            {t("home.subtitle")}
          </p>

          <ul className="flex flex-wrap justify-center lg:justify-start gap-2 text-sm text-slate-600 dark:text-slate-300">
            {(
              [
                "home.trustBadges.poweredBy",
                "home.trustBadges.free",
                "home.trustBadges.noLogin",
              ] as const
            ).map((key) => (
              <li
                key={key}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 dark:border-slate-800 dark:bg-slate-900/70"
              >
                <CheckIcon
                  width={14}
                  height={14}
                  className="text-brand-600 dark:text-brand-300"
                />
                {t(key)}
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
