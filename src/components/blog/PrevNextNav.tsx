import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import type { BlogPost } from "@/lib/blog";

interface Props {
  prev?: BlogPost;
  next?: BlogPost;
}

/**
 * "Previous / Next article" navigation. `prev` is the older article
 * (renders left), `next` is the newer one (renders right).
 */
export function PrevNextNav({ prev, next }: Props) {
  const t = useTranslations("blog.article");
  if (!prev && !next) return null;

  return (
    <nav
      aria-label={t("prevNextLabel")}
      className="grid gap-3 sm:grid-cols-2 not-prose"
    >
      {prev ? (
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/blog/${prev.slug}` as any}
          rel="prev"
          className="card p-4 sm:p-5 hover:-translate-y-0.5 transition"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            ← {t("prevArticle")}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
            {prev.title}
          </p>
        </Link>
      ) : (
        <span aria-hidden />
      )}
      {next ? (
        <Link
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          href={`/blog/${next.slug}` as any}
          rel="next"
          className="card p-4 sm:p-5 hover:-translate-y-0.5 transition sm:text-right"
        >
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t("nextArticle")} →
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
            {next.title}
          </p>
        </Link>
      ) : (
        <span aria-hidden />
      )}
    </nav>
  );
}
