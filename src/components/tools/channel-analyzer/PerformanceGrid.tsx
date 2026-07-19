import { useTranslations } from "next-intl";

import {
  ChartIcon,
  DollarIcon,
  EyeIcon,
  FilmIcon,
  SparklesIcon,
  TrendingUpIcon,
} from "@/components/icons";
import { formatCompact, formatCurrency } from "@/lib/format";
import type {
  EngagementMetrics,
  GrowthLabel,
  GrowthMetrics,
  RevenueEstimate,
} from "@/lib/channelAnalyzer";

import { PerformanceCard } from "./PerformanceCard";

interface Props {
  revenue: RevenueEstimate;
  engagement: EngagementMetrics;
  growth: GrowthMetrics;
}

/**
 * Channel Analyzer — grid of performance / earnings tiles.
 *
 * Renders the eight tiles the spec enumerates:
 *
 *   1. Estimated Monthly Earnings
 *   2. Estimated Yearly Earnings
 *   3. Estimated RPM
 *   4. Estimated CPM
 *   5. Average Views
 *   6. Upload Frequency
 *   7. Engagement Rate
 *   8. Growth Score  (basic heuristic)
 *
 * Every tile has an "Estimated" prefix in its label — driven by the
 * i18n messages, not hard-coded — so we never present these figures
 * as official YouTube revenue. The transparency footer under the
 * grid reinforces the same message.
 *
 * All numbers come from the pre-computed analyzer output; this
 * component contains **no math**. If a formula changes it changes
 * in `lib/channelAnalyzer/*`, not here.
 */
export function PerformanceGrid({ revenue, engagement, growth }: Props) {
  const t = useTranslations("tools.channelAnalyzer.performance");
  const tCommon = useTranslations("common");

  const currency = revenue.currency || "USD";

  const monthlyExpected = formatCurrency(revenue.monthly.expected, currency, {
    compact: true,
  });
  const monthlyRange = `${formatCurrency(revenue.monthly.low, currency, {
    compact: true,
  })} – ${formatCurrency(revenue.monthly.high, currency, { compact: true })}`;

  const yearlyExpected = formatCurrency(revenue.yearly.expected, currency, {
    compact: true,
  });
  const yearlyRange = `${formatCurrency(revenue.yearly.low, currency, {
    compact: true,
  })} – ${formatCurrency(revenue.yearly.high, currency, { compact: true })}`;

  const rpmExpected = formatCurrency(revenue.rpmExpected, currency, {
    compact: false,
  });
  const cpmExpected = formatCurrency(revenue.cpmExpected, currency, {
    compact: false,
  });

  const engagementLabel = engagement.engagementRate.toFixed(2) + "%";
  const growthLabelKey: GrowthLabel = growth.growthLabel;

  return (
    <section
      aria-labelledby="channel-analyzer-perf-title"
      className="space-y-3"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2
          id="channel-analyzer-perf-title"
          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title")}
        </h2>
        <span className="chip-brand" aria-label={tCommon("estimatesOnly")}>
          {tCommon("estimatesOnly")}
        </span>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <PerformanceCard
          label={t("monthlyEarnings.label")}
          value={monthlyExpected}
          caption={t("monthlyEarnings.caption", { range: monthlyRange })}
          icon={<DollarIcon width={18} height={18} />}
          emphasized
          title={t("monthlyEarnings.title")}
        />
        <PerformanceCard
          label={t("yearlyEarnings.label")}
          value={yearlyExpected}
          caption={t("yearlyEarnings.caption", { range: yearlyRange })}
          icon={<DollarIcon width={18} height={18} />}
          emphasized
          title={t("yearlyEarnings.title")}
        />
        <PerformanceCard
          label={t("rpm.label")}
          value={rpmExpected}
          caption={t("rpm.caption", { country: revenue.country.label })}
          icon={<TrendingUpIcon width={18} height={18} />}
          title={t("rpm.title")}
        />
        <PerformanceCard
          label={t("cpm.label")}
          value={cpmExpected}
          caption={t("cpm.caption")}
          icon={<ChartIcon width={18} height={18} />}
          title={t("cpm.title")}
        />
        <PerformanceCard
          label={t("averageViews.label")}
          value={formatCompact(engagement.averageViews)}
          caption={t("averageViews.caption", { count: engagement.sampleSize })}
          icon={<EyeIcon width={18} height={18} />}
        />
        <PerformanceCard
          label={t("uploadFrequency.label")}
          value={t("uploadFrequency.value", {
            count: growth.uploadFrequency,
          })}
          caption={t("uploadFrequency.caption")}
          icon={<FilmIcon width={18} height={18} />}
        />
        <PerformanceCard
          label={t("engagementRate.label")}
          value={engagementLabel}
          caption={t("engagementRate.caption")}
          icon={<SparklesIcon width={18} height={18} />}
        />
        <PerformanceCard
          label={t("growthScore.label")}
          value={`${growth.growthScore} / 100`}
          caption={t(`growthScore.labels.${growthLabelKey}`)}
          icon={<TrendingUpIcon width={18} height={18} />}
        />
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t("disclaimer")}
      </p>
    </section>
  );
}
