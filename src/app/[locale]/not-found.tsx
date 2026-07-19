import { getTranslations } from "next-intl/server";

import { NotFoundBody } from "./_not-found/NotFoundBody";

/**
 * Locale-aware 404 boundary.
 *
 * Rendered whenever Next.js walks the not-found boundary tree and
 * lands here — most importantly when the `[slug]` segment inside
 * `/[locale]/creator/[slug]/` is rejected by `dynamicParams = false`.
 * In that case Next.js does not enter the `[slug]/` folder and does
 * not treat sibling `creator/not-found.tsx` as a boundary either, so
 * without any conditional branching this file was rendering the
 * generic "Page not found" heading on every unknown-creator URL.
 *
 * The fix routes the decision through `<NotFoundBody/>`, a small
 * client component that reads `usePathname()` and picks between
 * the generic 404 copy and the creator-specific 404 copy. Both
 * translation blocks are resolved server-side and passed down as
 * plain strings so the client component ships zero i18n runtime.
 *
 * Layout / spacing / typography are unchanged; only the copy and
 * the CTA destination switch when the failed URL lives under
 * `/creator/`.
 */
export default async function NotFound() {
  const tGeneric = await getTranslations("notFound");
  const tCreator = await getTranslations("creator.notFound");
  const tActions = await getTranslations("common.actions");

  return (
    <NotFoundBody
      generic={{
        code: tGeneric("code"),
        title: tGeneric("title"),
        body: tGeneric("body"),
        ctaLabel: tActions("backToHome"),
      }}
      creator={{
        code: tCreator("code"),
        title: tCreator("title"),
        body: tCreator("body"),
        ctaLabel: tCreator("browseAll"),
      }}
    />
  );
}
