import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

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
