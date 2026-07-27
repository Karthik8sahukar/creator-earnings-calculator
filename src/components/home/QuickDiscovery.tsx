"use client";

import { useState } from "react";

import { ToolCard } from "@/components/ui/ToolCard";
import { HorizontalScroll, ScrollItem } from "@/components/ui/HorizontalScroll";
import { Star, Sparkles, Trophy } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/AppShell";
import { getPopularTools, getFeaturedTools, getToolBySlug, TOOL_REGISTRY, type ToolEntry } from "@/lib/tools";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentTools } from "@/hooks/useRecentTools";

// ─── Inline Icons for new tabs ──────────────────────────────────────

function HeartIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function ClockIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ─── Tab Definitions ────────────────────────────────────────────────

type TabId = "popular" | "featured" | "recent" | "recommended" | "favorites" | "recent-used";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  /** Static tabs return tools directly. Dynamic tabs are handled separately. */
  getTools?: () => ToolEntry[];
  /** Whether this tab depends on client-side hooks (favorites/recent). */
  dynamic?: boolean;
}

const STATIC_TABS: TabDef[] = [
  {
    id: "popular",
    label: "Popular",
    icon: <Star size={14} />,
    getTools: () => getPopularTools().slice(0, 12),
  },
  {
    id: "featured",
    label: "Featured",
    icon: <Sparkles size={14} />,
    getTools: () => getFeaturedTools().slice(0, 12),
  },
  {
    id: "recent",
    label: "Recently Added",
    icon: <Sparkles size={14} />,
    getTools: () => {
      const withDate = TOOL_REGISTRY.filter((t) => t.analytics?.launchDate);
      if (withDate.length >= 4) {
        return [...withDate]
          .sort((a, b) =>
            (b.analytics?.launchDate ?? "").localeCompare(a.analytics?.launchDate ?? ""),
          )
          .slice(0, 12);
      }
      return TOOL_REGISTRY.slice(-12).reverse();
    },
  },
  {
    id: "recommended",
    label: "Recommended",
    icon: <Trophy size={14} />,
    getTools: () => {
      const seen = new Set<string>();
      const result: ToolEntry[] = [];
      const sources = [...getPopularTools(), ...getFeaturedTools()];
      for (const tool of sources) {
        if (!seen.has(tool.slug)) {
          seen.add(tool.slug);
          result.push(tool);
        }
        if (result.length >= 12) break;
      }
      return result;
    },
  },
];

const DYNAMIC_TABS: TabDef[] = [
  {
    id: "favorites",
    label: "Favorites",
    icon: <HeartIcon size={14} />,
    dynamic: true,
  },
  {
    id: "recent-used",
    label: "Recent",
    icon: <ClockIcon size={14} />,
    dynamic: true,
  },
];

const ALL_TABS: TabDef[] = [...STATIC_TABS, ...DYNAMIC_TABS];

// ─── Component ──────────────────────────────────────────────────────

/**
 * QuickDiscovery — Tabbed horizontal scroll section showing tool cards.
 *
 * Tabs: Popular | Featured | Recently Added | Recommended | Favorites | Recent
 *
 * Static tabs pull data from the tool registry using real flags.
 * Dynamic tabs (Favorites, Recent) use localStorage hooks and resolve
 * slugs through the registry, ignoring stale/invalid slugs.
 *
 * Empty states shown when Favorites/Recent have no items.
 */
export function QuickDiscovery() {
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const { favorites } = useFavorites();
  const { recentSlugs } = useRecentTools();

  // Resolve tools based on active tab
  const getActiveTools = (): ToolEntry[] => {
    if (activeTab === "favorites") {
      // Resolve slugs to ToolEntry objects, skipping stale slugs
      return favorites
        .map((slug) => getToolBySlug(slug))
        .filter((t): t is ToolEntry => t !== undefined)
        .slice(0, 12);
    }

    if (activeTab === "recent-used") {
      return recentSlugs
        .map((slug) => getToolBySlug(slug))
        .filter((t): t is ToolEntry => t !== undefined)
        .slice(0, 12);
    }

    const tabDef = STATIC_TABS.find((t) => t.id === activeTab) ?? STATIC_TABS[0];
    return tabDef.getTools?.() ?? [];
  };

  const tools = getActiveTools();
  const activeDef = ALL_TABS.find((t) => t.id === activeTab) ?? ALL_TABS[0];

  // Determine empty state
  const isEmpty = tools.length === 0 && (activeTab === "favorites" || activeTab === "recent-used");

  return (
    <section aria-labelledby="quick-discovery-title" className="scroll-mt-20">
      <SectionHeader
        title="Discover Tools"
        subtitle="Browse by what matters to you."
        id="quick-discovery-title"
      />

      {/* Tab switcher */}
      <div role="tablist" aria-label="Discovery filter" className="flex items-center gap-1.5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {ALL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-brand-600 text-white shadow-sm dark:bg-brand-500"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Horizontal scroll of tool cards OR empty state */}
      {isEmpty ? (
        <EmptyState tab={activeTab} />
      ) : tools.length > 0 ? (
        <HorizontalScroll label={`${activeDef.label} tools`}>
          {tools.map((tool) => (
            <ScrollItem key={tool.slug} className="w-[260px] sm:w-[280px]">
              <ToolCard tool={tool} variant="standard" />
            </ScrollItem>
          ))}
        </HorizontalScroll>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">No tools in this category yet.</p>
        </div>
      )}
    </section>
  );
}

// ─── Empty States ───────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabId }) {
  if (tab === "favorites") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
        <div className="mx-auto w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
          <HeartIcon size={20} />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No favorites yet</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Select the heart on any tool to keep it here.
        </p>
      </div>
    );
  }

  if (tab === "recent-used") {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
        <div className="mx-auto w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
          <ClockIcon size={20} />
        </div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No recently used tools</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Open a tool and it will appear here.
        </p>
      </div>
    );
  }

  return null;
}
