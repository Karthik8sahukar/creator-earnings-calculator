"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { CALCULATOR_LINKS } from "./CalculatorsMenu";
import { LanguageSelector } from "./LanguageSelector";
import { Link } from "@/i18n/navigation";
import { MenuIcon, XIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

const PRIMARY_LINKS = [
  { href: "/methodology", labelKey: "nav.methodology" },
  { href: "/about", labelKey: "nav.about" },
] as const;

/**
 * Mobile-only slide-in nav.
 *
 * A11y:
 *   - Trigger button has `aria-label`, `aria-expanded`, `aria-controls`.
 *   - Sheet is `role="dialog"` `aria-modal="true"` with a labelled heading.
 *   - Focus is trapped inside the sheet while it's open. Focus returns
 *     to the trigger on close.
 *   - Closes on: Escape, click on the backdrop, and after any nav link.
 *   - Body scroll is locked while open.
 *   - All visible text is translated per locale.
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // Body scroll lock while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Focus trap.
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
          className="fixed inset-0 z-[60]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={dialogId}
        >
          {/* Backdrop — clicking closes. */}
          <button
            type="button"
            aria-label={t("common.actions.closeMenu")}
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm animate-fade-in cursor-default"
          />

          <div
            ref={sheetRef}
            className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-pop border-l border-slate-200 dark:bg-slate-950 dark:border-slate-800 flex flex-col animate-fade-in"
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800">
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
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
              >
                <XIcon width={18} height={18} />
              </button>
            </div>

            <nav
              aria-label={t("nav.mobilePrimary")}
              className="flex-1 overflow-y-auto p-3"
            >
              <div>
                <p className="px-3 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("nav.calculators")}
                </p>
                <ul className="mb-4 space-y-0.5">
                  {CALCULATOR_LINKS.map((c) => (
                    <li key={c.href}>
                      <Link
                        href={c.href}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        {t(c.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="px-3 pt-1 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("footer.company")}
                </p>
                <ul className="space-y-0.5">
                  <li>
                    <Link
                      href="/blog"
                      onClick={close}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      {t("nav.blog")}
                    </Link>
                  </li>
                  {PRIMARY_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        onClick={close}
                        className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        {t(l.labelKey)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>

            <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
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
