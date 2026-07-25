import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ALL_DECISION_TOOLS } from "@/components/decision";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";
import { routing } from "@/i18n/routing";

const PATH = "/decision-tools";
const FAQ = [
  { q: "Are these tools free?", a: "Yes. All decision tools are completely free to use with no sign-up or login required." },
  { q: "Do they require an internet connection?", a: "The tools load in your browser and work offline after the initial page load. No data is sent to any server." },
  { q: "What tools are available?", a: "Spin the Wheel, Coin Flip, Dice Roller, Random Number Generator, Random Name Picker, Yes/No Picker Wheel, Random Team Generator, Character Counter, Word Counter, Random Color Generator, and Truth or Dare Generator." },
];

export function generateStaticParams() { return routing.locales.map((locale) => ({ locale })); }

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Decision Tools – Free Random Generators & Utilities",
    description: "Free decision-making tools: spin wheels, coin flips, dice rollers, random teams, name pickers, and more. All browser-based, no login required.",
    keywords: ["decision tools", "random generator", "spin wheel", "coin flip", "dice roller", "random name picker", "random team generator"],
    alternates: buildAlternates({ locale, pathSuffix: PATH }),
    openGraph: { type: "website", title: "Decision Tools – Free Random Generators & Utilities", description: "Free decision-making tools. Spin wheels, coin flips, dice rollers, and more.", url: `${publicConfig.siteUrl}/${locale}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Decision Tools – Free Random Generators & Utilities", description: "Free decision-making tools. Spin wheels, coin flips, dice rollers, and more." },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <DecisionToolsGrid />
      <ToolSEO locale={locale} pathSuffix={PATH} toolName="Decision Tools" toolDescription="Collection of free browser-based decision-making and random generation tools." faq={FAQ} breadcrumbName="Decision Tools" />
    </>
  );
}

function DecisionToolsGrid() {
  const t = useTranslations();
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <nav aria-label={t("channelPage.breadcrumbAria")} className="text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">{t("common.breadcrumbs.home")}</Link></li>
          <li className="flex items-center gap-1"><span aria-hidden>&rsaquo;</span><span>Decision Tools</span></li>
        </ol>
      </nav>

      <header className="space-y-3 text-center sm:text-left">
        <p className="inline-flex items-center gap-2 rounded-full bg-purple-100 text-purple-700 px-3 py-1 text-xs font-medium dark:bg-purple-500/10 dark:text-purple-300">
          Decision Tools
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Free Decision-Making Tools
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
          Random generators, spinners, and decision tools for games, classrooms, meetings, and quick choices. No login, no tracking.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_DECISION_TOOLS.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link href={href as never} className="group card flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/15 to-accent-500/15 text-purple-700 dark:text-purple-200">
                  <Icon width={16} height={16} />
                </span>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  Decision Tool
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                Open<span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
