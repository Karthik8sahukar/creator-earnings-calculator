import "./globals.css";

/**
 * Root layout stub.
 *
 * The real layout — `<html>`, `<body>`, Header/Footer, metadata, JSON-LD —
 * lives in `src/app/[locale]/layout.tsx` so `<html lang="…">` can reflect
 * the active locale AND the dark-mode ThemeScript can run before the
 * first paint. This root file exists only because Next.js requires an
 * `app/layout.tsx`; the middleware always redirects requests into a
 * locale-prefixed path (`/en/…`, `/hi/…`, etc.) so a fallback tree is
 * never actually rendered.
 *
 * Global CSS is imported here (once) so it is applied regardless of
 * which locale segment renders the page.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
