import { Link } from "@/i18n/navigation";

/**
 * Three product category cards matching the approved mockup.
 * Creator Intelligence (purple), Developer Workspace (blue), Smart Utilities (orange).
 */

interface CategoryCard {
  href: string;
  title: string;
  subtitle: string;
  tools: string[];
  gradient: string;
  borderColor: string;
  iconBg: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    href: "/#find-channel",
    title: "Creator Intelligence",
    subtitle: "YouTube revenue estimation, RPM/CPM analysis, channel valuation, and sponsorship pricing.",
    tools: ["Money Calculator", "RPM", "CPM", "Shorts", "Sponsorship", "Instagram"],
    gradient: "from-purple-500/10 via-purple-600/5 to-transparent",
    borderColor: "border-purple-500/20 hover:border-purple-500/40",
    iconBg: "bg-purple-500/15 text-purple-400",
  },
  {
    href: "/developer-tools",
    title: "Developer Workspace",
    subtitle: "JSON formatting, JWT decoding, Base64, UUID generation, regex testing, and more.",
    tools: ["JSON Formatter", "JWT Decoder", "Base64", "UUID", "Regex", "Cron"],
    gradient: "from-blue-500/10 via-blue-600/5 to-transparent",
    borderColor: "border-blue-500/20 hover:border-blue-500/40",
    iconBg: "bg-blue-500/15 text-blue-400",
  },
  {
    href: "/spin-the-wheel",
    title: "Smart Utilities",
    subtitle: "Spin wheels, coin flips, dice rollers, random teams, and decision-making tools.",
    tools: ["Spin Wheel", "Coin Flip", "Dice", "Teams", "Name Picker", "Yes/No"],
    gradient: "from-orange-500/10 via-orange-600/5 to-transparent",
    borderColor: "border-orange-500/20 hover:border-orange-500/40",
    iconBg: "bg-orange-500/15 text-orange-400",
  },
];

export function ToolCategories() {
  return (
    <section id="tools" aria-labelledby="categories-title" className="scroll-mt-20">
      <div className="text-center mb-12">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Products</p>
        <h2 id="categories-title" className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          Everything You Need, One Platform
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Three suites of tools built for creators, developers, and teams.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {CATEGORIES.map(({ href, title, subtitle, tools, gradient, borderColor, iconBg }) => (
          <Link
            key={title}
            href={href as never}
            className={`group relative rounded-3xl border ${borderColor} bg-gradient-to-b ${gradient} p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:bg-zinc-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60`}
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} mb-5`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed mb-5">{subtitle}</p>

            <div className="flex flex-wrap gap-1.5">
              {tools.map((tool) => (
                <span key={tool} className="rounded-full bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-zinc-400">
                  {tool}
                </span>
              ))}
            </div>

            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-slate-900 dark:text-white">
              Explore
              <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
