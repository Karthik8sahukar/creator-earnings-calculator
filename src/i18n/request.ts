import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/**
 * Per-request i18n configuration.
 *
 * Called by next-intl for every server-rendered page / metadata call.
 * It:
 *   1. Validates the incoming `requestLocale` against our supported set.
 *      Unknown or missing locales fall back to `routing.defaultLocale`
 *      ("en") — this protects us if the middleware is bypassed or a
 *      handcrafted URL slips through.
 *   2. Loads the corresponding message file. Loading is dynamic (per
 *      locale) so we do not ship every locale's messages to every
 *      request.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    // Intl.NumberFormat / Intl.DateTimeFormat use this locale for
    // date, number, and relative-time formatting via useFormatter().
    now: new Date(),
  };
});
