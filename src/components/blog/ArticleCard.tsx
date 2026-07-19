import Image from "next/image";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { findCategory } from "@/lib/blog";
import type { BlogPost } from "@/lib/blog";

interface Props {
  post: BlogPost;
  /** When `featured`, the card renders larger with a bigger hero image. */
  featured?: boolean;
}

/**
 * A single article summary card. Used across the blog homepage,
 * category pages, tag pages, and the "Related articles" section.
 * The `featured` variant is only rendered on the blog homepage.
 */
export function ArticleCard({ post, featured = false }: Props) {
  // Two scopes: the article-body strings live under `blog.article.*`
  // so we scope `t` there; the category label keys in
  // `src/lib/blog/categories.ts` are already fully-qualified
  // (`blog.categories.<id>.label`), so they need a root-scoped
  // translator — otherwise the lookup double-prefixes to
  // `blog.blog.categories.<id>.label` and rings a MISSING_MESSAGE.
  const t = useTranslations("blog");
  const tRoot = useTranslations();
  const category = findCategory(post.categoryId);

  return (
    <article
      className={`card group overflow-hidden flex flex-col transition duration-200 hover:-translate-y-0.5 hover:shadow-pop ${
        featured ? "lg:flex-row" : ""
      }`}
    >
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={`/blog/${post.slug}` as any}
        className={`relative block bg-slate-100 dark:bg-slate-800 ${
          featured ? "aspect-[16/10] lg:aspect-auto lg:w-1/2" : "aspect-[16/9]"
        }`}
      >
        <Image
          src={post.featuredImage}
          alt={post.featuredImageAlt}
          fill
          sizes={featured ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 640px) 50vw, 100vw"}
          className="object-cover transition group-hover:scale-[1.02]"
        />
      </Link>

      <div
        className={`flex-1 p-5 sm:p-6 flex flex-col ${
          featured ? "lg:p-8" : ""
        }`}
      >
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {category && (
            <Link
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              href={`/blog/category/${category.slug}` as any}
              className="inline-flex items-center rounded-full bg-brand-50 text-brand-700 px-2.5 py-1 font-medium hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-200 dark:hover:bg-brand-500/20"
            >
              {tRoot(category.labelKey)}
            </Link>
          )}
          <span aria-hidden>·</span>
          <span>{t("article.readingTime", { count: post.readingTimeMinutes })}</span>
        </div>

        <h3
          className={`mt-3 font-semibold text-slate-900 dark:text-slate-50 leading-snug ${
            featured ? "text-2xl sm:text-3xl" : "text-lg"
          }`}
        >
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            href={`/blog/${post.slug}` as any}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 rounded-md"
          >
            {post.title}
          </Link>
        </h3>

        <p
          className={`mt-2 text-slate-600 dark:text-slate-300 leading-relaxed ${
            featured ? "text-base" : "text-sm"
          } line-clamp-3`}
        >
          {post.description}
        </p>

        <div className="mt-auto pt-4 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {post.author.name}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={post.publishedDate}>
            {formatDateShort(post.publishedDate)}
          </time>
        </div>
      </div>
    </article>
  );
}

/** Short, locale-agnostic date format for card meta. */
function formatDateShort(iso: string): string {
  // Uses en-US month names because the underlying date is not
  // locale-negotiated — the source content is English. When we
  // ship non-EN article translations we'll swap this for
  // `useFormatter().dateTime(...)`.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}
