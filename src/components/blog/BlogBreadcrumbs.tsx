import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

interface Crumb {
  labelKey?: string;
  label?: string;
  href?: string;
}

/**
 * Client-visible breadcrumb. A matching JSON-LD BreadcrumbList is
 * emitted from the individual article page (see `[slug]/page.tsx`).
 */
export function BlogBreadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  const t = useTranslations();
  return (
    <nav
      aria-label={t("channelPage.breadcrumbAria")}
      className="text-xs text-slate-500 dark:text-slate-400"
    >
      <ol className="flex flex-wrap items-center gap-1">
        {crumbs.map((c, i) => {
          const label = c.labelKey ? t(c.labelKey) : (c.label ?? "");
          const isLast = i === crumbs.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden>›</span>}
              {c.href && !isLast ? (
                <Link
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  href={c.href as any}
                  className="hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "text-slate-800 dark:text-slate-200" : ""}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
