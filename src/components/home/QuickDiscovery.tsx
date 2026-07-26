"use client";

import { useState } from "react";

import { ToolCard } from "@/components/ui/ToolCard";
import { HorizontalScroll, ScrollItem } from "@/components/ui/HorizontalScroll";
import { Star, Sparkles, Trophy } from "@/components/ui/Icon";
import { SectionHeader } from "@/components/AppShell";
import { getPopularTools, getFeaturedTools, TOOL_REGISTRY, type ToolEntry } from "@/lib/tools";

// ─── Tab Definitions ────────────────────────────────────────────────

type TabId = "popular" | "featured" | "recent" | "recommended";

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  getTools: () => ToolEntry[];
}

const TABS: TabDef[] = [
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
      // Tools with analytics.launchDate, or fallback to last items in registry
      const withDate = TOOL_REGISTRY.filter((t) => t.analytics?.launchDate);
      if (withDate.length >= 4) {
        return [...withDate]
          .sort((a, b) =>
            (b.analytics?.launchDate ?? "").localeCompare(a.analytics?.launchDate ?? ""),
          )
          .slice(0, 12);
      }
      // Fallback: last 12 tools in registry order (newest additions are appended)
      return TOOL_REGISTRY.slice(-12).reverse();
    },
  },
  {
    id: "recommended",
    label: "Recommended",
    icon: <Trophy size={14} />,
    getTools: () => {
      // Mix of popular + featured, deduped, diversity across categories
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

// ─── Component ──────────────────────────────────────────────────────

/**
 * QuickDiscovery — Tabbed horizontal scroll section showing tool cards.
 *
 * Tabs: Popular | Featured | Recently Added | Recommended
 *
 * Each tab pulls data from the tool registry using real flags
 * (popular, featured) rather than fake "trending" labels.
 *
 * Design:
 *   - Pill-shaped tab switcher
 *   - Horizontal scrollable tool cards (scroll-snap)
 *   - Smooth tab transitions
 *   - Mobile: swipeable cards
 *   - Desktop: visible overflow with fade edge
 */
export function QuickDiscovery() {
  const [activeTab, setActiveTab] = useState<TabId>("popular");
  const activeDef = TABS.find((t) => t.id === activeTab) ?? TABS[0];
  const tools = activeDef.getTools();

  return (
    <section aria-labelledby="quick-discovery-title" className="scroll-mt-20">
      <SectionHeader
        title="Discover Tools"
        subtitle="Browse by what matters to you."
        id="quick-discovery-title"
      />

      {/* Tab switcher */}
      <div role="tablist" aria-label="Discovery filter" className="flex items-center gap-1.5 mb-6 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map((tab) => (
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

      {/* Horizontal scroll of tool cards */}
      {tools.length > 0 ? (
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
