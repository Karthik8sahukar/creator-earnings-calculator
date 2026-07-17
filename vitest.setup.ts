import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

// Ensure DOM is torn down between tests
afterEach(() => {
  cleanup();
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
