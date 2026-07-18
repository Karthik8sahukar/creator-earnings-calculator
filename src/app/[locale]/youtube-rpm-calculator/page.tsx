import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { RpmCalcClient } from "./RpmCalcClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculators.rpm.meta" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({
      locale,
      pathSuffix: "/youtube-rpm-calculator",
    }),
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      url: `/${locale}/youtube-rpm-calculator`,
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.rpm" });

  return (
    <SimpleCalcLayout
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      breadcrumbs={[
        { label: t("breadcrumb"), href: "/youtube-rpm-calculator" },
      ]}
      faq={[
        { q: t("faq.q1"), a: t("faq.a1") },
        { q: t("faq.q2"), a: t("faq.a2") },
        { q: t("faq.q3"), a: t("faq.a3") },
      ]}
    >
      <RpmCalcClient />
    </SimpleCalcLayout>
  );
}
