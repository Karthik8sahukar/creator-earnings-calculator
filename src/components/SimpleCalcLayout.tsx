import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { ToolPageActions } from "@/components/ui/ToolPageActions";

interface Props {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  faq?: { q: string; a: string }[];
  breadcrumbs?: { label: string; href: string }[];
  /** Tool slug for visit tracking and favorites. */
  toolSlug?: string;
}

export function SimpleCalcLayout({
  eyebrow,
  title,
  intro,
  children,
  faq,
  breadcrumbs,
  toolSlug,
}: Props) {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {breadcrumbs && (
        <nav
          aria-label={t("channelPage.breadcrumbAria")}
          className="text-xs text-slate-500"
        >
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-slate-900">
                {t("common.breadcrumbs.home")}
              </Link>
            </li>
            {breadcrumbs.map((b) => (
              <li key={b.href} className="flex items-center gap-1">
                <span aria-hidden>›</span>
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={b.href as any}
                  className="hover:text-slate-900"
                >
                  {b.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      )}

      <header className="space-y-3 text-center sm:text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium">
              {eyebrow}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              {title}
            </h1>
          </div>
          {toolSlug && <ToolPageActions slug={toolSlug} title={title} />}
        </div>
        <p className="text-slate-600 max-w-2xl">{intro}</p>
      </header>

      {children}

      {faq && faq.length > 0 && (
        <section
          aria-labelledby="faq-title"
          className="card p-6 sm:p-8 space-y-4"
        >
          <h2 id="faq-title" className="text-xl font-semibold text-slate-900">
            {t("calculators.shared.faqTitle")}
          </h2>
          <dl className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <dt className="font-medium text-slate-900">{item.q}</dt>
                <dd className="mt-1 text-sm text-slate-600">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
