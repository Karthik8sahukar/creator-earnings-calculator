import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DecisionRelatedTools } from "./DecisionRelatedTools";

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  faq?: FaqItem[];
  breadcrumbs?: BreadcrumbItem[];
  /** The path of the current tool (e.g. "/spin-the-wheel") for related tools exclusion. */
  currentToolPath: string;
}

/**
 * Shared layout for all Decision Tools pages.
 *
 * Section order:
 *   1. Breadcrumbs
 *   2. Hero header (eyebrow + H1 + intro)
 *   3. Children (the interactive tool)
 *   4. Related Decision Tools (automatic, excludes current)
 *   5. FAQ
 */
export function DecisionLayout({
  eyebrow,
  title,
  intro,
  children,
  faq,
  breadcrumbs,
  currentToolPath,
}: Props) {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {breadcrumbs && (
        <nav
          aria-label={t("channelPage.breadcrumbAria")}
          className="text-xs text-slate-500 dark:text-slate-400"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">
                {t("common.breadcrumbs.home")}
              </Link>
            </li>
            {breadcrumbs.map((b) => (
              <li key={b.href} className="flex items-center gap-1">
                <span aria-hidden>&rsaquo;</span>
                <Link
                  href={b.href as never}
                  className="hover:text-slate-900 dark:hover:text-slate-100"
                >
                  {b.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <header className="space-y-3 text-center sm:text-left">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium dark:bg-brand-500/10 dark:text-brand-200">
          {eyebrow}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">{intro}</p>
      </header>

      {children}

      <DecisionRelatedTools currentTool={currentToolPath} />

      {faq && faq.length > 0 && (
        <section aria-labelledby="faq-title" className="card p-6 sm:p-8 space-y-4">
          <h2 id="faq-title" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            FAQ
          </h2>
          <dl className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-slate-900 dark:text-slate-100">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
