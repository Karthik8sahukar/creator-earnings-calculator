import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolCard } from "@/components/ui/ToolCard";
import { SectionHeader } from "@/components/AppShell";
import Link from "next/link";
import { publicConfig } from "@/lib/config";
import { buildAlternates } from "@/lib/i18nMetadata";
import { getCategoryDef, TOOL_CATEGORIES } from "@/lib/tools/categories";
import { getToolsByCategory } from "@/lib/tools/registry";
import type { ToolCategoryId } from "@/lib/tools/registry";
import { grid } from "@/lib/design-tokens";

/**
 * Tool Category Page: `/[locale]/tools/[category]`
 *
 * Displays all tools belonging to a specific category from the unified
 * tool registry. Fully dynamic — adding a tool to the registry
 * automatically appears on the relevant category page.
 */

export const runtime = "nodejs";

interface RouteParams {
  locale: string;
  category: string;
}

export function generateStaticParams() {
  const params: RouteParams[] = [];
    for (const cat of TOOL_CATEGORIES) {
      params.push({ category: cat.id });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategoryDef(category as ToolCategoryId);
  if (!cat) return {};

  const tools = getToolsByCategory(category as ToolCategoryId);
  const title = `${cat.label} — ${tools.length} Free Online Tools`;
  const description = cat.description;

  return {
    title,
    description,
    alternates: buildAlternates({ pathSuffix: `/tools/${category}` }),
    openGraph: {
      title,
      description,
      url: `${publicConfig.siteUrl}/tools/${category}`,
      siteName: publicConfig.siteName,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ToolCategoryPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { category } = await params;

  const cat = getCategoryDef(category as ToolCategoryId);
  if (!cat) notFound();

  const tools = getToolsByCategory(category as ToolCategoryId);

  return (
    <div className="space-y-10">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">Home</Link>
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden>&rsaquo;</span>
            <span className="text-slate-700 dark:text-slate-300">{cat.label}</span>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <SectionHeader
        title={cat.label}
        subtitle={`${cat.description} ${tools.length} tools available.`}
        id="category-title"
      />

      {/* Tool grid */}
      {tools.length > 0 ? (
        <ul className={grid.tools}>
          {tools.map((tool) => (
            <li key={tool.slug}>
              <ToolCard tool={tool} variant="standard" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-12 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tools in this category yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
