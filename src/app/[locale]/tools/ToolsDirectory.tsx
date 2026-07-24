"use client";

import { useMemo, useState } from "react";
import { Link } from "@/i18n/navigation";

// ─── All tools grouped by category ─────────────────────────────────

interface ToolDef {
  href: string;
  title: string;
  description: string;
}

interface Category {
  name: string;
  badgeClass: string;
  tools: ToolDef[];
}

const CATEGORIES: Category[] = [
  {
    name: "Creator Analytics",
    badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    tools: [
      { href: "/#find-channel", title: "YouTube Money Calculator", description: "Estimate a channel's monthly revenue from views, RPM, and ad performance." },
      { href: "/youtube-rpm-calculator", title: "RPM Calculator", description: "Calculate revenue per 1,000 monetized views." },
      { href: "/youtube-cpm-calculator", title: "CPM Calculator", description: "What advertisers pay per 1,000 ad impressions." },
      { href: "/youtube-shorts-calculator", title: "Shorts Calculator", description: "Estimate Creator Pool payouts from YouTube Shorts views." },
      { href: "/youtube-sponsorship-calculator", title: "Sponsorship Calculator", description: "Estimate brand deal rates based on engagement and reach." },
      { href: "/youtube-engagement-calculator", title: "Engagement Calculator", description: "Calculate engagement rate from views, likes, comments and shares." },
      { href: "/youtube-adsense-calculator", title: "AdSense Calculator", description: "Estimate AdSense revenue from RPM and monthly view count." },
      { href: "/instagram-money-calculator", title: "Instagram Calculator", description: "Estimate Instagram creator earnings across all monetization streams." },
    ],
  },
  {
    name: "Streaming",
    badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    tools: [
      { href: "/twitch-bits-calculator", title: "Twitch Bits Calculator", description: "Convert Twitch Bits to USD and see streamer payout vs viewer cost." },
    ],
  },
  {
    name: "Decision Tools",
    badgeClass: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    tools: [
      { href: "/spin-the-wheel", title: "Spin the Wheel", description: "Create a customizable spinning wheel with unlimited options." },
      { href: "/coin-flip", title: "Coin Flip", description: "Flip a virtual coin for quick and unbiased decisions." },
      { href: "/dice-roller", title: "Dice Roller", description: "Roll one or more virtual dice for games, classrooms and tabletop RPGs." },
      { href: "/random-number-generator", title: "Random Number Generator", description: "Generate random numbers instantly within any custom range." },
      { href: "/random-name-picker", title: "Random Name Picker", description: "Pick a random winner from a list of names." },
      { href: "/yes-no-picker-wheel", title: "Yes / No Picker Wheel", description: "Spin a wheel to get a random Yes or No answer." },
      { href: "/random-team-generator", title: "Random Team Generator", description: "Split names into balanced random teams instantly." },
    ],
  },
];

export function ToolsDirectory() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES.map((cat) => ({
      ...cat,
      tools: cat.tools.filter(
        (t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.tools.length > 0);
  }, [search]);

  return (
    <div className="space-y-8">
      {/* Search */}
      <div className="max-w-md mx-auto">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools..."
          className="input w-full"
          aria-label="Search tools"
        />
      </div>

      {/* Categories */}
      {filtered.map((cat) => (
        <section key={cat.name}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              {cat.name}
            </h2>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cat.badgeClass}`}>
              {cat.tools.length} tool{cat.tools.length !== 1 ? "s" : ""}
            </span>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cat.tools.map((tool) => (
              <li key={tool.href}>
                <Link
                  href={tool.href as never}
                  className="group card flex h-full flex-col gap-2 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-pop focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
                >
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed flex-1">
                    {tool.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 dark:text-brand-300">
                    Open
                    <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-8">
          No tools match &ldquo;{search}&rdquo;. Try a different keyword.
        </p>
      )}
    </div>
  );
}
