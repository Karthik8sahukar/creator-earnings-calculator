/**
 * Input normalization layer for YouTube channel lookups.
 *
 * Supported inputs (Phase 3 — quota fix):
 *   - @handle (bare)
 *   - https://youtube.com/@handle
 *   - https://www.youtube.com/@handle
 *   - https://youtube.com/channel/UC...
 *   - https://www.youtube.com/channel/UC...
 *   - Raw UC... channel IDs
 *
 * Everything else is classified as "unsupported" and must be rejected
 * before reaching the YouTube API. No fuzzy searching is performed.
 */

export type ParsedQuery =
  | { kind: "channelId"; value: string }
  | { kind: "handle"; value: string }
  | { kind: "unsupported"; value: string };

const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const HANDLE_RE = /^@[A-Za-z0-9_.-]{1,60}$/;

/**
 * Parse a raw user query string into a structured lookup type.
 *
 * Returns `kind: "unsupported"` for anything that would previously
 * have triggered a search.list call (plain text, legacy /c/ URLs,
 * /user/ URLs, malformed input, etc.).
 */
export function parseChannelQuery(raw: string): ParsedQuery {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unsupported", value: "" };

  // Raw channel id (UC + 22 characters)
  if (CHANNEL_ID_RE.test(trimmed)) {
    return { kind: "channelId", value: trimmed };
  }

  // @handle (no URL, no slash)
  if (trimmed.startsWith("@") && !trimmed.includes("/")) {
    const handle = trimmed.slice(1);
    if (HANDLE_RE.test(`@${handle}`) && handle.length > 0) {
      return { kind: "handle", value: handle };
    }
    return { kind: "unsupported", value: trimmed };
  }

  // Try URL parsing for youtube.com links
  const looksLikeUrl =
    /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(trimmed);
  if (looksLikeUrl) {
    try {
      const url = new URL(
        trimmed.startsWith("http") ? trimmed : `https://${trimmed}`,
      );

      // Only accept youtube.com hosts
      const host = url.hostname.replace(/^www\./, "");
      if (host !== "youtube.com") {
        return { kind: "unsupported", value: trimmed };
      }

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length === 0) return { kind: "unsupported", value: trimmed };

      // /channel/UC...
      if (
        parts[0] === "channel" &&
        parts[1] &&
        CHANNEL_ID_RE.test(parts[1])
      ) {
        return { kind: "channelId", value: parts[1] };
      }

      // /@handle
      if (parts[0].startsWith("@")) {
        const handle = parts[0].slice(1);
        if (HANDLE_RE.test(`@${handle}`) && handle.length > 0) {
          return { kind: "handle", value: handle };
        }
      }

      // /c/name, /user/name, or anything else — unsupported
      return { kind: "unsupported", value: trimmed };
    } catch {
      return { kind: "unsupported", value: trimmed };
    }
  }

  // Plain text (e.g. "MrBeast", "Gaming channel", "hjbhj") — unsupported
  return { kind: "unsupported", value: trimmed };
}

/**
 * Human-friendly validation message for unsupported inputs.
 */
export const UNSUPPORTED_INPUT_MESSAGE =
  "Enter a valid YouTube @handle, channel URL, or channel ID.";
