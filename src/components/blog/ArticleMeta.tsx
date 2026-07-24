import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { findCategory } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";

/**
 * The compact author + date + reading time strip shown under the
 * article title. Also renders the category chip so readers see the
 * topic classification before diving in.
 */
export function ArticleMeta({ post }: { post: BlogPost }) {
  const t = useTranslations("blog");
  const tRoot = useTranslations();
  const category = findCategory(post.categoryId);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
      {category && (
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/blog/category/${category.slug}` as any}
          className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2.5 py-1 text-xs font-medium hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/20"
        >
          {tRoot(category.labelKey)}
        </Link>
      )}
      <span className="text-slate-700 dark:text-slate-300 font-medium">
        {post.author.name}
      </span>
      <span aria-hidden>·</span>
      <time dateTime={post.publishedDate}>
        {formatDateLong(post.publishedDate)}
      </time>
      {post.updatedDate && post.updatedDate !== post.publishedDate && (
        <>
          <span aria-hidden>·</span>
          <span className="text-xs">
            {t("article.updated", { date: formatDateLong(post.updatedDate) })}
          </span>
        </>
      )}
      <span aria-hidden>·</span>
      <span>{t("article.readingTime", { count: post.readingTimeMinutes })}</span>
    </div>
  );
}

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}
