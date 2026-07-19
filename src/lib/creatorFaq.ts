import { formatCompact, formatCurrency } from "./format";
import type { CreatorProfile } from "./creatorProfile";

export interface CreatorFaqEntry {
  question: string;
  answer: string;
}

/**
 * Format a formatter callback so the FAQ answers use the same
 * compact / currency notation as the visible page copy. Nothing here
 * is locale-aware yet — the phase-1 FAQ pool is English-only. When
 * we localize creator strings we'll pass a `useTranslations` hook
 * in and expand this signature.
 */
type Formatters = {
  compact: (n: number) => string;
  currency: (n: number) => string;
};

const defaultFormatters: Formatters = {
  compact: (n) => formatCompact(n),
  currency: (n) => formatCurrency(n, "USD", { compact: true }),
};

/**
 * Build the creator-specific FAQ entries that appear both in the
 * visible page and in the emitted FAQPage JSON-LD.
 *
 * Only questions whose answers can be honestly answered from the
 * available data are emitted. If we don't have a value (e.g. the
 * subscriber count is hidden) we drop that specific question rather
 * than filling it with a placeholder — search engines dislike FAQ
 * items with vague or absent answers.
 */
export function buildCreatorFaq(
  profile: CreatorProfile,
  fmt: Formatters = defaultFormatters,
): CreatorFaqEntry[] {
  const { creator, channel, earnings } = profile;
  const name = creator.displayName;
  const entries: CreatorFaqEntry[] = [];

  const monthlyExpected = earnings.earnings.expected.monthly;
  const yearlyExpected = earnings.earnings.expected.annual;

  // "How much does X make?" — always answered, using the yearly band.
  entries.push({
    question: `How much does ${name} make?`,
    answer:
      monthlyExpected > 0
        ? `${name} is estimated to earn around ${fmt.currency(monthlyExpected)} per month (${fmt.currency(yearlyExpected)} per year) from YouTube ad revenue, based on estimated monthly views of ${fmt.compact(earnings.monthlyViews)} and a country/niche RPM of about ${fmt.currency(earnings.rpmExpected)} per 1,000 views. Actual earnings depend on many factors we can't observe from public data alone.`
        : `We could not compute a reliable earnings estimate for ${name} right now — the YouTube Data API did not return usable statistics for this channel. Our estimates are based on publicly-visible view counts, country, and niche RPM benchmarks.`,
  });

  if (monthlyExpected > 0) {
    entries.push({
      question: `How much does ${name} earn per month?`,
      answer: `${name}'s estimated monthly YouTube earnings are around ${fmt.currency(monthlyExpected)}. The Conservative band is roughly ${fmt.currency(earnings.earnings.low.monthly)} and the Optimistic band is roughly ${fmt.currency(earnings.earnings.high.monthly)}. These are independent estimates, not statements of actual revenue.`,
    });
  }

  if (earnings.monthlyViews > 0 && channel.videoCount > 0) {
    const perVideoEstimate = monthlyExpected / Math.max(1, channel.videoCount / 12);
    entries.push({
      question: `How much does ${name} make per video?`,
      answer: `Based on the estimated monthly earnings and upload cadence, ${name} may earn around ${fmt.currency(perVideoEstimate)} per uploaded video from YouTube ad revenue — before sponsorships, affiliate, or membership income. Real per-video revenue varies significantly by video performance.`,
    });
  }

  if (
    channel.subscriberCount !== null &&
    !channel.hiddenSubscriberCount &&
    channel.subscriberCount > 0
  ) {
    entries.push({
      question: `How many subscribers does ${name} have?`,
      answer: `${name} has approximately ${fmt.compact(channel.subscriberCount)} subscribers on YouTube (${channel.subscriberCount.toLocaleString("en-US")} subscribers). Subscriber counts on YouTube update in near real-time.`,
    });
  }

  if (yearlyExpected > 0) {
    entries.push({
      question: `How much is ${name} worth?`,
      answer: `${name}'s YouTube-only annual earnings are estimated at around ${fmt.currency(yearlyExpected)}. This tool only estimates YouTube ad revenue — it does not include sponsorship deals, merchandise, other platforms, business ventures, or personal net worth. Public net-worth figures should be treated as speculation.`,
    });
  }

  if (earnings.sponsorshipPerVideo.expected > 0) {
    entries.push({
      question: `What is a typical sponsorship rate for ${name}?`,
      answer: `Based on subscriber count, average views, and niche, a typical brand-integration deal for ${name} is estimated at around ${fmt.currency(earnings.sponsorshipPerVideo.expected)} per video (range: ${fmt.currency(earnings.sponsorshipPerVideo.low)} — ${fmt.currency(earnings.sponsorshipPerVideo.high)}). Real sponsorship rates are always negotiated case by case.`,
    });
  }

  return entries;
}
