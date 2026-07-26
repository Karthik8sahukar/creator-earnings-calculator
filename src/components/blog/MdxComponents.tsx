import type { MDXComponents } from "mdx/types";
import type { ImageProps } from "next/image";
import Image from "next/image";

import { Link } from "@/i18n/navigation";

/**
 * Contextual CTA that turns an article into a warm intro to one of
 * BeHumler's calculators. This is the primary internal-linking
 * mechanism the SEO spec asks for — articles link to calculators
 * with natural context, not just naked URLs in the footer.
 *
 * Usage inside an .mdx file:
 *
 *     <CalculatorCta
 *       to="rpm"
 *       heading="Try it with your own numbers"
 *       body="Plug your last month's revenue and total views into..."
 *     />
 */
export function CalculatorCta({
  to,
  heading,
  body,
  ctaText,
}: {
  to:
    | "money"
    | "rpm"
    | "cpm"
    | "shorts"
    | "sponsorship";
  heading: string;
  body?: string;
  ctaText?: string;
}) {
  const HREF = {
    money: "/youtube-money-calculator",
    rpm: "/youtube-rpm-calculator",
    cpm: "/youtube-cpm-calculator",
    shorts: "/youtube-shorts-calculator",
    sponsorship: "/youtube-sponsorship-calculator",
  } as const;
  const DEFAULT_CTA: Record<typeof to, string> = {
    money: "Open the YouTube Money Calculator",
    rpm: "Open the RPM Calculator",
    cpm: "Open the CPM Calculator",
    shorts: "Open the Shorts Calculator",
    sponsorship: "Open the Sponsorship Calculator",
  };

  return (
    <aside
      // Rendered as `<aside>` because the CTA is genuinely
      // "tangential to the main text" — screen readers can skip past
      // it via landmark navigation without missing article prose.
      className="not-prose my-8 rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50 to-white p-5 sm:p-6 dark:border-brand-500/30 dark:from-brand-500/10 dark:to-slate-900"
    >
      <h4 className="text-base font-semibold text-slate-900 dark:text-slate-50">
        {heading}
      </h4>
      {body && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {body}
        </p>
      )}
      <Link
        href={HREF[to]}
        className="btn-primary mt-4 inline-flex text-sm"
      >
        {ctaText ?? DEFAULT_CTA[to]}
        <span aria-hidden>→</span>
      </Link>
    </aside>
  );
}

/**
 * Callout block for "Note" / "Warning" / "Tip" style asides.
 * Uses `role="note"` so screen readers announce it distinctly from
 * ordinary paragraphs.
 */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: "note" | "warning" | "tip";
  title?: string;
  children: React.ReactNode;
}) {
  const STYLES: Record<typeof type, { border: string; bg: string; text: string; icon: string }> = {
    note: {
      border: "border-brand-200/70 dark:border-brand-500/30",
      bg: "bg-brand-50/70 dark:bg-brand-500/10",
      text: "text-slate-800 dark:text-slate-200",
      icon: "ℹ️",
    },
    warning: {
      border: "border-amber-200 dark:border-amber-500/40",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      text: "text-amber-900 dark:text-amber-100",
      icon: "⚠️",
    },
    tip: {
      border: "border-emerald-200 dark:border-emerald-500/40",
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      text: "text-emerald-900 dark:text-emerald-100",
      icon: "💡",
    },
  };
  const s = STYLES[type];
  return (
    <aside
      role="note"
      className={`not-prose my-6 rounded-xl border p-4 ${s.border} ${s.bg} ${s.text}`}
    >
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-lg leading-none mt-0.5">
          {s.icon}
        </span>
        <div>
          {title && <p className="font-semibold mb-1">{title}</p>}
          <div className="text-sm leading-relaxed [&_p]:m-0 [&_p+p]:mt-2">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}

/**
 * KPI-style stat block used at the top of "how much does X make"
 * style articles. Keeps the eye-catching numbers separate from prose.
 */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-prose my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p>
      )}
    </div>
  );
}

/**
 * MDX-native image wrapper. Uses next/image for automatic
 * responsive sizing + WebP, and reads dimensions from the frontmatter-
 * -like inline props authors pass in.
 */
export function BlogImage({
  src,
  alt,
  width = 1200,
  height = 675,
  ...rest
}: ImageProps) {
  return (
    <span className="not-prose my-6 block overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-auto w-full"
        {...rest}
      />
    </span>
  );
}

/**
 * The MDX component map. Handed to `<MDXRemote components={...} />`
 * so every article gets access to the same set of building blocks
 * without importing them at the top of each file.
 *
 * We deliberately DO NOT override plain HTML elements (`h2`, `p`,
 * `a`, ...) here — Tailwind Typography (`prose` classes) handles
 * their styling on the article page, and preserving native elements
 * keeps `rehype-slug` heading ids intact for the TOC.
 */
export const blogMdxComponents: MDXComponents = {
  CalculatorCta,
  Callout,
  StatGrid,
  Stat,
  BlogImage,
};
