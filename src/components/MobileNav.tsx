"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { LanguageSelector } from "./LanguageSelector";
import { Link } from "@/i18n/navigation";
import { MenuIcon, XIcon } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

// ─── Navigation structure (mobile-specific organization) ────────────

interface NavItem {
  href: string;
  labelKey: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const MOBILE_SECTIONS: NavSection[] = [
  {
    title: "Creator Tools",
    items: [
      { href: "/#find-channel", labelKey: "calculatorsMenu.money.label" },
      { href: "/youtube-rpm-calculator", labelKey: "calculatorsMenu.rpm.label" },
      { href: "/youtube-cpm-calculator", labelKey: "calculatorsMenu.cpm.label" },
      { href: "/youtube-shorts-calculator", labelKey: "calculatorsMenu.shorts.label" },
      { href: "/youtube-sponsorship-calculator", labelKey: "calculatorsMenu.sponsorship.label" },
      { href: "/youtube-engagement-calculator", labelKey: "calculatorsMenu.engagement.label" },
      { href: "/youtube-adsense-calculator", labelKey: "calculatorsMenu.adsense.label" },
      { href: "/instagram-money-calculator", labelKey: "calculatorsMenu.instagram.label" },
      { href: "/twitch-bits-calculator", labelKey: "calculatorsMenu.twitchBits.label" },
    ],
  },
  {
    title: "Decision Tools",
    items: [
      { href: "/spin-the-wheel", labelKey: "calculatorsMenu.spinWheel.label" },
      { href: "/coin-flip", labelKey: "calculatorsMenu.coinFlip.label" },
      { href: "/dice-roller", labelKey: "calculatorsMenu.diceRoller.label" },
      { href: "/random-number-generator", labelKey: "calculatorsMenu.randomNumber.label" },
      { href: "/random-name-picker", labelKey: "calculatorsMenu.namePicker.label" },
      { href: "/yes-no-picker-wheel", labelKey: "calculatorsMenu.yesNoPicker.label" },
      { href: "/random-team-generator", labelKey: "calculatorsMenu.teamGenerator.label" },
    ],
  },
  {
    title: "Publisher Tools",
    items: [
      { href: "/website-revenue-estimator", labelKey: "calculatorsMenu.websiteRevenue.label" },
    ],
  },
  {
    title: "Resources",
    items: [
      { href: "/blog", labelKey: "nav.blog" },
      { href: "/creators", labelKey: "nav.creators" },
      { href: "/top-creators", labelKey: "nav.rankings" },
      { href: "/methodology", labelKey: "nav.methodology" },
      { href: "/about", labelKey: "nav.about" },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────────

/**
 * Mobile full-screen navigation drawer.
 *
 * Width: 100% on phones, 85% on small tablets, max 420px on tablets.
 * Each menu item is minimum 48px tall for comfortable touch.
 * Header stays fixed while content scrolls independently.
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

  // Escape key
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  // iOS-safe body scroll lock
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
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
      {/* Hamburger trigger — 44×44px */}
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

      {/* Full-screen drawer — rendered via portal to escape header's backdrop-filter containing block */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          id={dialogId}
        >
          {/* Backdrop — only visible on tablets where drawer doesn't fill screen */}
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm sm:block hidden"
            onClick={close}
            aria-hidden="true"
          />

          {/* Sheet — full width on phones, 85% on sm, max 420px on md */}
          <div
            ref={sheetRef}
            className="absolute right-0 top-0 h-full w-full sm:w-[85%] sm:max-w-[420px] bg-white shadow-2xl dark:bg-slate-950 flex flex-col"
            style={{ animation: "slideInRight 0.2s ease-out" }}
          >
            {/* Fixed header */}
            <div className="flex items-center justify-between h-16 px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <span
                id={titleId}
                className="text-base font-semibold text-slate-900 dark:text-slate-100"
              >
                {t("nav.menu")}
              </span>
              <button
                ref={closeBtnRef}
                type="button"
                aria-label={t("common.actions.closeMenu")}
                onClick={close}
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-colors"
              >
                <XIcon width={22} height={22} />
              </button>
            </div>

            {/* Scrollable navigation content */}
            <nav
              aria-label={t("nav.mobilePrimary")}
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6"
            >
              {MOBILE_SECTIONS.map((section) => (
                <div key={section.title}>
                  {/* Section heading */}
                  <h3 className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.title}
                  </h3>
                  {/* Items — each minimum 48px tall */}
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href as never}
                          onClick={close}
                          className="flex items-center min-h-[48px] rounded-xl px-4 py-3 text-[15px] font-medium text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800/80 dark:active:bg-slate-700 transition-colors"
                        >
                          {t(item.labelKey)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Fixed footer */}
            <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </div>
        </div>
      , document.body)}

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
