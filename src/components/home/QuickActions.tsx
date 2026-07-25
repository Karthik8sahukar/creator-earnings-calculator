import { Link } from "@/i18n/navigation";

/**
 * Featured Experience card — large horizontal card for YouTube Money Calculator.
 * Matches the approved mockup's "featured experience" section.
 */
export function QuickActions() {
  return (
    <section aria-labelledby="featured-title" className="scroll-mt-20">
      <div className="text-center mb-12">
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Featured</p>
        <h2 id="featured-title" className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          YouTube Money Calculator
        </h2>
        <p className="mt-4 text-lg text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto">
          The most accurate YouTube revenue estimator, powered by official YouTube Data API.
        </p>
      </div>

      <Link
        href={"/#find-channel" as never}
        className="group block rounded-3xl border border-slate-200 dark:border-zinc-800 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-zinc-900/80 dark:via-zinc-900/50 dark:to-zinc-900/80 p-8 sm:p-10 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center rounded-full bg-purple-100 dark:bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300">
              Flagship Tool
            </span>
            <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Estimate Any Creator&apos;s Revenue
            </h3>
            <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
              Enter a YouTube handle or channel URL to get detailed monthly and yearly revenue estimates, RPM analysis, top-earning video breakdowns, and sponsorship valuations.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
              Try the calculator
              <span aria-hidden className="transition-transform group-hover:translate-x-1">&rarr;</span>
            </span>
          </div>

          {/* Static revenue chart preview */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-900 dark:text-white">Estimated Monthly Revenue</p>
                <span className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full">+8.2% MoM</span>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mb-4">$18,400 – $32,100</p>
              <div className="flex items-end gap-1 h-20">
                {[30, 45, 38, 55, 48, 62, 58, 70, 65, 78, 72, 85].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-purple-600/40 to-purple-400/20 dark:from-purple-500/50 dark:to-purple-300/20" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
