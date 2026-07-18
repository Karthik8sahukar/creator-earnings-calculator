import { getLocale, getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

/**
 * Notice rendered on long-form static pages (About, Methodology,
 * Privacy, Terms, Disclaimer) for any locale that does not yet have
 * a professionally reviewed translation.
 *
 * We show a professional banner, a link to read the English canonical
 * version, and a link back home. We deliberately do NOT machine-
 * translate legal-adjacent copy — those pages ship translated only
 * when a human translator has signed off on them.
 *
 * `pathSuffix` should be the path AFTER the locale segment, e.g.
 * "/about" or "/methodology" — used to build the English deep link.
 */
export async function TranslationPending({
  pathSuffix,
}: {
  pathSuffix: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("translationPending");

  // Defensive: this component should never render when locale === "en"
  // because English IS the canonical content. If a caller misuses it,
  // fail loudly in dev by rendering nothing.
  if (locale === routing.defaultLocale) return null;

  const englishHref = `/${routing.defaultLocale}${pathSuffix}`;

  return (
    <section
      role="note"
      aria-label={t("title")}
      className="max-w-3xl mx-auto card p-6 sm:p-8 space-y-4"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-lg"
        >
          🌐
        </span>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900">{t("title")}</h2>
          <p className="text-slate-600 leading-relaxed">{t("body")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {/* Native <a> so the browser navigates cross-locale without
            next-intl reinterpreting the URL. */}
        <a href={englishHref} className="btn-primary text-sm">
          {t("readInEnglish")}
        </a>
        <Link href="/" className="btn-secondary text-sm">
          {t("backToHome")}
        </Link>
      </div>
    </section>
  );
}
