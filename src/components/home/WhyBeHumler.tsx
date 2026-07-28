import { useT } from "@/lib/t";

import {
  LockIcon,
  RocketIcon,
  ShieldIcon,
  TargetIcon,
} from "../icons";

interface Feature {
  titleKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

const FEATURES: readonly Feature[] = [
  {
    titleKey: "whyBeHumler.features.accurate.title",
    descriptionKey: "whyBeHumler.features.accurate.description",
    Icon: TargetIcon,
  },
  {
    titleKey: "whyBeHumler.features.fast.title",
    descriptionKey: "whyBeHumler.features.fast.description",
    Icon: RocketIcon,
  },
  {
    titleKey: "whyBeHumler.features.poweredBy.title",
    descriptionKey: "whyBeHumler.features.poweredBy.description",
    Icon: ShieldIcon,
  },
  {
    titleKey: "whyBeHumler.features.privacy.title",
    descriptionKey: "whyBeHumler.features.privacy.description",
    Icon: LockIcon,
  },
] as const;

export function WhyBeHumler() {
  const t = useT();
  return (
    <section aria-labelledby="why-title">
      <div className="text-center max-w-2xl mx-auto">
        <p className="label">{t("whyBeHumler.eyebrow")}</p>
        <h2
          id="why-title"
          className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("whyBeHumler.title")}
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {t("whyBeHumler.subtitle")}
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ titleKey, descriptionKey, Icon }) => (
          <li key={titleKey} className="card p-5 h-full">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
              <Icon width={18} height={18} />
            </span>
            <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
              {t(titleKey)}
            </h3>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {t(descriptionKey)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
