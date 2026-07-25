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

// ─── Categorized link definitions ───────────────────────────────────

export interface CalculatorLink {
  href:
    | "/#find-channel"
    | "/youtube-rpm-calculator"
    | "/youtube-cpm-calculator"
    | "/youtube-shorts-calculator"
    | "/youtube-sponsorship-calculator"
    | "/instagram-money-calculator"
    | "/youtube-engagement-calculator"
    | "/youtube-affiliate-calculator"
    | "/youtube-membership-calculator"
    | "/youtube-merch-calculator"
    | "/youtube-channel-valuation-calculator"
    | "/youtube-adsense-calculator"
    | "/twitch-bits-calculator"
    | "/yes-no-picker-wheel"
    | "/random-team-generator"
    | "/spin-the-wheel"
    | "/coin-flip"
    | "/dice-roller"
    | "/random-number-generator"
    | "/random-name-picker"
    | "/character-counter"
    | "/word-counter"
    | "/random-color-generator"
    | "/truth-or-dare-generator"
    | "/decision-tools"
    | "/creator-tools"
    | "/developer-tools"
    | "/jwt-decoder"
    | "/json-formatter"
    | "/base64-encoder-decoder"
    | "/uuid-generator"
    | "/cron-expression-generator"
    | "/unix-timestamp-converter"
    | "/url-encoder-decoder"
    | "/regex-tester"
    | "/sql-to-json-converter"
    | "/csv-to-json-converter";
  labelKey: string;
  descriptionKey: string;
  Icon: (props: { width?: number; height?: number }) => React.ReactElement;
}

export interface CalculatorCategory {
  headingKey: string;
  links: CalculatorLink[];
}

export const CALCULATOR_CATEGORIES: CalculatorCategory[] = [
  {
    headingKey: "calculatorsMenu.headings.creatorAnalytics",
    links: [
      { href: "/#find-channel", labelKey: "calculatorsMenu.money.label", descriptionKey: "calculatorsMenu.money.description", Icon: DollarIcon },
      { href: "/youtube-rpm-calculator", labelKey: "calculatorsMenu.rpm.label", descriptionKey: "calculatorsMenu.rpm.description", Icon: TrendingUpIcon },
      { href: "/youtube-cpm-calculator", labelKey: "calculatorsMenu.cpm.label", descriptionKey: "calculatorsMenu.cpm.description", Icon: ChartIcon },
      { href: "/youtube-shorts-calculator", labelKey: "calculatorsMenu.shorts.label", descriptionKey: "calculatorsMenu.shorts.description", Icon: FilmIcon },
      { href: "/youtube-sponsorship-calculator", labelKey: "calculatorsMenu.sponsorship.label", descriptionKey: "calculatorsMenu.sponsorship.description", Icon: ShareIcon },
      { href: "/youtube-engagement-calculator", labelKey: "calculatorsMenu.engagement.label", descriptionKey: "calculatorsMenu.engagement.description", Icon: TrendingUpIcon },
      { href: "/youtube-adsense-calculator", labelKey: "calculatorsMenu.adsense.label", descriptionKey: "calculatorsMenu.adsense.description", Icon: DollarIcon },
      { href: "/instagram-money-calculator", labelKey: "calculatorsMenu.instagram.label", descriptionKey: "calculatorsMenu.instagram.description", Icon: ShareIcon },
    ],
  },
  {
    headingKey: "calculatorsMenu.headings.streaming",
    links: [
      { href: "/twitch-bits-calculator", labelKey: "calculatorsMenu.twitchBits.label", descriptionKey: "calculatorsMenu.twitchBits.description", Icon: DollarIcon },
    ],
  },
  {
    headingKey: "calculatorsMenu.headings.utilities",
    links: [
      { href: "/yes-no-picker-wheel", labelKey: "calculatorsMenu.yesNoPicker.label", descriptionKey: "calculatorsMenu.yesNoPicker.description", Icon: ChartIcon },
      { href: "/random-team-generator", labelKey: "calculatorsMenu.teamGenerator.label", descriptionKey: "calculatorsMenu.teamGenerator.description", Icon: ShareIcon },
      { href: "/character-counter", labelKey: "calculatorsMenu.characterCounter.label", descriptionKey: "calculatorsMenu.characterCounter.description", Icon: TrendingUpIcon },
      { href: "/word-counter", labelKey: "calculatorsMenu.wordCounter.label", descriptionKey: "calculatorsMenu.wordCounter.description", Icon: TrendingUpIcon },
      { href: "/random-color-generator", labelKey: "calculatorsMenu.colorGenerator.label", descriptionKey: "calculatorsMenu.colorGenerator.description", Icon: ChartIcon },
    ],
  },
  {
    headingKey: "calculatorsMenu.headings.decisionTools",
    links: [
      { href: "/spin-the-wheel", labelKey: "calculatorsMenu.spinWheel.label", descriptionKey: "calculatorsMenu.spinWheel.description", Icon: ChartIcon },
      { href: "/coin-flip", labelKey: "calculatorsMenu.coinFlip.label", descriptionKey: "calculatorsMenu.coinFlip.description", Icon: DollarIcon },
      { href: "/dice-roller", labelKey: "calculatorsMenu.diceRoller.label", descriptionKey: "calculatorsMenu.diceRoller.description", Icon: FilmIcon },
      { href: "/random-number-generator", labelKey: "calculatorsMenu.randomNumber.label", descriptionKey: "calculatorsMenu.randomNumber.description", Icon: TrendingUpIcon },
      { href: "/random-name-picker", labelKey: "calculatorsMenu.namePicker.label", descriptionKey: "calculatorsMenu.namePicker.description", Icon: ShareIcon },
      { href: "/truth-or-dare-generator", labelKey: "calculatorsMenu.truthOrDare.label", descriptionKey: "calculatorsMenu.truthOrDare.description", Icon: FilmIcon },
    ],
  },
  {
    headingKey: "calculatorsMenu.headings.developerTools",
    links: [
      { href: "/json-formatter", labelKey: "calculatorsMenu.jsonFormatter.label", descriptionKey: "calculatorsMenu.jsonFormatter.description", Icon: ChartIcon },
      { href: "/jwt-decoder", labelKey: "calculatorsMenu.jwtDecoder.label", descriptionKey: "calculatorsMenu.jwtDecoder.description", Icon: DollarIcon },
      { href: "/base64-encoder-decoder", labelKey: "calculatorsMenu.base64.label", descriptionKey: "calculatorsMenu.base64.description", Icon: TrendingUpIcon },
      { href: "/uuid-generator", labelKey: "calculatorsMenu.uuidGenerator.label", descriptionKey: "calculatorsMenu.uuidGenerator.description", Icon: ShareIcon },
      { href: "/regex-tester", labelKey: "calculatorsMenu.regexTester.label", descriptionKey: "calculatorsMenu.regexTester.description", Icon: DollarIcon },
      { href: "/unix-timestamp-converter", labelKey: "calculatorsMenu.timestamp.label", descriptionKey: "calculatorsMenu.timestamp.description", Icon: ChartIcon },
    ],
  },
];

/** Flat list for backward compat. */
export const CALCULATOR_LINKS: CalculatorLink[] = CALCULATOR_CATEGORIES.flatMap(
  (cat) => cat.links,
);

// ─── Component ──────────────────────────────────────────────────────

/**
 * Calculators dropdown for the desktop header — categorized.
 *
 * A11y:
 *   - `aria-haspopup="menu"`, `aria-expanded`, `aria-controls`.
 *   - ArrowDown from the trigger focuses the first item.
 *   - ArrowUp/ArrowDown roves focus. Escape closes and restores focus.
 *   - Outside click closes the menu.
 *   - Category headings are not focusable (decoration only).
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
          className="absolute left-0 mt-2 w-80 max-h-[70vh] rounded-xl bg-white shadow-pop border border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50 overflow-y-auto animate-fade-in"
        >
          <div className="p-1.5">
            {CALCULATOR_CATEGORIES.map((category, catIdx) => (
              <div key={category.headingKey}>
                {catIdx > 0 && (
                  <div className="my-1.5 border-t border-slate-100 dark:border-slate-800" />
                )}
                <p
                  className="px-2.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                  aria-hidden="true"
                >
                  {t(category.headingKey)}
                </p>
                <ul>
                  {category.links.map(({ href, labelKey, descriptionKey, Icon }) => (
                    <li key={href} role="none">
                      <Link
                        href={href}
                        role="menuitem"
                        tabIndex={-1}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800"
                      >
                        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-200">
                          <Icon width={16} height={16} />
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {t(labelKey)}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {t(descriptionKey)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
