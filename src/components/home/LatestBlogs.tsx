
import Link from "next/link";

/**
 * Latest blog posts section on the homepage.
 * Shows the most recent blog articles from the content/blog directory.
 * Uses static data from the MDX frontmatter.
 */

interface BlogPreview {
  slug: string;
  title: string;
  description: string;
  category: string;
}

/**
 * Curated blog previews derived from actual content/blog/*.mdx files.
 * This avoids needing to read the filesystem at render time.
 */
const BLOG_PREVIEWS: BlogPreview[] = [
  {
    slug: "how-much-does-youtube-pay-per-1000-views",
    title: "How Much Does YouTube Pay Per 1,000 Views?",
    description: "A detailed breakdown of YouTube RPM rates by country, niche, and content type in 2026.",
    category: "Monetization",
  },
  {
    slug: "youtube-cpm-vs-rpm-explained",
    title: "YouTube CPM vs RPM Explained",
    description: "Understanding the difference between CPM and RPM — and why it matters for your earnings.",
    category: "Education",
  },
  {
    slug: "best-youtube-niches-for-revenue",
    title: "Best YouTube Niches for Revenue",
    description: "Which content categories earn the most per view? A data-driven analysis of niche RPM rates.",
    category: "Strategy",
  },
  {
    slug: "how-much-does-mrbeast-make",
    title: "How Much Does MrBeast Make?",
    description: "Estimating MrBeast's YouTube earnings from ads, sponsorships, and business ventures.",
    category: "Creator Spotlight",
  },
  {
    slug: "youtube-shorts-monetization-guide",
    title: "YouTube Shorts Monetization Guide",
    description: "Everything you need to know about earning money from YouTube Shorts in 2026.",
    category: "Monetization",
  },
  {
    slug: "how-sponsorship-pricing-works",
    title: "How Sponsorship Pricing Works",
    description: "A transparent look at how YouTube sponsorship deals are priced and negotiated.",
    category: "Business",
  },
];

export async function LatestBlogs() {
  const t = await getTranslations("home.latestBlogs");

  return (
    <section aria-labelledby="latest-blogs-title">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <p className="label">{t("eyebrow")}</p>
          <h2
            id="latest-blogs-title"
            className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
          >
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>
        <Link
          href="/blog"
          className="btn-secondary text-sm"
        >
          {t("viewAll")}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_PREVIEWS.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}` as `/blog/${string}`}
            className="group card block p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop"
          >
            <span className="chip text-[10px]">{post.category}</span>
            <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {post.description}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
              {t("readMore")}
              <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
