import type { Metadata } from "next";

import { StaticPage } from "@/components/StaticPage";

/**
 * The last time we reviewed the benchmark tables (RPM ranges, niche
 * multipliers, currency rates). Update alongside any change to
 * `src/lib/rpmData.ts`.
 */
const BENCHMARK_REVIEW_DATE = "2026-07-17";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How Creator Earnings Calculator estimates YouTube revenue: data sources, RPM/CPM definitions, country and niche assumptions, Shorts vs. long-form, and known limitations.",
  alternates: { canonical: "/methodology" },
};

export default function MethodologyPage() {
  return (
    <StaticPage
      title="Methodology"
      description="How the numbers on this site are produced and where our assumptions come from."
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <strong className="font-medium text-slate-900">Benchmark review date:</strong>{" "}
        <time dateTime={BENCHMARK_REVIEW_DATE}>{BENCHMARK_REVIEW_DATE}</time>. Country
        RPM ranges, niche multipliers, and currency rates were last reviewed on
        this date. Numbers are approximations from public creator-economy
        reports — they are not official YouTube data.
      </div>

      <h2 className="text-xl font-semibold text-slate-900">
        What we retrieve from YouTube
      </h2>
      <p>
        We use only the official{" "}
        <a
          href="https://developers.google.com/youtube/v3"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          YouTube Data API v3
        </a>
        . For every channel we fetch:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Title, handle, description, join date, country, thumbnail</li>
        <li>Subscriber count (or a &ldquo;hidden&rdquo; flag), total views, video count</li>
        <li>Uploads playlist id (used to fetch recent uploads)</li>
        <li>For each recent upload: title, published date, duration, views, likes, comments</li>
      </ul>
      <p>No scraping is performed. No private analytics data is retrieved.</p>

      <h2 className="text-xl font-semibold text-slate-900">
        What we cannot see
      </h2>
      <p>
        YouTube channels have a lot of private data that only the channel
        owner can see. We do NOT have access to any of it:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>Actual RPM / CPM</li>
        <li>Audience geography breakdown (only the channel&apos;s primary country)</li>
        <li>Watch time and average view duration</li>
        <li>Ad fill rate and ad category mix</li>
        <li>Revenue from YouTube Premium subscribers</li>
        <li>Sponsorship, affiliate, and merchandising income</li>
      </ul>
      <p>
        <strong>This is why exact earnings cannot be known.</strong> Any
        website claiming to show a real creator&apos;s actual earnings is
        guessing, including this one.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">RPM vs. CPM</h2>
      <p>
        <strong>CPM</strong> (Cost Per Mille) is what advertisers pay per 1,000
        monetized ad impressions, before YouTube takes its cut. It&apos;s an
        advertiser-side metric.
      </p>
      <p>
        <strong>RPM</strong> (Revenue Per Mille) is what remains for the
        creator per 1,000 total views (not just monetized ones), after
        YouTube&apos;s share. RPM is always lower than CPM. When someone talks
        about &ldquo;how much a creator earns per 1,000 views&rdquo; they
        almost always mean RPM.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Monetized-view percentage
      </h2>
      <p>
        Not every view generates ad revenue — viewers may skip ads, use
        ad-blockers, or watch on YouTube Premium (which shares differently).
        The monetized-view percentage slider caps what fraction of your views
        we treat as revenue-generating. Ninety percent is a common starting
        point for a mature channel; a very family-friendly, brand-safe channel
        might monetize higher, and a fringe-topic channel could monetize much
        lower.
      </p>
      <p>
        This percentage is applied <strong>exactly once</strong> in the
        formula, before RPM is applied.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Country assumptions
      </h2>
      <p>
        Different countries pay very different rates because advertisers value
        different audiences differently. We use per-country RPM tiers derived
        from public creator-economy reports. These are <em>audience</em>{" "}
        country, not creator country: a creator based in India whose audience
        is 90% US will earn much closer to the US band.
      </p>
      <p>
        We can&apos;t see your real audience breakdown through the API — we
        only see the channel&apos;s primary country as declared by the
        creator. Pick the country that best matches your actual viewers.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Niche assumptions
      </h2>
      <p>
        Niches monetize very differently. Finance, business, tech, and
        marketing niches command the highest RPMs because advertisers in those
        categories pay a lot to reach viewers. Music, kids, and casual gaming
        channels command lower RPMs. We express this as a multiplier on top of
        the country base RPM.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Shorts vs. long-form
      </h2>
      <p>
        Shorts monetize very differently from long-form videos. Long-form
        earns from a per-video ad auction. Shorts share a global ad revenue
        pool that&apos;s allocated to creators based on their share of eligible
        Shorts views. In practice this means Shorts RPM is roughly an order
        of magnitude lower than long-form RPM for a comparable channel.
      </p>
      <p>
        We express this as a content-type multiplier on top of country ×
        niche. A &ldquo;mixed&rdquo; channel gets a blended multiplier that
        sits between the two.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Blending mixed content
      </h2>
      <p>
        When a channel publishes both Shorts and long-form videos we look at
        the recent uploads to estimate the mix. Under 30% Shorts is treated as
        &ldquo;long-form&rdquo;, 30–70% as &ldquo;mixed&rdquo;, and above 70%
        as &ldquo;Shorts-first&rdquo;. You can override this in the
        calculator.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        How we estimate monthly views
      </h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>
          If we have at least three recent uploads in the last 30 days, we
          sum their views directly.
        </li>
        <li>
          Otherwise, if we have at least three uploads in the last 90 days, we
          sum those and scale down to a 30-day equivalent.
        </li>
        <li>
          Otherwise, we average views across the observed sample time span.
        </li>
      </ol>
      <p>
        We then report a low / expected / high band (0.7× / 1.0× / 1.35×) to
        reflect uncertainty. This is the input to the earnings calculator by
        default, but you can override it manually.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Why old videos still generate views
      </h2>
      <p>
        Popular videos can generate views (and revenue) for years after they
        were published. If we only fetch the most recent uploads, our monthly
        view estimate might miss substantial &ldquo;long tail&rdquo; income
        from an older viral hit. For channels like this the automatic
        estimate can be an under-estimate — use the manual monthly-views
        override to correct.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Why sponsorship income is separate
      </h2>
      <p>
        Sponsorship, affiliate, and membership income don&apos;t flow through
        AdSense and can&apos;t be inferred from view counts. We take them as
        explicit monthly inputs from the user and add them on top of the ad-
        revenue band.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Currency-rate limitations
      </h2>
      <p>
        Displayed non-USD currency totals use an approximate static FX table
        that we update periodically. This tool does not consume a live FX
        feed. If you need to make a financial decision, always cross-check
        against a live rate.
      </p>

      <h2 className="text-xl font-semibold text-slate-900">
        Known limitations
      </h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Ad fill rate, seasonality, and category mix are unknown.</li>
        <li>YouTube&apos;s share of ad revenue is baked into RPM.</li>
        <li>Refunds, invalid traffic, and taxes are not modelled.</li>
        <li>Currency conversion uses a static approximate rate.</li>
        <li>Sponsorship rate estimates are always negotiable.</li>
        <li>Older uploads that still generate long-tail views may bias our monthly view estimate downward.</li>
        <li>
          Cache TTLs mean freshly-uploaded videos may take a few minutes to
          appear.
        </li>
        <li>
          We cannot see private analytics such as playback locations, watch
          time, or actual RPM.
        </li>
      </ul>
      <p>
        In short: the numbers on this site are informed estimates. Treat them
        as a starting point, not as truth.
      </p>
    </StaticPage>
  );
}
