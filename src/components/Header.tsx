import Link from "next/link";

import { publicConfig } from "@/lib/config";
import { LogoMark } from "./icons";

const CALCULATORS: { href: string; label: string }[] = [
  { href: "/youtube-rpm-calculator", label: "RPM" },
  { href: "/youtube-cpm-calculator", label: "CPM" },
  { href: "/youtube-shorts-calculator", label: "Shorts" },
  { href: "/youtube-sponsorship-calculator", label: "Sponsorship" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="container-page flex items-center justify-between gap-4 h-14">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-slate-900"
        >
          <LogoMark />
          <span className="tracking-tight hidden xs:inline sm:inline">
            {publicConfig.siteName}
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="flex items-center gap-4 text-sm text-slate-600 overflow-x-auto"
        >
          <div className="hidden md:flex items-center gap-3">
            {CALCULATORS.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="hover:text-slate-900 transition whitespace-nowrap"
              >
                {c.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-slate-200" aria-hidden />
          </div>
          <Link
            className="hover:text-slate-900 transition whitespace-nowrap"
            href="/methodology"
          >
            Methodology
          </Link>
          <Link
            className="hover:text-slate-900 transition whitespace-nowrap"
            href="/about"
          >
            About
          </Link>
          <a
            className="btn-secondary hidden sm:inline-flex"
            href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get API key
          </a>
        </nav>
      </div>
    </header>
  );
}
