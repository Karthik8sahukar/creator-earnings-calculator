import { useT } from "@/lib/t";

import { ChevronDownIcon, HelpCircleIcon } from "../icons";

const ITEMS = [
  { qKey: "homeFaq.items.accuracy.q", aKey: "homeFaq.items.accuracy.a" },
  { qKey: "homeFaq.items.rpm.q", aKey: "homeFaq.items.rpm.a" },
  { qKey: "homeFaq.items.subscribers.q", aKey: "homeFaq.items.subscribers.a" },
  { qKey: "homeFaq.items.shorts.q", aKey: "homeFaq.items.shorts.a" },
] as const;

/**
 * Homepage FAQ (accordion).
 *
 * We use semantic <details>/<summary> instead of a bespoke JS
 * accordion because it works with keyboard and screen readers out of
 * the box, progressively enhances if JS fails, and doesn't need any
 * client-side state.
 *
 * Answers are intentionally cautious — they mirror the disclaimer
 * ("figures are estimates") that exists elsewhere in the app. We do
 * NOT publish schema.org `FAQPage` markup here to avoid conflating
 * the homepage schema with the existing WebSite/WebApplication JSON-LD.
 */
export function Faq() {
  const t = useT();
  return (
    <section aria-labelledby="faq-title">
      <div className="text-center max-w-2xl mx-auto">
        <p className="label">{t("homeFaq.eyebrow")}</p>
        <h2
          id="faq-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("homeFaq.title")}
        </h2>
      </div>

      <div className="mt-10 mx-auto max-w-3xl card divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {ITEMS.map((item) => (
          <details
            key={item.qKey}
            className="group open:bg-slate-50/60 dark:open:bg-slate-800/40 transition-colors"
          >
            <summary className="list-none cursor-pointer flex items-start gap-3 px-5 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 rounded-none">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                <HelpCircleIcon width={16} height={16} />
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100">
                {t(item.qKey)}
              </span>
              <ChevronDownIcon
                width={18}
                height={18}
                className="mt-1 shrink-0 text-slate-500 transition group-open:rotate-180 dark:text-slate-400"
              />
            </summary>
            <div className="px-5 pb-5 pt-0 pl-16 -mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t(item.aKey)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
