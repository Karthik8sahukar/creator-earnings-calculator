import { useTranslations } from "next-intl";

import { SparklesIcon } from "@/components/icons";
import type { CreatorAchievement } from "@/lib/creators";

interface Props {
  achievements: CreatorAchievement[];
  creatorName: string;
}

/**
 * Renders a timeline of notable achievements/milestones for the creator.
 * Only displayed when achievements are available in the local dataset.
 */
export function CreatorAchievements({ achievements, creatorName }: Props) {
  const t = useTranslations("creator.achievements");

  if (achievements.length === 0) return null;

  return (
    <section aria-labelledby="creator-achievements-title" className="card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <SparklesIcon width={20} height={20} className="text-brand-600 dark:text-brand-300" />
        <h2
          id="creator-achievements-title"
          className="text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          {t("title", { name: creatorName })}
        </h2>
      </div>

      <ul className="mt-4 space-y-3">
        {achievements.map((a, i) => (
          <li
            key={`${a.year}-${i}`}
            className="flex items-start gap-3"
          >
            <span className="shrink-0 mt-0.5 inline-flex items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 w-8 h-8 text-xs font-bold text-brand-700 dark:text-brand-300">
              {String(a.year).slice(-2)}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {a.label}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {a.year}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
