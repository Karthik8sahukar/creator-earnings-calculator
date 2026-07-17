import Link from "next/link";
import { LogoMark } from "./icons";
import { publicConfig } from "@/lib/config";

export function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/70 backdrop-blur sticky top-0 z-40">
      <div className="container-page flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">
          <LogoMark />
          <span className="tracking-tight">{publicConfig.siteName}</span>
        </Link>
        <nav aria-label="Primary" className="hidden sm:flex items-center gap-6 text-sm text-slate-600">
          <Link className="hover:text-slate-900 transition" href="/methodology">
            Methodology
          </Link>
          <Link className="hover:text-slate-900 transition" href="/about">
            About
          </Link>
          <a
            className="btn-secondary"
            href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
            target="_blank"
            rel="noreferrer"
          >
            Get API key
          </a>
        </nav>
      </div>
    </header>
  );
}
