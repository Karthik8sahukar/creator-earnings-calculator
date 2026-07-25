import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/**
 * Premium hero section — dark background, two-column layout.
 * Left: headline + subtitle + CTAs + search.
 * Right: static dashboard preview (decorative only).
 */
export function HeroRedesign({ children }: { children: ReactNode }) {
  const t = useTranslations();

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-3xl bg-[#09090B] px-6 py-16 sm:px-10 sm:py-20 lg:py-24">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 40V0h40' stroke='%23ffffff' stroke-width='0.5' fill='none'/%3E%3C/svg%3E\")" }} />
      </div>

      <div className="relative mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left column — 7/12 */}
        <div className="lg:col-span-7 space-y-8">
          <h1 id="hero-title" className="text-[42px] sm:text-[56px] lg:text-[72px] font-extrabold leading-[1.05] tracking-tight text-white">
            The Ultimate Toolkit<br />
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">for Creators and Developers.</span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-[620px] leading-relaxed">
            Estimate YouTube earnings, decode JWTs, format JSON, generate UUIDs, spin wheels, and more — all from one privacy-first platform.
          </p>

          <div className="flex flex-wrap gap-3">
            <a href="#find-channel" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg hover:bg-zinc-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
              Search Creator
            </a>
            <Link href={"/developer-tools" as never} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60">
              Explore Tools
            </Link>
          </div>

          {/* Search */}
          <div id="find-channel" className="scroll-mt-24 pt-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur p-3 sm:p-4 shadow-xl">
              {children}
            </div>
          </div>
        </div>

        {/* Right column — 5/12 — Dashboard preview (static/decorative) */}
        <div className="hidden lg:col-span-5 lg:flex items-center justify-center" aria-hidden>
          <DashboardPreview />
        </div>
      </div>

      {/* Trust bar */}
      <div className="relative mt-14 mx-auto max-w-7xl">
        <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-3">
          {[
            { icon: "✓", label: "Browser Based" },
            { icon: "✓", label: "Privacy First" },
            { icon: "✓", label: "Official YouTube Data API" },
            { icon: "✓", label: "Always Free" },
          ].map(({ icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 text-sm text-zinc-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-400 text-xs">{icon}</span>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Static decorative dashboard card — no API calls, no interactivity. */
function DashboardPreview() {
  return (
    <div className="relative w-full max-w-[420px]">
      {/* Main analytics card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600" />
          <div>
            <p className="text-sm font-semibold text-white">Creator Analytics</p>
            <p className="text-xs text-zinc-500">Revenue Estimate</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-zinc-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-white">$24,500</p>
            </div>
            <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">+12.5%</span>
          </div>
          {/* Mini chart bars */}
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 35, 65, 50, 75, 60, 80, 70, 90, 85, 95].map((h, i) => (
              <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-purple-600/60 to-purple-400/40" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>

      {/* Floating mini cards */}
      <div className="absolute -top-4 -right-4 rounded-xl border border-zinc-700/50 bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur">
        <p className="text-[10px] text-zinc-500 font-medium">JSON Formatter</p>
        <p className="text-xs text-white font-semibold">Beautify & Validate</p>
      </div>

      <div className="absolute -bottom-3 -left-4 rounded-xl border border-zinc-700/50 bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur">
        <p className="text-[10px] text-zinc-500 font-medium">JWT Decoder</p>
        <p className="text-xs text-white font-semibold">Decode Locally</p>
      </div>

      <div className="absolute top-1/2 -right-6 rounded-xl border border-zinc-700/50 bg-zinc-900/95 px-3 py-2 shadow-lg backdrop-blur">
        <p className="text-[10px] text-zinc-500 font-medium">Spin Wheel</p>
        <p className="text-xs text-white font-semibold">Random Decisions</p>
      </div>
    </div>
  );
}
