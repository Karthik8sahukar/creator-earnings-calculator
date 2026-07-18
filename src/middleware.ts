import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Global locale middleware.
 *
 * Responsibilities:
 *   1. Read the visitor's preferred locale in this priority order:
 *        a. Existing `BEHUMLER_LOCALE` cookie (set by the language
 *           selector) — the user's own past choice always wins.
 *        b. `Accept-Language` header from the browser.
 *        c. `routing.defaultLocale` ("en") as final fallback.
 *   2. Redirect any non-prefixed URL (like `/` or legacy `/about`) to
 *      the locale-prefixed equivalent so that every canonical URL is
 *      of the form `/{locale}/...`.
 *   3. Never touch `/api/*`, `/sitemap.xml`, `/robots.txt`, or Next.js
 *      internals — those must remain unprefixed. Enforced by the
 *      matcher below.
 */
export default createMiddleware(routing);

export const config = {
  // Match every path EXCEPT:
  //   - /api/* (backend routes must stay unprefixed)
  //   - /_next/* (Next.js build assets)
  //   - Common static files under /public served by filename
  //   - sitemap.xml and robots.txt (SEO discovery must stay canonical)
  //
  // The matcher runs BEFORE Next.js resolves the URL, so we cannot use
  // `has:` / `missing:` here — we rely on a single regex that excludes
  // the paths we never localize.
  matcher: [
    "/((?!api|_next|_vercel|.*\\..*|robots.txt|sitemap.xml).*)",
  ],
};
