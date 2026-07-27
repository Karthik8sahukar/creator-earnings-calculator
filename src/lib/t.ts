import { getT } from "@/lib/t";
import messages from "../../messages/en.json";

type Messages = typeof messages;

/**
 * Get a translation function scoped to a namespace.
 * Replaces useTranslations() and getTranslations() from next-intl.
 */
export function t(key: string, values?: Record<string, unknown>): string {
  const parts = key.split(".");
  let cursor: unknown = messages;
  for (const p of parts) {
    if (cursor == null || typeof cursor !== "object") return key;
    cursor = (cursor as Record<string, unknown>)[p];
  }
  if (typeof cursor !== "string") return key;
  if (!values) return cursor;
  return cursor.replace(/\{(\w+)(?:,[^}]*)?\}/g, (_, k) => {
    const v = values[k];
    if (v == null) return "";
    return String(v);
  });
}

/**
 * Get a scoped translation function (like useTranslations("namespace")).
 */
export function useT(namespace?: string) {
  return (key: string, values?: Record<string, unknown>): string => {
    const full = namespace ? `${namespace}.${key}` : key;
    return t(full, values);
  };
}

// Re-export for server components that used getTranslations
export const getT = useT;
