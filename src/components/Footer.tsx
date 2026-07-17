import Link from "next/link";

import { publicConfig } from "@/lib/config";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200/70 bg-white/60">
      <div className="container-page py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm text-slate-600">
        <div>
          <h3 className="font-semibold text-slate-900">
            {publicConfig.siteName}
          </h3>
          <p className="mt-2 leading-relaxed">
            An independent tool that estimates YouTube channel earnings using
            public statistics. Not affiliated with, endorsed by, or verified by
            YouTube or Google.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">Calculators</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/youtube-rpm-calculator" className="hover:text-slate-900">
                RPM calculator
              </Link>
            </li>
            <li>
              <Link href="/youtube-cpm-calculator" className="hover:text-slate-900">
                CPM calculator
              </Link>
            </li>
            <li>
              <Link href="/youtube-shorts-calculator" className="hover:text-slate-900">
                Shorts calculator
              </Link>
            </li>
            <li>
              <Link
                href="/youtube-sponsorship-calculator"
                className="hover:text-slate-900"
              >
                Sponsorship calculator
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">Resources</h4>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/methodology" className="hover:text-slate-900">
                Methodology
              </Link>
            </li>
            <li>
              <Link href="/disclaimer" className="hover:text-slate-900">
                Disclaimer
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-slate-900">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-slate-900">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-slate-900">
                Terms
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-slate-900">Data source</h4>
          <p className="mt-3 leading-relaxed">
            Public channel statistics are retrieved using the{" "}
            <a
              href="https://developers.google.com/youtube/v3"
              className="underline hover:text-slate-900"
              target="_blank"
              rel="noopener noreferrer"
            >
              YouTube Data API v3
            </a>
            . Revenue estimates are independently calculated.
          </p>
        </div>
      </div>
      <div className="container-page pb-8 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} {publicConfig.siteName}. Independent
        tool.
      </div>
    </footer>
  );
}
