import { getT } from "@/lib/t";
import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { ShortsCalcClient } from "./ShortsCalcClient";

export async function generateMetadata(): Promise<Metadata> {
  const t = getT("calculators.shorts.meta");
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({
      pathSuffix: "/youtube-shorts-calculator",
    }),
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      url: `/youtube-shorts-calculator`,
    },
  };
}

export default async function Page() {
  const t = getT("calculators.shorts");

  return (
    <SimpleCalcLayout
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      breadcrumbs={[
        { label: t("breadcrumb"), href: "/youtube-shorts-calculator" },
      ]}
      faq={[
        { q: t("faq.q1"), a: t("faq.a1") },
        { q: t("faq.q2"), a: t("faq.a2") },
      ]}
    >
      <ShortsCalcClient />
    </SimpleCalcLayout>
  );
}
