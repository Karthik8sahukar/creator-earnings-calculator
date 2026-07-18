import { ChevronDownIcon, HelpCircleIcon } from "../icons";

interface Item {
  q: string;
  a: string;
}

/**
 * Homepage FAQ (accordion).
 *
 * We use semantic <details>/<summary> instead of a bespoke JS accordion
 * because it:
 *   - Works with keyboard and screen readers out of the box.
 *   - Progressively enhances (functions even if JS fails).
 *   - Doesn't need client-side state, keeping the section server-rendered.
 *
 * Answers are intentionally cautious — they mirror the disclaimer that
 * "figures are estimates" that exists elsewhere in the app. We do NOT
 * publish schema.org FAQPage markup here to avoid conflating homepage
 * schema with the existing WebSite/WebApplication JSON-LD in layout.
 */
const ITEMS: readonly Item[] = [
  {
    q: "How accurate are the earnings estimates?",
    a: "The figures are estimates, not statements of actual revenue. They combine a channel's public view counts with industry-typical RPM/CPM ranges. Real earnings depend on the specific ad mix, viewer geography, watch time, YouTube Premium share, and other factors we cannot see from public data alone.",
  },
  {
    q: "How is RPM calculated?",
    a: "RPM (revenue per mille) is total revenue divided by monetized views, multiplied by one thousand. It is a creator-side metric — different from CPM, which is what advertisers pay per one thousand ad impressions. RPM is typically lower than CPM because it accounts for unmonetized views and YouTube's revenue share.",
  },
  {
    q: "Does YouTube pay per subscriber?",
    a: "No. YouTube pays for monetized ad views and other qualifying revenue events, not for subscriber counts. Subscribers matter because they tend to drive more views over time, but the subscriber number itself is not a direct payout.",
  },
  {
    q: "Can I estimate Shorts revenue?",
    a: "Yes. Shorts monetize through the Creator Pool rather than pre-roll ads, so their RPM is generally much lower than long-form. Our Shorts calculator applies a separate Shorts RPM band so the estimate reflects that difference.",
  },
] as const;

export function Faq() {
  return (
    <section aria-labelledby="faq-title">
      <div className="text-center max-w-2xl mx-auto">
        <p className="label">FAQ</p>
        <h2
          id="faq-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          Frequently asked questions
        </h2>
      </div>

      <div className="mt-10 mx-auto max-w-3xl card divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {ITEMS.map((item) => (
          <details
            key={item.q}
            className="group open:bg-slate-50/60 dark:open:bg-slate-800/40 transition-colors"
          >
            <summary
              className="list-none cursor-pointer flex items-start gap-3 px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 rounded-none"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                <HelpCircleIcon width={16} height={16} />
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                {item.q}
              </span>
              <ChevronDownIcon
                width={18}
                height={18}
                className="mt-1 shrink-0 text-slate-500 transition group-open:rotate-180 dark:text-slate-400"
              />
            </summary>
            <div className="px-5 pb-5 pt-0 pl-16 -mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
