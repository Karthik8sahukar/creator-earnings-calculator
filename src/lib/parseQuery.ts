/**
 * Detect what kind of YouTube identifier the user typed.
 *
 * Supports:
 *   - Raw channel id: UC...
 *   - @handle
 *   - youtube.com/@handle
 *   - youtube.com/channel/UC...
 *   - youtube.com/c/name  (legacy - we treat as name search)
 *   - youtube.com/user/name (legacy - we treat as name search)
 *   - Anything else -> free-text channel name search
 */

export type ParsedQuery =
  | { kind: "channelId"; value: string }
  | { kind: "handle"; value: string }
  | { kind: "name"; value: string };

const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,40}$/;

export function parseChannelQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "name", value: "" };

  // Raw channel id
  if (CHANNEL_ID_RE.test(trimmed)) {
    return { kind: "channelId", value: trimmed };
  }

  // @handle (no URL)
  if (trimmed.startsWith("@") && !trimmed.includes("/")) {
    return { kind: "handle", value: trimmed.slice(1) };
  }

  // Try URL
  const looksLikeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed);
  if (looksLikeUrl) {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      );
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length === 0) return { kind: "name", value: trimmed };

      // /channel/UC...
      if (parts[0] === "channel" && parts[1] && CHANNEL_ID_RE.test(parts[1])) {
        return { kind: "channelId", value: parts[1] };
      }

      // /@handle
      if (parts[0].startsWith("@")) {
        return { kind: "handle", value: parts[0].slice(1) };
      }

      // /c/name or /user/name -> fall back to name
      if ((parts[0] === "c" || parts[0] === "user") && parts[1]) {
        return { kind: "name", value: decodeURIComponent(parts[1]) };
      }

      // last resort
      return { kind: "name", value: decodeURIComponent(parts.join(" ")) };
    } catch {
      // fall through
    }
  }

  return { kind: "name", value: trimmed };
}
