"use client";

import { useT } from "@/lib/t";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import Link from "next/link";
import { MenuIcon, XIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";
import { CategoryIcon } from "./ui/Icon";
import { TOOL_CATEGORIES } from "@/lib/tools/categories";
import { getToolsByCategory } from "@/lib/tools";
import type { ToolCategoryId } from "@/lib/tools/registry";

// ─── Navigation Sections ────────────────────────────────────────────

const CREATORS_LINKS = [
  { href: "/creators", label: "Browse Creators" },
  { href: "/top-creators", label: "Top Creators" },
] as const;

const PRIMARY_LINKS = [
  { href: "/top-creators", label: "Rankings" },
  { href: "/blog", label: "Blog" },
] as const;

const ABOUT_LINKS = [
  { href: "/about", label: "About" },
  { href: "/methodology", label: "Methodology" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
] as const;

// ─── Component ──────────────────────────────────────────────────────

/**
 * Mobile navigation drawer — matches the new App Store navigation.
 *
 * Structure:
 *   - Search trigger (opens ToolSearchModal via Cmd+K dispatch)
 *   - Tools (expandable accordion by category — from registry)
 *   - Creators section
 *   - Primary links (Rankings, Blog)
 *   - About section
 *   - Footer: Currency / Language / Theme
 *
 * Full-height (100dvh), iOS safe-area aware, body scroll lock.
 */
export function MobileNav({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const t = useT();

  const close = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  // Escape key closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Body scroll lock (iOS-safe)
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = { overflow: body.style.overflow, position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => closeBtnRef.current?.focus());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !sheetRef.current) return;
      const focusables = getFocusable(sheetRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("common.actions.openMenu")}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <MenuIcon width={20} height={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] h-[100dvh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={dialogId}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label={t("common.actions.closeMenu")}
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in cursor-default"
          />

          {/* Drawer */}
          <div
            ref={sheetRef}
            className="absolute right-0 top-0 h-[100dvh] w-[86%] max-w-sm bg-white shadow-pop border-l border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col animate-fade-in"
            style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-slate-200 dark:border-slate-800" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
              <span id={titleId} className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Menu
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label={t("common.actions.closeMenu")}
                onClick={close}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
              >
                <XIcon width={18} height={18} />
              </button>
            </div>

            {/* Content */}
            <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Search trigger */}
              <button
                type="button"
                onClick={() => {
                  close();
                  requestAnimationFrame(() => {
                    document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
                  });
                }}
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-500 dark:text-slate-400"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                Search tools...
              </button>

              {/* Tools — accordion by category */}
              <NavSection title="Tools">
                {TOOL_CATEGORIES.map((cat) => {
                  const tools = getToolsByCategory(cat.id);
                  if (tools.length === 0) return null;
                  return (
                    <AccordionCategory key={cat.id} category={cat.id as ToolCategoryId} label={cat.label}>
                      {tools.slice(0, 8).map((tool) => (
                        <li key={tool.slug}>
                          <Link href={tool.href as never} onClick={close} className="block rounded-md px-3 py-1.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                            {tool.title}
                          </Link>
                        </li>
                      ))}
                    </AccordionCategory>
                  );
                })}
              </NavSection>

              {/* Creators */}
              <NavSection title="Creators">
                <ul className="space-y-0.5">
                  {CREATORS_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href as never} onClick={close} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavSection>

              {/* Primary */}
              <NavSection title="Explore">
                <ul className="space-y-0.5">
                  {PRIMARY_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href as never} onClick={close} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavSection>

              {/* About */}
              <NavSection title="About">
                <ul className="space-y-0.5">
                  {ABOUT_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href as never} onClick={close} className="block rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavSection>
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-end gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function NavSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}

function AccordionCategory({ category, label, children }: { category: ToolCategoryId; label: string; children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-1">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-brand-500/10 to-accent-500/10 text-brand-600 dark:text-brand-300">
          <CategoryIcon category={category} size={12} />
        </span>
        <span className="flex-1 text-left">{label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {expanded && (
        <ul className="ml-5 mt-0.5 space-y-0.5 animate-fade-in">
          {children}
        </ul>
      )}
    </div>
  );
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null,
  );
}
