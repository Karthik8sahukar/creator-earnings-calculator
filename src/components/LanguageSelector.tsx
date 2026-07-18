"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useParams } from "next/navigation";

import { CheckIcon, ChevronDownIcon, GlobeIcon } from "./icons";
import { usePathname, useRouter } from "@/i18n/navigation";
import { LOCALE_LABELS, routing, type AppLocale } from "@/i18n/routing";

/**
 * Locale switcher — real next-intl navigation, redesigned styling.
 *
 * When the user picks a language:
 *   1. We compute the equivalent URL in the new locale (same pathname,
 *      same route params, same query string, same hash).
 *   2. We call `router.replace(pathname, { locale })` — next-intl
 *      swaps the locale prefix without touching any other route state
 *      (channel ID, calculator params, etc. all survive).
 *   3. next-intl writes the `BEHUMLER_LOCALE` cookie so the choice
 *      persists across sessions AND is readable by the middleware on
 *      subsequent visits.
 *
 * A11y:
 *   - `aria-haspopup="menu"` + `aria-expanded` on the trigger.
 *   - Roving focus (ArrowUp/Down, Home, End) inside the menu.
 *   - Escape closes and restores focus to the trigger.
 *   - Outside-click closes the menu.
 *   - Language names are shown in their own script (हिन्दी, 日本語, …)
 *     with the English name below for accessibility, and every native
 *     name carries `lang={code}` so screen readers pronounce it right.
 */
export function LanguageSelector({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const menuId = useId();
  const t = useTranslations("languageSelector");

  const activeLocale = useLocale() as AppLocale;
  const pathname = usePathname();
  const routeParams = useParams();
  const router = useRouter();

  const activeLabel = LOCALE_LABELS[activeLocale] ?? LOCALE_LABELS.en;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const choose = useCallback(
    (locale: AppLocale) => {
      setOpen(false);
      buttonRef.current?.focus();

      // Read the search string and hash at click time from the browser
      // directly. This avoids `useSearchParams`, which would force a
      // static-rendering bailout on every page that mounts the language
      // menu. By the time the user clicks, the route is already
      // client-side, so reading window.location is safe and correct.
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const hash =
        typeof window !== "undefined" ? window.location.hash : "";
      const path = (pathname || "/") + search + hash;

      startTransition(() => {
        router.replace(path, {
          locale,
          // Preserve dynamic route params ({ channelId } etc.) so deep
          // pages like /channel/UC... survive the switch.
          ...(Object.keys(routeParams ?? {}).length > 0
            ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
              { params: routeParams as any }
            : {}),
        });
      });
    },
    [pathname, router, routeParams],
  );

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>(
        'button[role="menuitemradio"]',
      ) ?? [],
    );
    if (items.length === 0) return;
    const idx = items.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(idx + 1 + items.length) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
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
        aria-label={t("ariaLabel")}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => {
              menuRef.current
                ?.querySelector<HTMLButtonElement>('button[role="menuitemradio"]')
                ?.focus();
            });
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 h-9 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <GlobeIcon width={16} height={16} />
        <span
          className="hidden sm:inline-block max-w-[8ch] truncate"
          lang={activeLocale}
        >
          {activeLabel.native}
        </span>
        <ChevronDownIcon
          width={14}
          height={14}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 min-w-[16rem] rounded-xl bg-white shadow-pop border border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50 overflow-hidden animate-fade-in">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("menuHeading")}
            </p>
          </div>
          <ul
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={t("ariaLabel")}
            onKeyDown={onMenuKeyDown}
            className="py-1"
          >
            {routing.locales.map((loc) => {
              const label = LOCALE_LABELS[loc];
              const isActive = loc === activeLocale;
              return (
                <li key={loc} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    tabIndex={-1}
                    onClick={() => choose(loc)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left transition ${
                      isActive
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium" lang={loc}>
                        {label.native}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {label.english}
                      </span>
                    </span>
                    {isActive && <CheckIcon width={16} height={16} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
