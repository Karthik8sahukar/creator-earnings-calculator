import { useTranslations } from "next-intl";

import { CreatorCard } from "./CreatorCard";
import type { Creator } from "@/lib/creators";

interface Props {
  creators: readonly Creator[];
  /**
   * `slug → avatarUrl | null` map resolved server-side by the
   * parent route. Optional — when omitted, every card renders its
   * initial fallback.
   */
  avatars?: Record<string, string | null>;
}

export function RelatedCreators({ creators, avatars }: Props) {
  const t = useTranslations("creator.relatedCreators");
  if (creators.length === 0) return null;

  return (
    <section aria-labelledby="creator-related-creators" className="space-y-4">
      <div>
        <p className="label">{t("eyebrow")}</p>
        <h2
          id="creator-related-creators"
          className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title")}
        </h2>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {creators.map((c) => (
          <li key={c.slug}>
            <CreatorCard
              creator={c}
              avatarUrl={avatars?.[c.slug] ?? null}
              testId={`related-creator-${c.slug}`}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
