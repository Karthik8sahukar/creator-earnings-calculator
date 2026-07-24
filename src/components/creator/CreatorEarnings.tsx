"use client";

import { useTranslations } from "next-intl";

import { useFormatMoney } from "@/components/currency";
import type { CreatorProfile } from "@/lib/creatorProfile";
import { formatCompact } from "@/lib/format";

interface Props {
  profile: CreatorProfile;
}

/**
 * The estimated-earnings card on the creator profile page.
 *
 * Uses the global CurrencyContext to format all monetary values in
 * the user's selected currency. Amounts from the profile are in USD;
 * conversion happens via the `useFormatMoney` hook.
 */
export function CreatorEarnings({ profile }: Props) {
  const t = useTranslations("creator.earnings");
  const { formatMoney } = useFormatMoney();
  const { earnings } = profile;
  const hasData = earnings.monthlyViews > 0;

  const fmt = (n: number, opts: { compact?: boolean } = { compact: true }) =>
    formatMoney(n, opts);

  return (
    <section aria-labelledby="creator-earnings-title" className="card p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="label">{t("eyebrow")}</p>
          <h2
            id="creator-earnings-title"
            className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100"
          >
            {t("title", { name: profile.creator.displayName })}
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs text-right">
          {hasData
            ? t("assumption", {
                views: formatCompact(earnings.monthlyViews),
                rpm: fmt(earnings.rpmExpected, { compact: false }),
              })
            : t("noData")}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Tile
          label={t("monthly")}
          value={hasData ? fmt(earnings.earnings.expected.monthly) : "—"}
          band={
            hasData
              ? `${fmt(earnings.earnings.low.monthly)} — ${fmt(
                  earnings.earnings.high.monthly,
                )}`
              : undefined
          }
        />
        <Tile
          label={t("yearly")}
          value={hasData ? fmt(earnings.earnings.expected.annual) : "—"}
          band={
            hasData
              ? `${fmt(earnings.earnings.low.annual)} — ${fmt(
                  earnings.earnings.high.annual,
                )}`
              : undefined
          }
        />
        <Tile
          label={t("sponsorship")}
          value={
            hasData || earnings.sponsorshipPerVideo.expected > 0
              ? fmt(earnings.sponsorshipPerVideo.expected)
              : "—"
          }
          band={
            hasData || earnings.sponsorshipPerVideo.expected > 0
              ? `${fmt(earnings.sponsorshipPerVideo.low)} — ${fmt(
                  earnings.sponsorshipPerVideo.high,
                )}`
              : undefined
          }
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MicroTile
          label={t("rpm")}
          value={fmt(earnings.rpmExpected, { compact: false })}
          suffix={t("perThousand")}
        />
        <MicroTile
          label={t("cpm")}
          value={fmt(earnings.cpmExpected, { compact: false })}
          suffix={t("perThousand")}
        />
        <MicroTile
          label={t("shortsRevenue")}
          value={
            hasData ? fmt(earnings.shortsEarnings.expected.monthly) : "—"
          }
          suffix={t("perMonth")}
        />
      </div>

      <p className="mt-6 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        {t("disclaimer")}
      </p>
    </section>
  );
}

function Tile({
  label,
  value,
  band,
}: {
  label: string;
  value: string;
  band?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/40 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {band && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {band}
        </p>
      )}
    </div>
  );
}

function MicroTile({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {value}
        {suffix && (
          <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
