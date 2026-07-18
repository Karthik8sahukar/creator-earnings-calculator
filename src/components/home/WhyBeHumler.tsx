import {
  LockIcon,
  RocketIcon,
  ShieldIcon,
  TargetIcon,
} from "../icons";

interface Feature {
  title: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const FEATURES: readonly Feature[] = [
  {
    title: "Accurate estimates",
    description:
      "Every figure is derived from public YouTube statistics using transparent, published formulas.",
    Icon: TargetIcon,
  },
  {
    title: "Fast results",
    description:
      "Type a channel name or handle and get a full earnings breakdown in seconds.",
    Icon: RocketIcon,
  },
  {
    title: "Powered by YouTube Data API",
    description:
      "We fetch channel stats live from Google's official YouTube Data API v3 — no scraping.",
    Icon: ShieldIcon,
  },
  {
    title: "Privacy friendly",
    description:
      "No login. No tracking of the channels you search. Recent searches are stored locally on your device.",
    Icon: LockIcon,
  },
] as const;

export function WhyBeHumler() {
  return (
    <section aria-labelledby="why-title">
      <div className="text-center max-w-2xl mx-auto">
        <p className="label">Why BeHumler</p>
        <h2
          id="why-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          Serious analytics without the gatekeeping
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          Every creator deserves honest, transparent numbers. BeHumler
          gives you a defensible estimate you can actually reason about.
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ title, description, Icon }) => (
          <li key={title} className="card p-5 h-full">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
              <Icon width={18} height={18} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
