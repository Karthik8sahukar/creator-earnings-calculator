import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/**
 * Premium hero section — dark background, single-column centered layout.
 * Clean, spacious, and balanced without decorative previews.
 */
export function HeroRedesign({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-3xl bg-[#09090B] px-6 py-16 sm:px-10 sm:py-20 lg:py-28">
      {/* Subtle background effects */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-purple-600/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-1/4 w-[500px] h-[400px] rounded-full bg-blue-600/6 blur-[120px]" />
      </div>

      {/* Content — single centered column */}
      <div className="relative mx-auto max-w-[1000px] space-y-10 text-center">
        <div className="space-y-6">
          <h1 id="hero-title" className="mx-auto max-w-[760px] text-[42px] sm:text-[56px] lg:text-[72px] font-extrabold leading-[1.05] tracking-tight text-white">
            The Ultimate Toolkit{" "}
            <span className="bg-gradient-to-r from-purple-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">for Creators and Developers.</span>
          </h1>

          <p className="mx-auto max-w-[650px] text-lg sm:text-xl text-zinc-400 leading-relaxed">
            Estimate YouTube earnings, decode JWTs, format JSON, generate UUIDs, spin wheels, and more — all from one privacy-first platform.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3">
          <a href="#find-channel" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-900 shadow-lg hover:bg-zinc-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60">
            Search Creator
          </a>
          <Link href={"/developer-tools" as never} className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/50 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:bg-zinc-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60">
            Explore Tools
          </Link>
        </div>

        {/* Creator search */}
        <div id="find-channel" className="scroll-mt-24 mx-auto max-w-[760px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 backdrop-blur p-3 sm:p-4 shadow-xl">
            {children}
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="relative mt-14 mx-auto max-w-[1000px]">
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
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
