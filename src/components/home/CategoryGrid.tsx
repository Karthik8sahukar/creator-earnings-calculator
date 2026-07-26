import { CategoryCard } from "@/components/ui/CategoryCard";
import { SectionHeader } from "@/components/AppShell";
import { getCategoriesWithCounts } from "@/lib/tools";
import { grid } from "@/lib/design-tokens";

/**
 * CategoryGrid — Responsive grid of category cards with dynamic tool counts.
 *
 * Layout:
 *   - Mobile: 2 columns
 *   - Tablet: 3 columns
 *   - Desktop: 4 columns
 *
 * Each card shows: emoji icon, category name, tool count badge,
 * short description, gradient background, and explore arrow.
 *
 * Counts are computed dynamically from the unified tool registry —
 * adding a tool to the registry automatically increments the count.
 *
 * Only categories with at least one tool are displayed.
 */
export function CategoryGrid() {
  const categories = getCategoriesWithCounts();

  return (
    <section id="categories" aria-labelledby="categories-title" className="scroll-mt-20">
      <SectionHeader
        title="Browse by Category"
        subtitle="Find the right tool for any task — organized by what you need."
        id="categories-title"
        centered
      />

      <div className={grid.categories}>
        {categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  );
}
