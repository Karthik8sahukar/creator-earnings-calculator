import { useT } from "@/lib/t";

import type { CreatorFaqEntry } from "@/lib/creatorFaq";

interface Props {
  entries: readonly CreatorFaqEntry[];
}

/**
 * Renders the creator FAQ block. The same entries are serialized
 * into a `FAQPage` JSON-LD payload by the route file so search
 * engines pick them up as rich results. Google requires the FAQ
 * body to be visible on the page (not hidden behind interactions),
 * so we render each Q + A eagerly rather than in a details/summary.
 */
export function CreatorFaqSection({ entries }: Props) {
  const t = useT("creator.faq");
  if (entries.length === 0) return null;

  return (
    <section
      aria-labelledby="creator-faq-title"
      className="card p-6 sm:p-8 space-y-4"
    >
      <h2
        id="creator-faq-title"
        className="text-xl font-semibold text-slate-900 dark:text-slate-100"
      >
        {t("title")}
      </h2>
      <dl className="space-y-5">
        {entries.map((e) => (
          <div key={e.question}>
            <dt className="font-medium text-slate-900 dark:text-slate-100">
              {e.question}
            </dt>
            <dd className="mt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {e.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
