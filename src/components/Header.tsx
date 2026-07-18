import Link from "next/link";

import { CalculatorsMenu } from "./CalculatorsMenu";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Site header.
 *
 * Layout:
 *   Logo | (Calculators ▼   Blog·Soon   Methodology   About)     | LanguageSelector · ThemeToggle · MobileNav
 *
 * Notes:
 *   - "BeHumler" is the visible brand text (hardcoded in <Logo/>).
 *     publicConfig.siteName remains "YouTube Money Calculator" — that
 *     drives SEO metadata and must not change.
 *   - "Blog" has no route yet; it renders as a non-interactive span with
 *     a "Soon" chip so we never emit a link to a 404 page.
 *   - The mobile nav renders the same links inside a slide-in sheet
 *     for `< md` viewports.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/75">
      <div className="container-page flex items-center justify-between gap-3 h-16">
        <Logo size="md" />

        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1 text-sm text-slate-700 dark:text-slate-200"
        >
          <CalculatorsMenu />

          <span
            aria-disabled="true"
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
            title="Blog is coming soon"
          >
            Blog
            <span className="chip">Soon</span>
          </span>

          <Link
            href="/methodology"
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            Methodology
          </Link>
          <Link
            href="/about"
            className="rounded-md px-2 py-1 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          >
            About
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
