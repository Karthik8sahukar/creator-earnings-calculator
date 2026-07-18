import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

export default async function ChannelNotFound() {
  const t = await getTranslations("channelPage");
  const tCommon = await getTranslations("common.actions");
  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-brand-600">{t("notFoundCode")}</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-2 text-slate-600 max-w-md mx-auto">
        {t("notFoundBody")}
      </p>
      <Link href="/" className="btn-primary mt-6 inline-flex">
        {tCommon("backToSearch")}
      </Link>
    </div>
  );
}
