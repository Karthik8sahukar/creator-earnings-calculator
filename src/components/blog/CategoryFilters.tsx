import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { BLOG_CATEGORIES } from "@/lib/blog";

interface Props {
  /** Slug of the currently-active category, or undefined for "All". */
  activeSlug?: string;
}

/**
 * Horizontal scroll of category chips shown on the blog homepage and
 * on individual category pages. Server component — every chip is a
 * plain `<Link>`, no client-side state.
 */
export function CategoryFilters({ activeSlug }: Props) {
  const t = useTranslations();
  return (
    <nav
      aria-label={t("blog.categories.navLabel")}
      className="overflow-x-auto"
    >
      <ul className="flex items-center gap-2 pb-1">
        <li>
          <Link
            href="/blog"
            aria-current={!activeSlug ? "page" : undefined}
            className={`inline-block whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
              !activeSlug
                ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-slate-950"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {t("blog.categories.all")}
          </Link>
        </li>
        {BLOG_CATEGORIES.map((c) => {
          const isActive = c.slug === activeSlug;
          return (
            <li key={c.slug}>
              <Link
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                href={`/blog/category/${c.slug}` as any}
                aria-current={isActive ? "page" : undefined}
                className={`inline-block whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500 dark:text-slate-950"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {t(c.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
