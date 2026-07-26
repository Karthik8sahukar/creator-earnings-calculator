import { getTranslations, setRequestLocale } from "next-intl/server";

import { ToolLayout, ToolJsonLd } from "@/components/engine";
import { createToolMetadata } from "@/lib/engine";
import { RpmCalcClient } from "./RpmCalcClient";

const SLUG = "youtube-rpm-calculator";

/**
 * Metadata — uses the engine's createToolMetadata factory.
 * Overrides title/description with i18n translations.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calculators.rpm.meta" });

  // Use the engine factory with i18n overrides
  const generate = createToolMetadata(SLUG, {
    title: t("title"),
    description: t("description"),
  });

  return generate({ params });
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculators.rpm" });

  const faq = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
  ];

  return (
    <>
      <ToolLayout
        slug={SLUG}
        title={t("title")}
        intro={t("intro")}
        eyebrow={t("eyebrow")}
        faq={faq}
      >
        <RpmCalcClient />
      </ToolLayout>
      <ToolJsonLd slug={SLUG} locale={locale} faq={faq} />
    </>
  );
}
