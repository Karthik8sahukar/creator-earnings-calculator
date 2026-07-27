import {
  CATEGORIES,
  getCountryBySlug,
  listCreatorsByCategory,
} from "@/data/creators";
import Link from "next/link";

interface Props {
  creatorSlug: string;
  category: string;
  countrySlug: string;
}

/**
 * Server component rendering internal links for SEO cross-linking:
 * related creators, category page, country page, and calculators.
 */
export function InternalLinks({ creatorSlug, category, countrySlug }: Props) {
  const related = listCreatorsByCategory(category)
    .filter((c) => c.slug !== creatorSlug)
    .slice(0, 6);

  const catMeta = CATEGORIES.find(
    (c) => c.label.toLowerCase() === category.toLowerCase(),
  );
  const countryMeta = getCountryBySlug(countrySlug);

  return (
    <aside className="space-y-6 border-t pt-6 mt-8">
      {related.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Related Creators
          </h2>
          <ul className="flex flex-wrap gap-2">
            {related.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/creator/${c.slug}`}
                  className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {catMeta && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Related Categories
          </h2>
          <Link
            href={`/creators/${catMeta.slug}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            All {catMeta.label} Creators
          </Link>
        </section>
      )}

      {countryMeta && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Country Page
          </h2>
          <Link
            href={`/creators/country/${countryMeta.slug}`}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Top {countryMeta.label} Creators
          </Link>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Calculators
        </h2>
        <ul className="flex flex-wrap gap-3">
          <li>
            <Link href="/youtube-rpm-calculator" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              RPM Calculator
            </Link>
          </li>
          <li>
            <Link href="/youtube-cpm-calculator" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              CPM Calculator
            </Link>
          </li>
          <li>
            <Link href="/youtube-shorts-calculator" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Shorts Calculator
            </Link>
          </li>
          <li>
            <Link href="/youtube-sponsorship-calculator" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Sponsorship Calculator
            </Link>
          </li>
        </ul>
      </section>
    </aside>
  );
}
