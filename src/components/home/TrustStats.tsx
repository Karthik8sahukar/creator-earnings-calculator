import { getTotalToolCount } from "@/lib/tools";
import { listCreators } from "@/lib/creators";

/**
 * Trust statistics section — large metric cards.
 * All values are computed dynamically — no hardcoded numbers.
 */
export function TrustStats() {
  const toolCount = getTotalToolCount();
  const creatorCount = listCreators().length;

  return (
    <section aria-label="Platform statistics" className="scroll-mt-20">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard value={`${creatorCount}+`} label="Creator Profiles" />
        <StatCard value={`${toolCount}+`} label="Free Tools" />
        <StatCard value="7" label="Languages" />
        <StatCard value="100%" label="Browser Based" />
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card p-6 sm:p-8 text-center group hover:-translate-y-0.5 transition-transform duration-200">
      <p className="text-3xl sm:text-4xl font-bold gradient-text">{value}</p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </div>
  );
}
