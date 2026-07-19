import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Not-found boundary for the entire `/[locale]/creator/*` subtree.
 *
 * This file lives ONE level above `[slug]/` on purpose. With
 * `dynamicParams = false` on the slug page, Next.js does not treat
 * an unknown slug as a matched segment — it never enters `[slug]/`
 * and therefore never renders a `not-found.tsx` located inside that
 * segment. Instead, Next walks up the tree until it finds a
 * `not-found.tsx`, and this file is the first one it hits.
 *
 * With this file present:
 *
 *   Unknown creator slug -> HTTP 404 + this "Creator not found" UI
 *   (previously fell through to /[locale]/not-found.tsx which
 *   rendered the generic "Page not found" heading — see PR #12
 *   Playwright regression).
 *
 * This file also serves as the fallback for any `notFound()` calls
 * that fire from within `[slug]/page.tsx` (e.g. the defensive check
 * in `generateMetadata`) because there is no closer boundary.
 */
export default async function CreatorNotFound() {
  const t = await getTranslations("creator.notFound");
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-300">
        {t("code")}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
        {t("title")}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        {t("body")}
      </p>
      <Link href="/creators" className="btn-primary mt-6 inline-flex">
        {t("browseAll")}
      </Link>
    </div>
  );
}
