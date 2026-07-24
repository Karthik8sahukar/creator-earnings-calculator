import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

import { SimpleCalcLayout } from "@/components/SimpleCalcLayout";
import { buildAlternates } from "@/lib/i18nMetadata";
import { MembershipCalcClient } from "./MembershipCalcClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = "YouTube Membership Revenue Calculator — Free Tool";
  const description = "Estimate your potential YouTube channel membership revenue based on subscribers, membership conversion rate, and pricing tiers.";
  return {
    title,
    description,
    alternates: buildAlternates({ locale, pathSuffix: "/youtube-membership-calculator" }),
    openGraph: { title, description, url: `/${locale}/youtube-membership-calculator` },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <SimpleCalcLayout
      eyebrow="Calculator · Memberships"
      title="YouTube Membership Revenue Calculator"
      intro="Estimate revenue from YouTube channel memberships. YouTube takes approximately 30% of membership revenue (same as Apple/Google for in-app purchases). This calculator shows both gross and net figures."
      breadcrumbs={[{ label: "Membership calculator", href: "/youtube-membership-calculator" }]}
      faq={[
        { q: "How much does YouTube take from memberships?", a: "YouTube takes approximately 30% of channel membership revenue. So if a member pays $4.99/month, you receive about $3.49. This is comparable to Apple and Google's in-app purchase cuts." },
        { q: "What percentage of subscribers become members?", a: "Typically 0.5-3% of subscribers convert to paid members. Highly engaged communities (gaming, education) tend to see higher rates. The key driver is offering genuine exclusive value." },
        { q: "What's the best membership price?", a: "Most successful creators offer tiers between $2.99-$9.99. The most popular tier is usually $4.99. Having multiple tiers (e.g., $2.99, $4.99, $9.99) captures different willingness-to-pay segments." },
      ]}
    >
      <MembershipCalcClient />
    </SimpleCalcLayout>
  );
}
