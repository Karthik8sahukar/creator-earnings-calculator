"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { CALCULATOR_CATEGORIES } from "./CalculatorsMenu";
import { LanguageSelector } from "./LanguageSelector";
import { Link } from "@/i18n/navigation";
import { MenuIcon, XIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

const PRIMARY_LINKS = [
  { href: "/blog" as const, labelKey: "nav.blog" },
  { href: "/creators" as const, labelKey: "nav.creators" },
  { href: "/methodology" as const, labelKey: "nav.methodology" },
  { href: "/about" as const, labelKey: "nav.about" },
] as const;

/**
 * Mobile-only slide-in navigation drawer.
 *
 * Fixed issues:
 *   - Hamburger button has explicit 44×44px touch target with no wrapper interference
 *   - Drawer uses translateX animation (not opacity-only) for reliable slide-in
 *   - Body scroll lock uses both overflow:hidden AND position:fixed to prevent iOS bounce
 *   - Z-index explicitly set higher than header (z-40 → drawer z-[70])
 *   - Focus trap properly handles dynamic content
 *   - Close on: Escape, backdrop click, link click, X button
 */
export function MobileNav({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dialogId = useId();
  const titleId = `${dialogId}-title`;
  const t = useTranslations();

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

  // Body scroll lock — handles iOS Safari + prevents scrollbar layout shift
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPosition = body.style.position;
    const prevTop = body.style.top;
    const prevWidth = body.style.width;

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      body.style.overflow = prevOverflow;
      body.style.position = prevPosition;
      body.style.top = prevTop;
      body.style.width = prevWidth;
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
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className={className}>
      {/* Hamburger — 44×44px minimum touch target, explicit positioning */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("common.actions.openMenu")}
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
        onClick={() => setOpen(true)}
        className="relative z-10 inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-colors"
      >
        <MenuIcon width={22} height={22} />
      </button>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={dialogId}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />

          {/* Sheet — slides in from right */}
          <div
            ref={sheetRef}
            className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white shadow-2xl border-l border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col"
            style={{ animation: "slideInRight 0.25s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <span
                id={titleId}
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                {t("nav.menu")}
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label={t("common.actions.closeMenu")}
                onClick={close}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-colors"
              >
                <XIcon width={20} height={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <nav
              aria-label={t("nav.mobilePrimary")}
              className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5"
            >
              {/* Tool categories */}
              {CALCULATOR_CATEGORIES.map((category) => (
                <div key={category.headingKey}>
                  <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {t(category.headingKey)}
                  </p>
                  <ul className="space-y-0.5">
                    {category.links.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={close}
                          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700 transition-colors"
                        >
                          {t(c.labelKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Resources */}
              <div>
                <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Resources
                </p>
                <ul className="space-y-0.5">
                  {PRIMARY_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={close}
                        className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700 transition-colors"
                      >
                        {t(l.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-2 shrink-0">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}

      {/* Keyframe for slide-in — injected once */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </div>
  );
}

function getFocusable(root: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("aria-hidden") && el.offsetParent !== null,
  );
}
