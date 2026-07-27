import type { Metadata } from "next";
import { useT } from "@/lib/t";
import Link from "next/link";
import { ALL_DEVELOPER_TOOLS } from "@/components/developer";
import { ToolSEO } from "@/components/decision";
import { buildAlternates } from "@/lib/i18nMetadata";
import { publicConfig } from "@/lib/config";

const PATH = "/developer-tools";
const FAQ = [
  { q: "Are these tools free?", a: "Yes. All developer tools are completely free to use with no sign-up required." },
  { q: "Is my data sent to a server?", a: "No. Every tool runs locally in your browser using JavaScript. No data leaves your device." },
  { q: "What tools are available?", a: "JWT decoder, JSON formatter, Base64 encoder/decoder, UUID generator, cron expression builder, Unix timestamp converter, URL encoder/decoder, regex tester, SQL to JSON converter, and CSV to JSON converter." },
];


export async function generateMetadata({ params }: { /* no params */ }): Promise<Metadata> {
  return {
    title: "Developer Tools – Free Browser-Based Utilities",
    description: "Free browser-based developer tools. JWT decoder, JSON formatter, Base64, UUID generator, regex tester, and more. All processing happens locally.",
    keywords: ["developer tools", "online tools", "free dev tools", "browser tools", "json formatter", "jwt decoder"],
    alternates: buildAlternates({ pathSuffix: PATH }),
    openGraph: { type: "website", title: "Developer Tools – Free Browser-Based Utilities", description: "Free browser-based developer tools. No data leaves your device.", url: `${publicConfig.siteUrl}${PATH}`, siteName: publicConfig.siteName, locale },
    twitter: { card: "summary_large_image", title: "Developer Tools – Free Browser-Based Utilities", description: "Free browser-based developer tools. No data leaves your device." },
  };
}

export default async function Page({ params }: { /* no params */ }) {
  return (
    <>
      <DeveloperToolsGrid />
      <ToolSEO pathSuffix={PATH} toolName="Developer Tools" toolDescription="Collection of free browser-based developer utilities." faq={FAQ} breadcrumbName="Developer Tools" />
    </>
  );
}

function DeveloperToolsGrid() {
  const t = useT();
  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <nav aria-label={t("channelPage.breadcrumbAria")} className="text-xs text-slate-500 dark:text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100">{t("common.breadcrumbs.home")}</Link></li>
          <li className="flex items-center gap-1"><span aria-hidden>&rsaquo;</span><span>Developer Tools</span></li>
        </ol>
      </nav>

      <header className="space-y-3 text-center sm:text-left">
        <p className="inline-flex items-center gap-2 rounded-full bg-accent-500/10 text-accent-600 px-3 py-1 text-xs font-medium dark:text-accent-400">
          Developer Tools
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          Free Browser-Based Developer Tools
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-2xl">
          A collection of free developer utilities that run entirely in your browser. No data is ever sent to a server.
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_DEVELOPER_TOOLS.map(({ href, title, description, Icon }) => (
          <li key={href}>
            <Link href={href as never} className="group card flex h-full flex-col gap-3 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60">
              <div className="flex items-start justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500/15 to-brand-500/15 text-accent-600 dark:text-accent-400">
                  <Icon width={16} height={16} />
                </span>
                <span className="inline-flex items-center rounded-full bg-accent-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                  Dev Tool
                </span>
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-1">{description}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-600 dark:text-accent-400">
                Open<span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
