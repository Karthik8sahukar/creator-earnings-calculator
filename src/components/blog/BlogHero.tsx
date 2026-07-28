import { useT } from "@/lib/t";

/**
 * Landing-page hero for /blog. Static, server-rendered.
 *
 * We deliberately DO NOT include the "H1 of the site" here — this is
 * an `<h1>` for the blog listing page, distinct from the homepage's
 * H1 "YouTube Money Calculator". Every page in the app has exactly
 * one H1.
 */
export function BlogHero({ children }: { children?: React.ReactNode }) {
  const t = useT("blog.hero");
  return (
    <section className="text-center py-10 sm:py-14 space-y-4">
      <p className="chip-brand mx-auto">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
        {t("eyebrow")}
      </p>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {t("title")}
      </h1>
      <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
        {t("subtitle")}
      </p>
      {children && <div className="mx-auto max-w-2xl pt-2">{children}</div>}
    </section>
  );
}
