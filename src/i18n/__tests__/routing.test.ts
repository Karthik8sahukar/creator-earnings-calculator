/**
 * Verify the immutable contract of the i18n routing config.
 *
 * These tests exist so that a well-meaning refactor cannot silently
 * change which locales the app supports, change the default locale,
 * or drop the cookie the language selector relies on.
 */
import { describe, expect, it } from "vitest";

import {
  HREFLANG_MAP,
  LOCALE_LABELS,
  LOCALES_WITH_STATIC_TRANSLATIONS,
  hasStaticTranslations,
  routing,
} from "../routing";

describe("i18n routing contract", () => {
  it("supports exactly the seven required locales", () => {
    expect(routing.locales.slice().sort()).toEqual([
      "de",
      "en",
      "es",
      "fr",
      "hi",
      "ja",
      "pt",
    ]);
  });

  it("defaults to English", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("prefixes every URL with the locale (localePrefix: 'always')", () => {
    // The middleware relies on this — without 'always', legacy URLs
    // like `/about` would not redirect to `/en/about`.
    expect(routing.localePrefix).toBe("always");
  });

  it("uses a first-party locale cookie so preference survives sessions", () => {
    // Explicit name so it's discoverable in DevTools; type-narrow so the
    // test breaks if the config shape ever changes.
    const cookie = routing.localeCookie;
    expect(cookie).not.toBe(false);
    if (typeof cookie === "object") {
      expect(cookie.name).toBe("BEHUMLER_LOCALE");
      // At least a month, so the choice doesn't evaporate between visits.
      expect(cookie.maxAge).toBeGreaterThanOrEqual(60 * 60 * 24 * 30);
    }
  });

  it("negotiates a locale from Accept-Language on first visit", () => {
    expect(routing.localeDetection).toBe(true);
  });

  it("provides a native + English label for every locale", () => {
    for (const loc of routing.locales) {
      const label = LOCALE_LABELS[loc];
      expect(label, `${loc} must have a label`).toBeDefined();
      expect(label.native.length).toBeGreaterThan(0);
      expect(label.english.length).toBeGreaterThan(0);
    }
  });

  it("emits a BCP 47 hreflang tag for every locale", () => {
    for (const loc of routing.locales) {
      expect(HREFLANG_MAP[loc]).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    }
  });

  it("keeps long-form static translations gated per locale", () => {
    // English is the canonical body copy — that's where long-form is
    // published. Every other locale falls through to the coming-soon
    // notice until a human translator ships copy for it.
    expect(LOCALES_WITH_STATIC_TRANSLATIONS).toContain("en");
    expect(hasStaticTranslations("en")).toBe(true);
    for (const loc of routing.locales) {
      if (loc === "en") continue;
      expect(
        hasStaticTranslations(loc),
        `${loc} should show the pending notice`,
      ).toBe(false);
    }
    // Unknown / spoofed locales are treated as untranslated.
    expect(hasStaticTranslations("xx")).toBe(false);
    expect(hasStaticTranslations("")).toBe(false);
  });
});
