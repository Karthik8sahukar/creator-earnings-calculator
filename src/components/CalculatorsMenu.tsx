"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { Link } from "@/i18n/navigation";
import {
  ChartIcon,
  ChevronDownIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "./icons";

/**
 * Calculators dropdown for the desktop header.
 *
 * All five items resolve to real routes:
 *   - Money Calculator ⇒ homepage (`/#find-channel`) so it scrolls
 *     to the search box on the home page.
 *   - RPM / CPM / Shorts / Sponsorship ⇒ existing calculator routes.
 *
 * Labels are translated per locale. Links use `@/i18n/navigation` so
 * the active locale prefix is applied automatically.
 *
 * A11y:
 *   - `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`.
 *   - ArrowDown from the trigger focuses the first item.
 *   - ArrowUp/ArrowDown roves focus. Escape closes and restores focus.
 *   - Outside click closes the menu.
 */
export function CalculatorsMenu({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  const t = useTranslations();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const focusItem = useCallback((index: number) => {
    const items = menuRef.current?.querySelectorAll<HTMLAnchorElement>(
      '[role="menuitem"]',
    );
    if (!items || items.length === 0) return;
    const wrapped = ((index % items.length) + items.length) % items.length;
    items[wrapped]?.focus();
  }, []);

  const onTriggerKey = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      requestAnimationFrame(() => focusItem(0));
    }
  };

  const onMenuKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLAnchorElement>('[role="menuitem"]') ?? [],
    );
    const active = document.activeElement as HTMLElement | null;
    const idx = items.findIndex((el) => el === active);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusItem(idx + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(idx - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      focusItem(0);
    } else if (e.key === "End") {
      e.preventDefault();
      focusItem(items.length - 1);
    } else if (e.key === "Tab") {
      // Let Tab move naturally, but close the menu on the way out.
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-200 dark:hover:text-white dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        {t("nav.calculators")}
        <ChevronDownIcon
          width={14}
          height={14}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("nav.calculators")}
          onKeyDown={onMenuKey}
          className="absolute left-0 mt-2 w-80 rounded-xl bg-white shadow-pop border border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50 overflow-hidden animate-fade-in"
        >
          <ul className="p-1.5">
            {CALCULATOR_LINKS.map(({ href, labelKey, descriptionKey, Icon }) => (
              <li key={href} role="none">
                <Link
                  href={href}
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800"
                >
                  <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                    <Icon width={18} height={18} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t(labelKey)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t(descriptionKey)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Menu items. Labels are message-key references (resolved at render
 * time) — the array itself is a pure data structure that can be
 * imported and reused by `MobileNav` without duplication.
 */
export interface CalculatorLink {
  href:
    | "/#find-channel"
    | "/youtube-rpm-calculator"
    | "/youtube-cpm-calculator"
    | "/youtube-shorts-calculator"
    | "/youtube-sponsorship-calculator"
    | "/instagram-money-calculator"
    | "/tools/channel-analyzer";
  labelKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

export const CALCULATOR_LINKS: CalculatorLink[] = [
  {
    href: "/#find-channel",
    labelKey: "calculatorsMenu.money.label",
    descriptionKey: "calculatorsMenu.money.description",
    Icon: DollarIcon,
  },
  {
    href: "/instagram-money-calculator",
    labelKey: "calculatorsMenu.instagram.label",
    descriptionKey: "calculatorsMenu.instagram.description",
    Icon: ShareIcon,
  },
  {
    // Channel Analyzer — a full-page inspection tool for any YouTube
    // channel. Placed here so it sits right below the two "money"
    // calculators, which are its most natural sibling links.
    href: "/tools/channel-analyzer",
    labelKey: "calculatorsMenu.channelAnalyzer.label",
    descriptionKey: "calculatorsMenu.channelAnalyzer.description",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-rpm-calculator",
    labelKey: "calculatorsMenu.rpm.label",
    descriptionKey: "calculatorsMenu.rpm.description",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-cpm-calculator",
    labelKey: "calculatorsMenu.cpm.label",
    descriptionKey: "calculatorsMenu.cpm.description",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-shorts-calculator",
    labelKey: "calculatorsMenu.shorts.label",
    descriptionKey: "calculatorsMenu.shorts.description",
    Icon: FilmIcon,
  },
  {
    href: "/youtube-sponsorship-calculator",
    labelKey: "calculatorsMenu.sponsorship.label",
    descriptionKey: "calculatorsMenu.sponsorship.description",
    Icon: ShareIcon,
  },
];
