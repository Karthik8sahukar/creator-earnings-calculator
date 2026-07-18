"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  ChartIcon,
  ChevronDownIcon,
  DollarIcon,
  FilmIcon,
  ShareIcon,
  TrendingUpIcon,
} from "./icons";

interface CalculatorLink {
  href: string;
  label: string;
  description: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

/**
 * Calculators dropdown for the desktop header.
 *
 * All five items exist as real routes/anchors — no placeholders.
 *   - Money Calculator ⇒ homepage (`/#find-channel`) so it scrolls to
 *     the search box on the home page.
 *   - RPM / CPM / Shorts / Sponsorship ⇒ existing calculator routes.
 *
 * Accessibility:
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
        Calculators
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
          aria-label="Calculators"
          onKeyDown={onMenuKey}
          className="absolute left-0 mt-2 w-80 rounded-xl bg-white shadow-pop border border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50 overflow-hidden animate-fade-in"
        >
          <ul className="p-1.5">
            {CALCULATORS.map(({ href, label, description, Icon }) => (
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
                      {label}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {description}
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

export const CALCULATORS: CalculatorLink[] = [
  {
    href: "/#find-channel",
    label: "YouTube Money Calculator",
    description: "Estimate a channel's monthly revenue.",
    Icon: DollarIcon,
  },
  {
    href: "/youtube-rpm-calculator",
    label: "RPM Calculator",
    description: "Revenue per 1,000 monetized views.",
    Icon: TrendingUpIcon,
  },
  {
    href: "/youtube-cpm-calculator",
    label: "CPM Calculator",
    description: "Advertiser cost per 1,000 impressions.",
    Icon: ChartIcon,
  },
  {
    href: "/youtube-shorts-calculator",
    label: "Shorts Calculator",
    description: "Estimate Shorts Creator Pool payouts.",
    Icon: FilmIcon,
  },
  {
    href: "/youtube-sponsorship-calculator",
    label: "Sponsorship Calculator",
    description: "Estimate brand deal rates.",
    Icon: ShareIcon,
  },
];
