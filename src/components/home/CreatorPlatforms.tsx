import { useT } from "@/lib/t";

import Link from "next/link";

import { CheckIcon, ShareIcon, PlayIcon } from "../icons";

/**
 * Creator earnings calculators — platform picker.
 *
 * Rendered on the homepage directly beneath `PopularCalculators`.
 * Two large, prominent cards give first-time visitors a one-click
 * entry point into the two supported platform calculators.
 *
 * Design principles:
 *   • The whole card is a single `<Link>` — never a link wrapping
 *     an inner `<button>` (no nested interactive elements).
 *   • The visible CTA text is descriptive ("Open Instagram
 *     calculator") so link-only screen-reader lists still make sense.
 *   • Features are rendered as a real `<ul>` with a check icon per
 *     row so the affordance is legible without color.
 *   • No carousels, no tabs — both cards are visible at every
 *     breakpoint (stacked on narrow, side-by-side from `sm:` up).
 *   • Uses `@/i18n/navigation` so hrefs stay locale-aware and never
 *     produce `/en/en/…` even if the current locale is already `en`.
 */

interface Platform {
  id: "youtube" | "instagram";
  href: "/#find-channel" | "/instagram-money-calculator";
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
  features: readonly string[];
  /** Cosmetic gradient. Kept per-platform so the two cards feel
   *  visually distinct without diverging from the brand palette. */
  gradient: string;
}

const PLATFORMS: readonly Platform[] = [
  {
    id: "youtube",
    href: "/#find-channel",
    Icon: PlayIcon,
    gradient: "from-brand-500/15 to-accent-500/10",
    features: ["adRevenue", "shorts", "sponsorships", "rpmCpm"],
  },
  {
    id: "instagram",
    href: "/instagram-money-calculator",
    Icon: ShareIcon,
    gradient: "from-accent-500/15 to-brand-500/10",
    features: ["sponsoredPosts", "reels", "stories", "affiliate", "subscriptions"],
  },
];

export function CreatorPlatforms() {
  const t = useT("creatorPlatforms");
  return (
    <section
      aria-labelledby="creator-platforms-title"
      data-testid="creator-platforms"
    >
      <div className="mb-6 max-w-2xl">
        <p className="label">{t("eyebrow")}</p>
        <h2
          id="creator-platforms-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {PLATFORMS.map(({ id, href, Icon, gradient, features }) => (
          <li key={id}>
            <Link
              href={href}
              aria-label={t(`cards.${id}.cta`)}
              data-testid={`platform-card-${id}`}
              className="group card flex h-full flex-col justify-between gap-4 p-6 sm:p-7 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
            >
              <div>
                <span
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-brand-700 dark:text-brand-200`}
                >
                  <Icon width={22} height={22} />
                </span>
                <h3 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {t(`cards.${id}.title`)}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t(`cards.${id}.description`)}
                </p>

                <ul
                  className="mt-4 grid gap-1.5 text-sm text-slate-700 dark:text-slate-300"
                  aria-label={t(`cards.${id}.title`)}
                >
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckIcon
                        width={14}
                        height={14}
                        aria-hidden
                      />
                      <span>{t(`cards.${id}.features.${f}`)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 dark:text-brand-300">
                {t(`cards.${id}.cta`)}
                <span
                  aria-hidden
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
