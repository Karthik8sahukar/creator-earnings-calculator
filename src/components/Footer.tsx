import Link from "next/link";

import { publicConfig } from "@/lib/config";
import { Logo } from "./Logo";

/**
 * Site footer.
 *
 * Design goals:
 *   - Four content columns (Calculators, Company, Legal, Resources).
 *   - Uses the same brand + tagline stack as the header.
 *   - No `/api/health` link — that route is internal and not designed
 *     as a public destination.
 *   - No social icons — we do not have real profile URLs configured
 *     yet, so we omit the row entirely rather than emit placeholders.
 *
 * `publicConfig.siteName` is still used in the copyright line and the
 * "independent tool" disclaimer because those legal-adjacent strings
 * must match the canonical product name used in metadata and JSON-LD.
 */
export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-200/70 bg-white/60 dark:border-slate-800/70 dark:bg-slate-950/40">
      <div className="container-page py-12 grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] text-sm text-slate-600 dark:text-slate-400">
        <div className="space-y-4 max-w-sm">
          <Logo size="md" withTagline />
          <p className="leading-relaxed">
            An independent tool that estimates YouTube channel earnings from
            public statistics. Not affiliated with, endorsed by, or verified
            by YouTube or Google.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Calculators
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/#find-channel"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Money Calculator
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-rpm-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                RPM Calculator
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-cpm-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                CPM Calculator
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-shorts-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Shorts Calculator
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-sponsorship-calculator"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Sponsorship Calculator
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Company
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/about"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/methodology"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Methodology
              </Link>
            </li>
            <li>
              {/* Non-linked placeholder — same treatment as the header. */}
              <span
                aria-disabled="true"
                className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
                title="Blog is coming soon"
              >
                Blog
                <span className="chip">Soon</span>
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Legal
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link
                href="/privacy"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Privacy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Terms
              </Link>
            </li>
            <li>
              <Link
                href="/disclaimer"
                className="hover:text-slate-900 dark:hover:text-slate-100"
              >
                Disclaimer
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            Resources
          </h4>
          <ul className="mt-3 space-y-2">
            <li>
              <a
                href="https://developers.google.com/youtube/v3"
                className="hover:text-slate-900 dark:hover:text-slate-100"
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube Data API v3
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-slate-500">
            Revenue figures on this site are independently calculated
            estimates.
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200/70 dark:border-slate-800/70">
        <div className="container-page py-6 text-xs text-slate-500 dark:text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span>
            &copy; {new Date().getFullYear()} BeHumler. Independent tool —{" "}
            <span className="whitespace-nowrap">{publicConfig.siteName}</span>.
          </span>
          <span className="whitespace-nowrap">
            Estimates only. Not financial advice.
          </span>
        </div>
      </div>
    </footer>
  );
}
