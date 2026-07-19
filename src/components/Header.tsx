import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { CalculatorsMenu } from "./CalculatorsMenu";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Site header.
 *
 * Composition:
 *   Logo | (Calculators ▼   Blog·Soon   Methodology   About)
 *        | LanguageSelector · ThemeToggle · MobileNav
 *
 * Notes:
 *   - Visible branding is the hardcoded string "BeHumler" inside
 *     `<Logo/>`. `publicConfig.siteName` remains "YouTube Money
 *     Calculator" — it drives SEO metadata and must not change.
 *   - "Blog" has no route yet — it renders as a non-interactive span
 *     with a "Soon" chip so we never link to a 404 page.
 *   - MobileNav renders the same links inside a slide-in sheet for
 *     `< md` viewports.
 *   - Every internal link uses `@/i18n/navigation` so the active
 *     locale prefix is preserved automatically.
 */
export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/75">
      <div className="container-page flex items-center justify-between gap-3 h-16">
        <Logo size="md" />

        <nav
          aria-label={t("nav.primary")}
          className="hidden md:flex items-center gap-1 text-sm text-slate-700 dark:text-slate-200"
        >
          <CalculatorsMenu />

          {/*
            Direct, always-visible link to the Instagram Money Calculator.
            The calculator also lives inside the CalculatorsMenu dropdown
            above, but we surface it here as a top-level link so first-
            time visitors can reach it in one click without knowing the
            dropdown exists. Uses `@/i18n/navigation` so the current
            locale prefix is applied automatically.
          */}
          <Link
            href="/instagram-money-calculator"
            aria-label={t("nav.instagramCalculatorAria")}
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            data-testid="header-instagram-link"
          >
            {t("nav.instagramCalculator")}
          </Link>

          <Link
            href="/creators"
            aria-label={t("nav.creatorsAria")}
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            data-testid="header-creators-link"
          >
            {t("nav.creators")}
          </Link>

          <Link
            href="/blog"
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            {t("nav.blog")}
          </Link>

          <Link
            href="/methodology"
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            {t("nav.methodology")}
          </Link>
          <Link
            href="/about"
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            {t("nav.about")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <div className="hidden md:flex items-center gap-1">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <MobileNav className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
