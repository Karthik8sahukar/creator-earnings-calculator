import Image from "next/image";
import Link from "next/link";

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
          className="flex items-center"
          aria-label="BeHumler — home"
        >
          <Image
            src="/behumler-logo.png"
            alt="BeHumler"
            width={180}
            height={60}
            priority
            className="h-10 w-auto object-contain"
          />
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
        </nav>
      </div>
    </header>
  );
}
