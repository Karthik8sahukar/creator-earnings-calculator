"use client";

import { useTranslations } from "next-intl";
import { useCallback, useState, useTransition } from "react";

import { SearchIcon, XIcon } from "@/components/icons";
import { usePathname, useRouter } from "@/i18n/navigation";

interface Props {
  /**
   * Value the user last submitted (used to pre-populate the input
   * after a server-rendered analysis). We do NOT wire this to
   * `useSearchParams` — the parent server component reads the URL
   * and passes the value down explicitly. That keeps this island
   * as small as possible and avoids opting the whole tree into
   * client-side dynamic rendering.
   */
  initialValue?: string;
  autoFocus?: boolean;
}

/**
 * Channel Analyzer input form.
 *
 * A pure client island that submits the pasted URL / handle / id via
 * `router.push(?q=...)`. All parsing + normalization + fetching
 * happens on the server, so this component knows nothing about
 * YouTube — it just captures the raw string and lets the page's
 * server data flow do the rest.
 *
 * UX rules:
 *   • Enter or the button submit both work.
 *   • Empty submissions clear the query string (returning to the
 *     landing state) rather than surfacing an error — matches how
 *     `?q=` behaves everywhere else on the site.
 *   • While the transition is pending we mark `aria-busy` and disable
 *     the button, keeping the form itself accessible.
 *   • The clear (×) button clears both the local state and the URL
 *     query, and returns focus to the input.
 */
export function ChannelInput({ initialValue = "", autoFocus = false }: Props) {
  const t = useTranslations("tools.channelAnalyzer.input");
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      startTransition(() => {
        if (trimmed) {
          router.push(`${pathname}?q=${encodeURIComponent(trimmed)}`);
        } else {
          router.push(pathname);
        }
      });
    },
    [value, router, pathname],
  );

  const clear = useCallback(() => {
    setValue("");
    startTransition(() => {
      router.push(pathname);
    });
  }, [pathname, router]);

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-label={t("formAria")}
      aria-busy={isPending}
      className="w-full space-y-3 sm:space-y-0 sm:flex sm:items-stretch sm:gap-3"
      data-testid="channel-analyzer-input"
    >
      <div className="relative flex-1">
        <label htmlFor="channel-analyzer-query" className="sr-only">
          {t("label")}
        </label>
        <SearchIcon
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          width={20}
          height={20}
        />
        <input
          id="channel-analyzer-query"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t("placeholder")}
          aria-describedby="channel-analyzer-help"
          className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-12 py-4 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 shadow-card focus:border-brand-400 focus:ring-4 focus:ring-brand-100 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        />
        {value && (
          <button
            type="button"
            aria-label={t("clearAria")}
            onClick={clear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800"
          >
            <XIcon />
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary justify-center sm:min-w-[10rem] disabled:opacity-70 disabled:cursor-progress"
        data-testid="channel-analyzer-submit"
      >
        {isPending ? t("analyzing") : t("submit")}
      </button>
      <p id="channel-analyzer-help" className="sr-only">
        {t("helpSr")}
      </p>
    </form>
  );
}
