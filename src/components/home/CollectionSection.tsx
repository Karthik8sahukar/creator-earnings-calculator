import { ToolCard } from "@/components/ui/ToolCard";
import { HorizontalScroll, ScrollItem } from "@/components/ui/HorizontalScroll";
import { SectionHeader } from "@/components/AppShell";
import { getHomepageCollections, type ToolCollection } from "@/lib/tools";

/**
 * CollectionSection — Multiple horizontal-scroll collections for discovery.
 *
 * Each collection is a curated grouping of tools computed from the registry:
 *   - Best Creator Tools
 *   - Most Popular Developer Tools
 *   - Best Random & Decision Tools
 *   - Most Used Tools
 *
 * Design:
 *   - Each collection has a heading + description
 *   - Horizontal scrollable ToolCards (scroll-snap, touch-friendly)
 *   - Fade edge indicator on the right
 *   - Stacked vertically with generous spacing
 *   - Server component (no client JS needed)
 */
export function CollectionSection() {
  const collections = getHomepageCollections();

  return (
    <section aria-labelledby="collections-title" className="scroll-mt-20 space-y-14 sm:space-y-16">
      <SectionHeader
        title="Collections"
        subtitle="Curated tool sets for specific needs — pick a collection and explore."
        id="collections-title"
        centered
      />

      {collections.map((collection) => (
        <CollectionRow key={collection.id} collection={collection} />
      ))}
    </section>
  );
}

// ─── Single Collection Row ──────────────────────────────────────────

function CollectionRow({ collection }: { collection: ToolCollection }) {
  if (collection.tools.length === 0) return null;

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
          {collection.title}
        </h3>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {collection.description}
        </p>
      </div>

      <HorizontalScroll label={collection.title}>
        {collection.tools.map((tool) => (
          <ScrollItem key={tool.slug} className="w-[260px] sm:w-[280px]">
            <ToolCard tool={tool} variant="standard" />
          </ScrollItem>
        ))}
      </HorizontalScroll>
    </div>
  );
}
