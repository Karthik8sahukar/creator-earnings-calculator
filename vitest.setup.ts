import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

import enMessages from "./messages/en.json";

// Ensure DOM is torn down between tests
afterEach(() => {
  cleanup();
});

/**
 * Read a dotted-path key out of the English message tree so tests can
 * assert on real translated strings without wrapping every component in
 * `<NextIntlClientProvider>`. Falls back to returning the key itself so
 * a stale test surface is still self-describing.
 */
function readMessage(path: string): string {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cursor: any = enMessages;
  for (const p of parts) {
    if (cursor == null) return path;
    cursor = cursor[p];
  }
  return typeof cursor === "string" ? cursor : path;
}

/**
 * Substitute `{name}` placeholders in an ICU string with values from a
 * plain map. Keeps the tests portable — same syntax next-intl uses.
 */
function format(template: string, values?: Record<string, unknown>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)(?:,\s*number(?:,\s*[^}]+)?)?\}/g, (_, k) => {
    const v = values[k];
    if (typeof v === "number") return v.toLocaleString("en-US");
    return v == null ? "" : String(v);
  });
}

/**
 * Mock the parts of `next-intl` used from component code. Server-side
 * helpers like `getTranslations` / `setRequestLocale` aren't reached in
 * component unit tests (those exercise client components), but we mock
 * them anyway so any accidental import doesn't blow up.
 *
 * NOTE: This is a shallow mock — it does NOT emulate namespace scoping
 * beyond what the components need. Every call resolves against the
 * full `en.json` tree using the FULL dotted key. Namespace-scoped
 * hooks (`useTranslations("share")`) return a t() that prepends the
 * namespace to whatever key you ask for.
 */
vi.mock("next-intl", async () => {
  const actual = await vi.importActual<typeof import("next-intl")>("next-intl");
  return {
    ...actual,
    useLocale: () => "en",
    useTranslations: (namespace?: string) => {
      const t = (key: string, values?: Record<string, unknown>) => {
        const full = namespace ? `${namespace}.${key}` : key;
        return format(readMessage(full), values);
      };
      // Fake `t.rich` — returns the plain string (no rich-text tags).
      // Tests that need the rich variant should test at the integration
      // level with a real provider.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t as any).rich = (key: string, values?: Record<string, unknown>) => {
        const full = namespace ? `${namespace}.${key}` : key;
        return format(readMessage(full), values);
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (t as any).raw = (key: string) => {
        const full = namespace ? `${namespace}.${key}` : key;
        return readMessage(full);
      };
      return t;
    },
    useFormatter: () => ({
      // Minimal Intl.NumberFormat / DateTimeFormat proxies.
      number: (v: number) => v.toLocaleString("en-US"),
      dateTime: (v: Date) => v.toISOString(),
    }),
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  };
});

/**
 * Also mock `next-intl/server` — component tests never exercise these
 * paths, but importing them in top-level module code shouldn't throw.
 */
vi.mock("next-intl/server", () => ({
  getTranslations: async (opts?: { namespace?: string } | string) => {
    const namespace = typeof opts === "string" ? opts : opts?.namespace;
    return (key: string, values?: Record<string, unknown>) => {
      const full = namespace ? `${namespace}.${key}` : key;
      return format(readMessage(full), values);
    };
  },
  setRequestLocale: () => {},
  getLocale: async () => "en",
  getFormatter: async () => ({
    number: (v: number) => v.toLocaleString("en-US"),
    dateTime: (v: Date) => v.toISOString(),
  }),
}));

/**
 * Mock `@/i18n/navigation` — same shape as next-intl exports but the
 * component under test only cares that the identifiers exist.
 */
vi.mock("@/i18n/navigation", async () => {
  const NextLink = (await import("next/link")).default;
  return {
    Link: NextLink,
    redirect: vi.fn(),
    usePathname: () => "/",
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    getPathname: (opts: { href: string }) => opts.href,
  };
});

beforeAll(() => {
  // ResizeObserver isn't in jsdom — Recharts and some other libs need it.
  class ResizeObserverPolyfill {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  const g = globalThis as unknown as Record<string, unknown>;
  if (!g.ResizeObserver) g.ResizeObserver = ResizeObserverPolyfill;

  // matchMedia polyfill (used for reduced motion).
  if (!g.matchMedia) {
    g.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  }

  // scrollTo polyfill
  if (typeof window !== "undefined" && !window.scrollTo) {
    window.scrollTo = () => {};
  }
});
