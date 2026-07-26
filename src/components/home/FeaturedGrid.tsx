import { ToolCard } from "@/components/ui/ToolCard";
import { SectionHeader } from "@/components/AppShell";
import { getFeaturedMixed } from "@/lib/tools";
import { grid } from "@/lib/design-tokens";

/**
 * FeaturedGrid — Mixed-category featured tools displayed in a responsive grid.
 *
 * Pulls 8 tools from getFeaturedMixed() which combines featured + popular
 * across ALL categories — ensuring diversity (not just creator tools).
 *
 * Layout:
 *   - Mobile: 1 column
 *   - Tablet: 2 columns
 *   - Desktop: 3 columns
 *   - XL: 4 columns
 *
 * The first tool renders as a "featured" variant (larger card),
 * the rest render as "standard" cards.
 */
export function FeaturedGrid() {
  const tools = getFeaturedMixed(8);
  const [first, ...rest] = tools;

  return (
    <section aria-labelledby="featured-title" className="scroll-mt-20">
      <SectionHeader
        title="Featured Tools"
        subtitle="Hand-picked tools that our users love across every category."
        id="featured-title"
      />

      {/* Featured (flagship) card — full width */}
      {first && (
        <div className="mb-5">
          <ToolCard tool={first} variant="featured" />
        </div>
      )}

      {/* Remaining tools in standard grid */}
      <ul className={grid.tools}>
        {rest.map((tool) => (
          <li key={tool.slug}>
            <ToolCard tool={tool} variant="standard" />
          </li>
        ))}
      </ul>
    </section>
  );
}
