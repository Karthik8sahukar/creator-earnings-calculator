"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LanguageSelector } from "./LanguageSelector";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";
import { Search, Command, CategoryIcon } from "./ui/Icon";
import { getToolsByCategory, getPopularTools, getTotalToolCount } from "@/lib/tools";
import { TOOL_CATEGORIES } from "@/lib/tools/categories";
import type { ToolCategoryId } from "@/lib/tools/registry";

// ─── Constants ──────────────────────────────────────────────────────

const NAV_LINK_CLASS =
  "rounded-md px-2.5 py-1.5 text-sm font-medium hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60";

const CREATORS_LINKS = [
  { href: "/creators", label: "Browse Creators" },
  { href: "/top-creators", label: "Top Creators" },
] as const;

const COMPANY_LINKS = [
  { href: "/about", label: "About BeHumler" },
  { href: "/methodology", label: "Methodology" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

// ─── Header ─────────────────────────────────────────────────────────

/**
 * Site header — App Store for Tools navigation.
 *
 * Desktop: Logo | Tools▼ Creators▼ Rankings Blog About▼ | [🔍 Search ⌘K] Language Theme
 * Mobile: Logo | [🔍] Hamburger
 *
 * Currency selector removed from global nav (only shown on money calculators).
 */
export function Header() {
  const t = useTranslations();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-lg dark:border-slate-800/70 dark:bg-slate-950/80">
      <div className="container-page flex items-center justify-between gap-3 h-14 sm:h-16">
        <Logo size="md" />

        {/* Desktop navigation */}
        <nav
          aria-label={t("nav.primary")}
          className="hidden lg:flex items-center gap-0.5 text-sm text-slate-700 dark:text-slate-200"
        >
          <ToolsMegaMenu />
          <CreatorsDropdown />

          <Link href="/top-creators" className={NAV_LINK_CLASS}>
            Rankings
          </Link>
          <Link href="/blog" className={NAV_LINK_CLASS}>
            Blog
          </Link>

          <AboutDropdown />
        </nav>

        {/* Right side: search + utilities (no currency — only on money calculators) */}
        <div className="flex items-center gap-1.5">
          <SearchField />

          <div className="hidden lg:flex items-center gap-1">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          <MobileNav className="lg:hidden" />
        </div>
      </div>
    </header>
  );
}

// ─── Search Field (compact input-style trigger) ─────────────────────

/**
 * Compact search trigger styled as a mini input field.
 * Clicking dispatches Cmd+K to open the existing ToolSearchModal.
 */
function SearchField() {
  return (
    <button
      type="button"
      onClick={() => {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }),
        );
      }}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/40 pl-3 pr-2 py-1.5 text-sm text-slate-400 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 w-[140px] sm:w-[180px] lg:w-[200px]"
      aria-label="Search tools"
    >
      <Search size={14} className="shrink-0 text-slate-400 dark:text-slate-500" />
      <span className="flex-1 text-left text-[13px] truncate">Search tools...</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 shrink-0 rounded-md border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500">
        <Command size={9} />K
      </kbd>
    </button>
  );
}

// ─── Tools Mega Menu (visual category cards + Popular Tools) ────────

function ToolsMegaMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { close(); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const toolCount = getTotalToolCount();
  const popularTools = getPopularTools().slice(0, 5);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        Tools
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Browse {toolCount}+ Tools
            </span>
          </div>

          <div className="flex divide-x divide-slate-100 dark:divide-slate-800">
            {/* Left: Category cards grid */}
            <div className="flex-1 p-3 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                {TOOL_CATEGORIES.map((cat) => {
                  const tools = getToolsByCategory(cat.id);
                  if (tools.length === 0) return null;
                  return (
                    <Link
                      key={cat.id}
                      href={cat.href as never}
                      onClick={close}
                      className="group flex items-start gap-3 rounded-xl p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300 group-hover:from-brand-500/15 group-hover:to-accent-500/15 transition-colors">
                        <CategoryIcon category={cat.id as ToolCategoryId} size={16} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{cat.label}</span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-1.5 py-0.5">{tools.length}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {tools.slice(0, 3).map((t) => t.title).join(", ")}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right: Popular Tools sidebar */}
            <div className="w-56 xl:w-64 p-3 hidden lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">
                Popular Tools
              </p>
              <ul className="space-y-0.5">
                {popularTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={tool.href as never}
                      onClick={close}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-500/8 to-accent-500/8 text-brand-600 dark:text-brand-300">
                        <CategoryIcon category={tool.category} size={11} />
                      </span>
                      <span className="truncate">{tool.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Creators Dropdown ──────────────────────────────────────────────

function CreatorsDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        Creators
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in overflow-hidden py-1.5">
          {CREATORS_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── About Dropdown (grouped: Company / Legal) ──────────────────────

function AboutDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`${NAV_LINK_CLASS} inline-flex items-center gap-1`}
      >
        About
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl bg-white shadow-xl border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 z-50 animate-fade-in overflow-hidden py-2">
          {/* Company section */}
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Company
          </p>
          {COMPANY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              onClick={() => setOpen(false)}
              className="block px-4 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />

          {/* Legal section */}
          <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Legal
          </p>
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href as never}
              onClick={() => setOpen(false)}
              className="block px-4 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared Chevron Icon ────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
