/**
 * Local recent-search history. Storage-only, per-browser. Never sent to
 * the server. Silently no-ops if localStorage is unavailable (e.g.
 * private browsing quota errors).
 */

export interface RecentChannel {
  channelId: string;
  title: string;
  handle: string | null;
  thumbnail: string;
  at: number; // ms since epoch — for stable most-recent-first ordering
}

const STORAGE_KEY = "cec.recent-channels.v1";
export const RECENT_MAX = 8;
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,40}$/;

function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    // Some browsers throw on access when disabled.
    const s = window.localStorage;
    // Some engines require a write to detect quota errors.
    s.setItem("__cec_probe", "1");
    s.removeItem("__cec_probe");
    return s;
  } catch {
    return null;
  }
}

function isRecent(v: unknown): v is RecentChannel {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.channelId === "string" &&
    CHANNEL_ID_RE.test(r.channelId) &&
    typeof r.title === "string" &&
    (r.handle === null || typeof r.handle === "string") &&
    typeof r.thumbnail === "string" &&
    typeof r.at === "number"
  );
}

export function loadRecent(): RecentChannel[] {
  const storage = safeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[])
      .filter(isRecent)
      .sort((a, b) => b.at - a.at)
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

export function saveRecent(list: RecentChannel[]): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    const trimmed = list.slice(0, RECENT_MAX);
    storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota / serialization errors
  }
}

export function addRecent(
  current: RecentChannel[],
  entry: Omit<RecentChannel, "at">,
  now: number = Date.now(),
): RecentChannel[] {
  if (!CHANNEL_ID_RE.test(entry.channelId)) return current;
  const filtered = current.filter((c) => c.channelId !== entry.channelId);
  const next = [{ ...entry, at: now }, ...filtered].slice(0, RECENT_MAX);
  return next;
}

export function clearRecent(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
