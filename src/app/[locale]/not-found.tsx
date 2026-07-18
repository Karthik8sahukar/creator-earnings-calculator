import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

/**
 * Locale-aware 404.
 *
 * `not-found.tsx` under a segment cannot receive route params directly,
 * so we resolve translations via `getTranslations()` which reads the
 * active locale from the request context.
 */
export default async function NotFound() {
  const t = await getTranslations("notFound");
  const tCommon = await getTranslations("common.actions");
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-brand-600">{t("code")}</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-2 text-slate-600">{t("body")}</p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        {tCommon("backToHome")}
      </Link>
    </div>
  );
}
