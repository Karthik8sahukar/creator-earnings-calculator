import { getTranslations } from "next-intl/server";

/**
 * Loading skeleton for `/creator/[slug]`. Mirrors the pattern in
 * `/channel/[channelId]/loading.tsx` — `.card` blocks with `.skeleton`
 * children and an `aria-live` region so screen readers announce the
 * transition.
 */
export default async function CreatorLoading() {
  const t = await getTranslations("creator.loading");
  return (
    <div className="space-y-8" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t("srLabel")}</span>

      <div className="card overflow-hidden" aria-hidden>
        <div className="skeleton h-32 sm:h-44 w-full" />
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 -mt-14 sm:-mt-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-5">
            <div className="skeleton h-28 w-28 sm:h-32 sm:w-32 rounded-full" />
            <div className="flex-1 space-y-3 w-full">
              <div className="skeleton h-8 w-1/3" />
              <div className="skeleton h-3 w-1/4" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <div className="card p-6" aria-hidden>
        <div className="skeleton h-4 w-1/4 mb-4" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="card p-6" aria-hidden>
        <div className="skeleton h-4 w-1/4 mb-4" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
