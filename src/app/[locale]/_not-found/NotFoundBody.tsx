"use client";

import { usePathname } from "next/navigation";

import { Link } from "@/i18n/navigation";

interface Content {
  code: string;
  title: string;
  body: string;
  ctaLabel: string;
}

interface Props {
  generic: Content;
  creator: Content;
}

/**
 * Client sub-component that swaps between the generic and the
 * creator-specific 404 UI based on the current pathname.
 *
 * Why this lives on the client:
 *
 *   The parent `[locale]/not-found.tsx` is the boundary Next.js's
 *   router walks UP to when the `[slug]` segment inside
 *   `/[locale]/creator/[slug]/` is rejected (`dynamicParams = false`
 *   + slug not in `generateStaticParams`). Segment-level
 *   `not-found.tsx` files under `creator/` are NOT part of that
 *   walk in this configuration — verified against the running app.
 *
 *   `not-found.tsx` boundaries don't receive route params, and
 *   `headers()` doesn't expose a stable pathname across every Next
 *   runtime, so we route the branch decision through
 *   `usePathname()`. The value is populated during SSR from the
 *   request URL, so the HTML that Next.js streams already contains
 *   the correct heading on first paint — Playwright's
 *   `page.goto()` observes the finished HTML with the right `<h1>`.
 *
 * The two branches keep the existing styling verbatim (same
 * container, same spacing, same typographic scale, same colour
 * classes); only the copy and the CTA target change.
 */
export function NotFoundBody({ generic, creator }: Props) {
  const pathname = usePathname();
  const isCreator = /(^|\/)creator(\/|$)/.test(pathname ?? "");

  const content = isCreator ? creator : generic;
  const ctaHref = isCreator ? "/creators" : "/";

  return (
    <div className="text-center py-24">
      <p className="text-sm font-medium text-brand-600 dark:text-brand-300">
        {content.code}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
        {content.title}
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        {content.body}
      </p>
      <Link
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        href={ctaHref as any}
        className="btn-primary mt-6 inline-flex"
      >
        {content.ctaLabel}
      </Link>
    </div>
  );
}
