import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { publicConfig } from "@/lib/config";
import { Logo } from "./Logo";
// Blog is now a real destination (previously rendered as a disabled
// "Soon" chip). The link below points to the MDX-backed blog index.

/**
 * Site footer.
 *
 * Design goals:
 *   - Four content columns (Calculators, Company, Legal, Resources).
 *   - Uses the same brand + tagline stack as the header.
 *   - No `/api/health` link — that route is internal and not designed
 *     as a public destination.
 *   - No social icons — we do not have real profile URLs configured
 *     yet, so we omit the row entirely rather than emit placeholders.
 *
 * `publicConfig.siteName` is still used in the copyright suffix
 * because that legal-adjacent string must match the canonical product
 * name used in metadata and JSON-LD.
 */
export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-slate-200/70 bg-white/60 dark:border-slate-800/70 dark:bg-slate-950/40">
      <div className="container-page py-12 grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] text-sm text-slate-600 dark:text-slate-400">
        <div className="space-y-4 max-w-sm">
          <Logo size="md" withTagline />
          <p className="leading-relaxed">{t("brandBlurb")}</p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("calculators")}
          </h4>
          {/*
            Order: Money → Instagram → RPM → CPM → Shorts → Sponsorship.
            Instagram is elevated to the second position (immediately
            below YouTube Money Calculator) so it's visible without
            scrolling on any viewport that shows the footer.
          */}
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/#find-channel"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("moneyCalculator")}
              </Link>
            </li>
            <li>
              <Link
                href="/instagram-money-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
                data-testid="footer-instagram-link"
              >
                {t("instagramCalculator")}
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-rpm-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("rpmCalculator")}
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-cpm-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("cpmCalculator")}
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-shorts-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("shortsCalculator")}
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-sponsorship-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("sponsorshipCalculator")}
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-engagement-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("engagementCalculator") ?? "Engagement Calculator"}
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-adsense-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("adsenseCalculator") ?? "AdSense Calculator"}
              </Link>
            </li>
            <li>
              <Link
                href="/twitch-bits-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("twitchBitsCalculator") ?? "Twitch Bits Calculator"}
              </Link>
            </li>
            <li>
              <Link
                href="/yes-no-picker-wheel"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("yesNoPickerWheel") ?? "Yes/No Picker Wheel"}
              </Link>
            </li>
            <li>
              <Link
                href="/random-team-generator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("teamGenerator") ?? "Random Team Generator"}
              </Link>
            </li>
            <li>
              <Link
                href="/spin-the-wheel"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("spinWheel") ?? "Spin the Wheel"}
              </Link>
            </li>
            <li>
              <Link
                href="/coin-flip"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("coinFlip") ?? "Coin Flip"}
              </Link>
            </li>
            <li>
              <Link
                href="/dice-roller"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("diceRoller") ?? "Dice Roller"}
              </Link>
            </li>
            <li>
              <Link
                href="/random-number-generator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("randomNumber") ?? "Random Number Generator"}
              </Link>
            </li>
            <li>
              <Link
                href="/random-name-picker"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("namePicker") ?? "Random Name Picker"}
              </Link>
            </li>
            <li>
              <Link
                href="/character-counter"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("characterCounter") ?? "Character Counter"}
              </Link>
            </li>
            <li>
              <Link
                href="/word-counter"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("wordCounter") ?? "Word Counter"}
              </Link>
            </li>
            <li>
              <Link
                href="/random-color-generator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("colorGenerator") ?? "Random Color Generator"}
              </Link>
            </li>
            <li>
              <Link
                href="/truth-or-dare-generator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("truthOrDare") ?? "Truth or Dare"}
              </Link>
            </li>
            <li>
              <Link
                href="/json-formatter"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("jsonFormatter") ?? "JSON Formatter"}
              </Link>
            </li>
            <li>
              <Link
                href="/jwt-decoder"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("jwtDecoder") ?? "JWT Decoder"}
              </Link>
            </li>
            <li>
              <Link
                href="/uuid-generator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("uuidGenerator") ?? "UUID Generator"}
              </Link>
            </li>
            <li>
              <Link
                href="/regex-tester"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("regexTester") ?? "Regex Tester"}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("company")}
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/about"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("about")}
              </Link>
            </li>
            <li>
              <Link
                href="/creators"
                className="hover:text-slate-900 dark:hover:text-slate-100"
                data-testid="footer-creators-link"
              >
                {t("creators")}
              </Link>
            </li>
            <li>
              <Link
                href="/top-creators"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Top Creators
              </Link>
            </li>
            <li>
              <Link
                href="/methodology"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("methodology")}
              </Link>
            </li>
            <li>
              <Link
                href="/blog"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("blog")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("legal")}
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/privacy"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("terms")}
              </Link>
            </li>
            <li>
              <Link
                href="/disclaimer"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                {t("disclaimer")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {t("resources")}
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href="https://developers.google.com/youtube/v3"
                className="hover:text-slate-900 dark:hover:text-slate-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("dataSourceLink")}
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
            {t("estimatesBlurb")}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="container-page py-6 text-xs text-slate-500 dark:text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            {t("copyright", { year })}{" "}
            <span className="whitespace-nowrap">— {publicConfig.siteName}.</span>
          </span>
          <span className="whitespace-nowrap">{t("notFinancialAdvice")}</span>
        </div>
      </div>
    </footer>
  );
}
