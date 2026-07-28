import { getT } from "@/lib/t";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import Image from "next/image";
import { notFound } from "next/navigation";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { ArticleMeta } from "@/components/blog/ArticleMeta";
import { BlogBreadcrumbs } from "@/components/blog/BlogBreadcrumbs";
import { blogMdxComponents } from "@/components/blog/MdxComponents";
import { PrevNextNav } from "@/components/blog/PrevNextNav";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { TableOfContents } from "@/components/blog/TableOfContents";
import {
  findCategory,
  findRelatedPosts,
  getAdjacentPosts,
  loadPostBySlug,
  loadPosts,
} from "@/lib/blog";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";

// Pre-render every English article at build time so first paint is
// static HTML with rich metadata already resolved.
export async function generateStaticParams() {
  const posts = await loadPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
  }: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPostBySlug(slug);
  if (!post) {
    // Rendering 404 metadata prevents an SEO surface for missing slugs.
    return { title: "Not found", robots: { index: false, follow: true } };
  }

  const canonicalSuffix = `/blog/${post.slug}`;
  const alternates = buildAlternates({ pathSuffix: canonicalSuffix });

  // Non-English article pages render the "coming soon" notice — mark
  // them noindex so search engines send readers to the English
  // canonical URL rather than the placeholder.

  return {
    title: post.title,
    description: post.description,
    authors: [{ name: post.author.name }],
    keywords: post.tags,
    alternates,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: `${publicConfig.siteUrl}${canonicalSuffix}`,
      publishedTime: post.publishedDate,
      modifiedTime: post.updatedDate ?? post.publishedDate,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.featuredImage,
          alt: post.featuredImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [post.featuredImage],
    },
    robots: { index: true, follow: true },
  };
}

export default async function BlogArticlePage({
  params,
  }: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await loadPostBySlug(slug);
  if (!post) notFound();

  const t = getT("blog");
  const category = findCategory(post.categoryId);

  // Non-English readers see the "coming soon" notice AND a preview of
  // the English article (title, meta, breadcrumbs) so they know what
  // the page will contain once translated.

  const shareUrl = `${publicConfig.siteUrl}/blog/${post.slug}`;

  // JSON-LD payload — Article + BreadcrumbList schemas.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.description,
      image: [post.featuredImage],
      datePublished: post.publishedDate,
      dateModified: post.updatedDate ?? post.publishedDate,
      author: {
        "@type": "Person",
        name: post.author.name,
      },
      publisher: {
        "@type": "Organization",
        name: publicConfig.siteName,
        // We do not currently ship a logo file suitable for schema
        // (needs 60x600 min per Google). Omitted rather than lied about.
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": shareUrl,
      },
      keywords: post.tags.join(", "),
      inLanguage: "en",
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("meta.breadcrumbHome"),
          item: `${publicConfig.siteUrl}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("meta.breadcrumbBlog"),
          item: `${publicConfig.siteUrl}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: shareUrl,
        },
      ],
    },
  ];

  return (
    <article className="max-w-6xl mx-auto">
      {/* JSON-LD is emitted as an inline script rather than via <Script>
          because the payload is fully server-computed and static —
          there is no benefit to deferring its parse to after-hydration. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <BlogBreadcrumbs
        crumbs={[
          { labelKey: "nav.home", href: "/" },
          { labelKey: "blog.meta.breadcrumbBlog", href: "/blog" },
          ...(category
            ? [{ labelKey: category.labelKey, href: `/blog/category/${category.slug}` }]
            : []),
          { label: post.title },
        ]}
      />

      <header className="mt-4 space-y-4 not-prose">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
          {post.title}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          {post.description}
        </p>
        <ArticleMeta post={post} />
      </header>

      <div className="mt-8 relative aspect-[16/9] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800">
        <Image
          src={post.featuredImage}
          alt={post.featuredImageAlt}
          fill
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          <div className="min-w-0">
            <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-a:text-brand-700 dark:prose-a:text-brand-300 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
              <MDXRemote
                source={post.content}
                components={blogMdxComponents}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [
                      rehypeSlug,
                      [
                        rehypeAutolinkHeadings,
                        {
                          behavior: "wrap",
                          properties: { className: ["heading-anchor"] },
                        },
                      ],
                    ],
                  },
                }}
              />
            </div>

            <div className="mt-10 not-prose">
              <ShareButtons url={shareUrl} title={post.title} />
            </div>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents entries={post.toc} />
            </div>
          </aside>
        </div>

      <div className="mt-12">
        <PrevNextNav {...(await getAdjacentPosts(post.slug))} />
      </div>
      <div className="mt-16">
        <RelatedArticles
          posts={findRelatedPosts(post, await loadPosts(), 3)}
        />
      </div>
    </article>
  );
}
