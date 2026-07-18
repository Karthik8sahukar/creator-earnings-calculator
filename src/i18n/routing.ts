import { defineRouting } from "next-intl/routing";

/**
 * Canonical i18n routing configuration for BeHumler.
 *
 * A single source of truth for:
 *   - Which locales the app supports.
 *   - The default locale (used for the root redirect and as fallback
 *     when translations are missing).
 *   - The cookie that persists a user's manual locale choice across
 *     visits so it survives middleware, server components, and
 *     revisits from a fresh session.
 *
 * `localePrefix: "always"` gives us clean, predictable URLs
 * (`/en/...`, `/hi/...`) — every canonical URL is prefixed. Legacy
 * bookmarks like `/about` still work because middleware negotiates
 * a locale (cookie → Accept-Language → default) and redirects to the
 * prefixed equivalent.
 */
export const routing = defineRouting({
  locales: ["en", "hi", "es", "pt", "de", "fr", "ja"] as const,
  defaultLocale: "en",
  localePrefix: "always",
  localeCookie: {
    // Explicit, descriptive name so it's obvious in DevTools.
    // 1 year retention matches typical "language preference" UX.
    name: "BEHUMLER_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
  localeDetection: true,
});

export type AppLocale = (typeof routing.locales)[number];

/**
 * Native display names for each locale, in the language itself.
 * Used by the language selector so users see their language written
 * in their own script (हिन्दी, 日本語, etc.).
 */
export const LOCALE_LABELS: Record<AppLocale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  hi: { native: "हिन्दी", english: "Hindi" },
  es: { native: "Español", english: "Spanish" },
  pt: { native: "Português", english: "Portuguese" },
  de: { native: "Deutsch", english: "German" },
  fr: { native: "Français", english: "French" },
  ja: { native: "日本語", english: "Japanese" },
};

/**
 * BCP 47 language tags for `<html lang="...">` and hreflang alternates.
 * Kept minimal (2-letter codes) — we don't currently distinguish
 * regional variants like en-US vs en-GB.
 */
export const HREFLANG_MAP: Record<AppLocale, string> = {
  en: "en",
  hi: "hi",
  es: "es",
  pt: "pt",
  de: "de",
  fr: "fr",
  ja: "ja",
};

/**
 * Locales for which long-form static pages (About, Methodology,
 * Privacy, Terms, Disclaimer) are professionally translated.
 *
 * Every other locale falls back to a visible "coming soon" notice
 * for those pages. Interactive UI (nav, buttons, calculators) is
 * translated for every locale in `routing.locales`.
 *
 * When a human translator delivers a static-page translation, add
 * that locale here and the notice disappears automatically.
 */
export const LOCALES_WITH_STATIC_TRANSLATIONS: readonly AppLocale[] = ["en"];

export function hasStaticTranslations(locale: string): boolean {
  return LOCALES_WITH_STATIC_TRANSLATIONS.includes(locale as AppLocale);
}
