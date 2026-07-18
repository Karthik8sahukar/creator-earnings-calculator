import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LanguageSelector } from "./LanguageSelector";

/**
 * Site header.
 *
 * Server component that reads translations via `useTranslations()` and
 * hosts the (client) `<LanguageSelector />`.
 *
 * Visible branding is intentionally the hardcoded string "BeHumler" —
 * `publicConfig.siteName` remains "YouTube Money Calculator" for SEO
 * metadata and JSON-LD.
 */
export function Header() {
  const t = useTranslations();

  const calculators = [
    { href: "/youtube-rpm-calculator", label: "RPM" },
    { href: "/youtube-cpm-calculator", label: "CPM" },
    { href: "/youtube-shorts-calculator", label: t("performance.shorts") },
    { href: "/youtube-sponsorship-calculator", label: t("footer.sponsorshipCalculator") },
  ] as const;

  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="container-page flex items-center justify-between gap-4 h-14">
        <Link
          href="/"
          className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 rounded-md"
          aria-label={t("nav.homeAria")}
        >
          <Image
            src="/behumler-logo.png"
            alt={t("brand.logoAlt")}
            width={180}
            height={60}
            priority
            className="h-10 w-auto object-contain"
          />
        </Link>

        <nav
          aria-label={t("nav.primary")}
          className="flex items-center gap-4 text-sm text-slate-600 overflow-x-auto"
        >
          <div className="hidden md:flex items-center gap-3">
            {calculators.map((c) => (
              <Link
                key={c.href}
                // Locale-aware — the i18n `<Link>` prepends the active
                // locale automatically.
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={c.href as any}
                className="hover:text-slate-900 transition whitespace-nowrap"
              >
                {c.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-slate-200" aria-hidden />
          </div>
          <Link
            className="hover:text-slate-900 transition whitespace-nowrap"
            href="/methodology"
          >
            {t("nav.methodology")}
          </Link>
          <Link
            className="hover:text-slate-900 transition whitespace-nowrap"
            href="/about"
          >
            {t("nav.about")}
          </Link>
        </nav>

        <LanguageSelector />
      </div>
    </header>
  );
}
