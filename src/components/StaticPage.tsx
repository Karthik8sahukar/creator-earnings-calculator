import { useT } from "@/lib/t";

import Link from "next/link";
import { legalLastUpdatedIso } from "@/lib/config";

interface Props {
  title: string;
  description?: string;
  /**
   * Show a "Last updated" footer. Defaults to the centralized
   * `legalLastUpdatedIso` from `src/lib/config.ts`. Pass `false`
   * to omit (e.g. for pages that are not legal in nature).
   */
  lastUpdated?: string | false;
  children: React.ReactNode;
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

export function StaticPage({
  title,
  description,
  lastUpdated = legalLastUpdatedIso,
  children,
}: Props) {
  const t = useT("static");
  return (
    <article className="prose prose-slate max-w-3xl mx-auto">
      <p className="text-xs text-slate-500 not-prose">
        <Link href="/" className="hover:underline">
          {t("backToHome")}
        </Link>
      </p>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-slate-600 text-lg leading-relaxed">
          {description}
        </p>
      )}
      {lastUpdated && (
        <p className="mt-3 text-sm text-slate-500 not-prose">
          {t("lastUpdated")}{" "}
          <time dateTime={lastUpdated}>{formatDate(lastUpdated)}</time>
        </p>
      )}
      <div className="mt-8 space-y-5 text-slate-700 leading-relaxed">
        {children}
      </div>
    </article>
  );
}
