"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * Newsletter signup card. UI-ONLY per spec — we do not have a real
 * mailing-list provider wired up. On submit we show a "we'll be in
 * touch" confirmation and clear the field. Nothing is sent anywhere.
 *
 * When the marketing team picks a provider (Buttondown, Beehiiv,
 * ConvertKit…), only the `onSubmit` handler needs to change.
 */
export function NewsletterCta() {
  const t = useTranslations("blog.newsletter");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <section
      aria-labelledby="newsletter-title"
      className="card p-6 sm:p-8 bg-gradient-to-br from-brand-50 via-white to-accent-500/5 dark:from-brand-500/10 dark:via-slate-900 dark:to-accent-500/5"
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2
          id="newsletter-title"
          className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50"
        >
          {t("title")}
        </h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
          {t("description")}
        </p>

        {submitted ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 px-4 py-3 text-sm"
          >
            {t("thanks")}
          </p>
        ) : (
          <form
            className="mt-6 flex flex-col sm:flex-row gap-2 sm:items-center"
            onSubmit={(e) => {
              e.preventDefault();
              // No network side effect yet — see file header.
              setSubmitted(true);
              setEmail("");
            }}
          >
            <label htmlFor="newsletter-email" className="sr-only">
              {t("emailPlaceholder")}
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input flex-1"
            />
            <button type="submit" className="btn-primary whitespace-nowrap">
              {t("subscribe")}
            </button>
          </form>
        )}

        <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
          {t("privacyNote")}
        </p>
      </div>
    </section>
  );
}
