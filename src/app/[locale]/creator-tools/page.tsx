import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";
import { ChartIcon, DollarIcon, FilmIcon, ShareIcon, TrendingUpIcon } from "@/components/icons";

const PATH = "/creator-tools";

interface CreatorTool {
  href: string;
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const ALL_CREATOR_TOOLS: readonly CreatorTool[] = [
  { href: "/#find-channel", title: "YouTube Money Calculator", description: "Estimate total monthly and yearly revenue for any YouTube channel.", Icon: DollarIcon },
  { href: "/youtube-rpm-calculator", title: "RPM Calculator", description: "Calculate revenue per 1,000 monetized views — the key creator earnings metric.", Icon: TrendingUpIcon },
  { href: "/youtube-cpm-calculator", title: "CPM Calculator", description: "See what advertisers pay per 1,000 ad impressions for pricing benchmarks.", Icon: ChartIcon },
  { href: "/youtube-shorts-calculator", title: "Shorts Calculator", description: "Estimate Creator Pool payouts from YouTube Shorts views.", Icon: FilmIcon },
  { href: "/youtube-sponsorship-calculator", title: "Sponsorship Calculator", description: "Ballpark brand-deal rates from subscriber count and engagement.", Icon: ShareIcon },
  { href: "/youtube-engagement-calculator", title: "Engagement Calculator", description: "Calculate engagement rate from views, likes, and comments.", Icon: TrendingUpIcon },
  { href: "/youtube-adsense-calculator", title: "AdSense Calculator", description: "Estimate AdSense revenue from RPM and monthly views.", Icon: DollarIcon },
  { href: "/instagram-money-calculator", title: "Instagram Calculator", description: "Estimate Instagram earnings from sponsored posts, Reels, and Stories.", Icon: ShareIcon },
  { href: "/twitch-bits-calculator", title: "Twitch Bits Calculator", description: "Convert Twitch Bits to USD and estimate streaming revenue.", Icon: DollarIcon },
];

const FAQ = [
  { q: "Are these calculators free?", a: "Yes. All creator analytics tools are completely free to use with no sign-up required." },
  { q: "Where does the data come from?", a: "Revenue estimates are calculated using public channel statistics retrieved from the official YouTube Data API v3." },
  { q: "How accurate are the estimates?", a: "Estimates are based on industry-average RPM rates by country and niche. Actual earnings vary based on ad rates, audience demographics, and monetization methods." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Creator Analytics Tools – YouTube & Instagram Revenue Calculators",
    description: "Free creator analytics tools: YouTube money calculator, RPM, CPM, Shorts, sponsorship, engagement, AdSense, Instagram, and Twitch calculators.",
    keywords: ["youtube money calculator", "creator analytics", "rpm calculator", "cpm calculator", "youtube earnings", "instagram calculator"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Creator Analytics Tools – Revenue Calculators", description: "Free creator analytics and revenue estimation tools.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Creator Analytics Tools – Revenue Calculators", description: "Free creator analytics and revenue estimation tools." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <CreatorToolsGrid />
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Creator Analytics Tools" toolDescription="Collection of free creator revenue estimation and analytics calculators." faq={FAQ} breadcrumbName="Creator Tools" />
    </>
  );
}

function CreatorToolsGrid() {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <nav aria-label={t("channelPage.breadcrumbAria")} className="text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">{t("common.breadcrumbs.home")}</Link></li>
          <li className="flex items-center gap-1"><span aria-hidden>&rsaquo;</span><span>Creator Tools</span></li>
        </ol>
      </nav>

      <header className="space-y-3 text-center sm:text-left">
        <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 px-3 py-1 text-xs font-medium dark:bg-brand-500/10 dark:text-brand-200">
          Creator Analytics
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Creator Revenue Calculators
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
          Estimate YouTube and Instagram earnings using public statistics. Revenue calculators powered by the official YouTube Data API.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_CREATOR_TOOLS.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link href={href as never} className="group card flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/15 to-accent-500/15 text-brand-700 dark:text-brand-200">
                  <Icon width={16} height={16} />
                </span>
                <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-700 dark:bg-brand-500/10 dark:text-brand-200">
                  Calculator
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 dark:text-brand-300">
                Open<span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
