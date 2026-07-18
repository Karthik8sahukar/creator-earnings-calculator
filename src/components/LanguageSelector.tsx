"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon, GlobeIcon } from "./icons";

interface Locale {
  code: string;
  name: string;   // native name
  english: string; // for a11y
}

/**
 * Locale menu — UI ONLY.
 *
 * The dropdown is fully functional (keyboard-navigable, persists the
 * chosen locale to localStorage) but does NOT trigger any translation:
 * the whole app is still English, and metadata / content is unchanged.
 *
 * When we wire up next-intl later, only the click handler needs to
 * change (call `router.replace('/', { locale })` etc.). Everything
 * else here is already in the right shape.
 */
const LOCALES: readonly Locale[] = [
  { code: "en", name: "English", english: "English" },
  { code: "hi", name: "हिन्दी", english: "Hindi" },
  { code: "es", name: "Español", english: "Spanish" },
  { code: "pt", name: "Português", english: "Portuguese" },
  { code: "de", name: "Deutsch", english: "German" },
  { code: "fr", name: "Français", english: "French" },
  { code: "ja", name: "日本語", english: "Japanese" },
] as const;

const STORAGE_KEY = "behumler:locale";

function readInitialLocale(): string {
  if (typeof window === "undefined") return "en";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && LOCALES.some((l) => l.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  return "en";
}

export function LanguageSelector({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("en");
  const [mounted, setMounted] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);
  const labelId = useId();

  // Read localStorage after mount to avoid hydration mismatch.
  useEffect(() => {
    setSelected(readInitialLocale());
    setMounted(true);
  }, []);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDocPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocPointer);
    return () => document.removeEventListener("mousedown", onDocPointer);
  }, [open]);

  // Close on Escape (globally when open) and restore focus to the button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const choose = useCallback(
    (code: string) => {
      setSelected(code);
      try {
        window.localStorage.setItem(STORAGE_KEY, code);
      } catch {
        /* ignore */
      }
      setOpen(false);
      buttonRef.current?.focus();
    },
    [],
  );

  // Roving focus with ArrowUp/ArrowDown when the menu is open.
  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    if (!menuRef.current) return;
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>('button[role="menuitemradio"]'),
    );
    if (items.length === 0) return;
    const currentIndex = items.findIndex((el) => el === document.activeElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[(currentIndex + 1 + items.length) % items.length];
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[(currentIndex - 1 + items.length) % items.length];
      prev?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const current = LOCALES.find((l) => l.code === selected) ?? LOCALES[0];

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${labelId}-menu` : undefined}
        aria-label={`Language — ${current.english} selected. Translations coming soon.`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
            // Focus first item after render.
            requestAnimationFrame(() => {
              const first = menuRef.current?.querySelector<HTMLButtonElement>(
                'button[role="menuitemradio"]',
              );
              first?.focus();
            });
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 h-9 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
      >
        <GlobeIcon width={16} height={16} />
        <span className="hidden sm:inline-block max-w-[6ch] truncate" suppressHydrationWarning>
          {mounted ? current.name : "English"}
        </span>
        <ChevronDownIcon
          width={14}
          height={14}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 min-w-[16rem] rounded-xl bg-white shadow-pop border border-slate-200 dark:bg-slate-900 dark:border-slate-800 z-50 overflow-hidden"
        >
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Language
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              UI preview only — translations coming soon.
            </p>
          </div>
          <ul
            ref={menuRef}
            id={`${labelId}-menu`}
            role="menu"
            aria-label="Choose language"
            onKeyDown={onMenuKeyDown}
            className="py-1"
          >
            {LOCALES.map((loc) => {
              const isSelected = loc.code === selected;
              return (
                <li key={loc.code} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    tabIndex={-1}
                    onClick={() => choose(loc.code)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left transition ${
                      isSelected
                        ? "bg-brand-50 text-brand-800 dark:bg-brand-500/10 dark:text-brand-100"
                        : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{loc.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {loc.english}
                      </span>
                    </span>
                    {isSelected && <CheckIcon width={16} height={16} />}
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
