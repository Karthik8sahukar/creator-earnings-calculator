import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { publicConfig } from "@/lib/config";

/**
 * Site footer with 4 columns of navigation + a legal footer row.
 *
 * All visible strings are translated via next-intl. `publicConfig.siteName`
 * appears only in the machine-readable copyright suffix (kept English
 * because it's a brand string).
 */
export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-slate-200/70 bg-white/60">
      <div className="container-page py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm text-slate-600">
        <div>
          <h3 className="font-semibold text-slate-900">BeHumler</h3>
          <p className="mt-2 leading-relaxed">{t("brandBlurb")}</p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">{t("calculators")}</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/youtube-rpm-calculator" className="hover:text-slate-900">
                {t("rpmCalculator")}
              </Link>
            </li>
            <li>
              <Link href="/youtube-cpm-calculator" className="hover:text-slate-900">
                {t("cpmCalculator")}
              </Link>
            </li>
            <li>
              <Link href="/youtube-shorts-calculator" className="hover:text-slate-900">
                {t("shortsCalculator")}
              </Link>
            </li>
            <li>
              <Link href="/youtube-sponsorship-calculator" className="hover:text-slate-900">
                {t("sponsorshipCalculator")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">{t("resources")}</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/methodology" className="hover:text-slate-900">
                {t("methodology")}
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className="hover:text-slate-900">
                {t("disclaimer")}
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-slate-900">
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-slate-900">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-slate-900">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">{t("dataSource")}</h4>
          <p className="mt-3 leading-relaxed">
            <a
              href="https://developers.google.com/youtube/v3"
              className="underline hover:text-slate-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("dataSourceLink")}
            </a>
            {" — "}
            {t("brandBlurb")}
          </p>
        </div>
      </div>
      <div className="container-page pb-8 text-xs text-slate-500">
        {t("copyright", { year })} · {publicConfig.siteName}.
      </div>
    </footer>
  );
}
