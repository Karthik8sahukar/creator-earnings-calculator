import { getT } from "@/lib/t";
import type { Metadata } from "next";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { CpmCalcClient } from "./CpmCalcClient";

export async function generateMetadata({
  params,
}: {
  /* no params */;
}): Promise<Metadata> {
  const t = getT("calculators.cpm.meta");
  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates({
      pathSuffix: "/youtube-cpm-calculator",
    }),
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      url: `/youtube-cpm-calculator`,
    },
  };
}

export default async function Page({
  params,
}: {
  /* no params */;
}) {
  const t = getT("calculators.cpm");

  return (
    <SimpleCalcLayout
      eyebrow={t("eyebrow")}
      title={t("title")}
      intro={t("intro")}
      breadcrumbs={[
        { label: t("breadcrumb"), href: "/youtube-cpm-calculator" },
      ]}
      faq={[
        { q: t("faq.q1"), a: t("faq.a1") },
        { q: t("faq.q2"), a: t("faq.a2") },
        { q: t("faq.q3"), a: t("faq.a3") },
      ]}
    >
      <CpmCalcClient />
    </SimpleCalcLayout>
  );
}
