/**
 * Unix timestamp conversion utilities.
 */

export interface TimestampResult {
  seconds: number;
  milliseconds: number;
  iso: string;
  utc: string;
  local: string;
  localTimezone: string;
  relative: string;
}

/** Detect if a number is seconds or milliseconds. */
export function detectUnit(value: number): "seconds" | "milliseconds" {
  // Timestamps in milliseconds are typically > 1e12 (after ~2001)
  if (Math.abs(value) > 1e12) return "milliseconds";
  return "seconds";
}

/** Convert Unix timestamp to date info. */
export function timestampToDate(value: number, unit?: "seconds" | "milliseconds"): TimestampResult {
  const detectedUnit = unit || detectUnit(value);
  const ms = detectedUnit === "seconds" ? value * 1000 : value;
  const date = new Date(ms);
  if (isNaN(date.getTime())) throw new Error("Invalid timestamp");

  const seconds = Math.floor(ms / 1000);
  const milliseconds = ms;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    seconds,
    milliseconds,
    iso: date.toISOString(),
    utc: date.toUTCString(),
    local: date.toLocaleString(undefined, { timeZone: tz, dateStyle: "full", timeStyle: "long" }),
    localTimezone: tz,
    relative: getRelativeTime(date),
  };
}

/** Convert Date to Unix timestamps. */
export function dateToTimestamp(date: Date): { seconds: number; milliseconds: number } {
  const ms = date.getTime();
  return { seconds: Math.floor(ms / 1000), milliseconds: ms };
}

/** Get relative time string. */
function getRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const absDiff = Math.abs(diff);
  const past = diff > 0;
  const prefix = past ? "" : "in ";
  const suffix = past ? " ago" : "";

  if (absDiff < 60000) return past ? "just now" : "in a moment";
  if (absDiff < 3600000) return `${prefix}${Math.round(absDiff / 60000)} minutes${suffix}`;
  if (absDiff < 86400000) return `${prefix}${Math.round(absDiff / 3600000)} hours${suffix}`;
  if (absDiff < 2592000000) return `${prefix}${Math.round(absDiff / 86400000)} days${suffix}`;
  if (absDiff < 31536000000) return `${prefix}${Math.round(absDiff / 2592000000)} months${suffix}`;
  return `${prefix}${Math.round(absDiff / 31536000000)} years${suffix}`;
}

/** Get current Unix timestamp. */
export function currentTimestamp(): { seconds: number; milliseconds: number } {
  const now = Date.now();
  return { seconds: Math.floor(now / 1000), milliseconds: now };
}
