/**
 * Channel Analyzer — input normalization.
 *
 * The Channel Analyzer accepts any of:
 *
 *   • Raw channel id                    "UCX6OQ3DkcsbYNE6H8uQQuVA"
 *   • Handle (with or without @)        "@MrBeast" / "MrBeast"
 *   • Handle URL                        "https://www.youtube.com/@MrBeast"
 *   • Channel URL                       "https://www.youtube.com/channel/UC..."
 *   • Legacy /c/ or /user/ URLs         "https://www.youtube.com/c/PewDiePie"
 *   • Free-text channel name            "Kurzgesagt"
 *
 * All the URL / prefix / channel-id detection logic already lives in
 * `parseChannelQuery` (used by the site-wide search box + creator
 * profile resolver). We deliberately reuse it here rather than write
 * a parallel parser — a single source of truth means the Channel
 * Analyzer honours the exact same set of accepted inputs as the rest
 * of BeHumler.
 *
 * The wrapper below adds three things on top of `parseChannelQuery`:
 *
 *   1. A stable `NormalizedChannelInput` shape (kind + value + raw)
 *      that the analyzer + UI can pass around without re-parsing.
 *
 *   2. A `usable` flag so callers can short-circuit on empty input
 *      without another string check.
 *
 *   3. A `displayHint` string — the "canonical" form of what the
 *      user typed, useful for the UI to echo back into the input
 *      after normalization (`"@MrBeast"` instead of the messy
 *      original `"  https://youtube.com/@MrBeast/  "`).
 */

import { parseChannelQuery, type ParsedQuery } from "../parseQuery";

export type ChannelInputKind = ParsedQuery["kind"];

/**
 * Structured reason that a raw input is not usable as-is. Presented
 * to the analyzer so `invalid-input` never gets confused with a
 * legitimate API failure — see the `mapErrorToReason` docstring.
 */
export type InvalidInputReason =
  /** The user has typed nothing (or whitespace only). */
  | "empty"
  /** The input looks like a channel ID (starts with UC) but fails the regex. */
  | "malformed-channel-id"
  /** A YouTube URL with no extractable channel identifier. */
  | "invalid-youtube-url"
  /** An `@handle` with no usable characters after the `@`. */
  | "empty-handle";

export interface NormalizedChannelInput {
  /** Result of parseChannelQuery — kind and normalized value. */
  kind: ChannelInputKind;
  /** The normalized value (e.g. "MrBeast" for a handle, "UC..." for an id). */
  value: string;
  /** The raw input, trimmed. Kept for logging and to echo back to the UI. */
  raw: string;
  /** True when there's a usable value we can hand to the resolver. */
  usable: boolean;
  /**
   * When `usable === false`, describes WHY. `null` when usable.
   * Distinguishes "empty" (natural landing state) from
   * "malformed-*" (user typed something that couldn't be parsed) so
   * the analyzer can pick the right fallback reason without a
   * second parse pass.
   */
  invalidReason: InvalidInputReason | null;
  /**
   * A canonical display form the UI can put back into the input field
   * after normalization. Handles are prefixed with `@`; channel ids
   * are returned verbatim; free-text is echoed back unchanged.
   */
  displayHint: string;
}

/**
 * Regex mirror of the one in `parseChannelQuery`. Duplicated here (as
 * a private constant) so we can detect "malformed UC-like" strings
 * without importing an internal.
 */
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{20,40}$/;

/**
 * Heuristic: does the trimmed input LOOK like it was intended as a
 * channel ID? We flag as "malformed-channel-id" when the string
 * starts with `UC`, is a plausible id-length (>= 4 chars total), and
 * the char set is ASCII alphanumeric-ish — but fails the strict
 * regex. This lets us tell "UC123" (invalid) apart from a real
 * channel-name search like "UCLA basketball" (name).
 */
function looksLikeMalformedChannelId(trimmed: string): boolean {
  if (!/^UC[A-Za-z0-9_-]*$/.test(trimmed)) return false;
  if (trimmed.length < 4) return false; // too short to have been an id attempt
  return !CHANNEL_ID_RE.test(trimmed);
}

/**
 * Heuristic: does the input LOOK like a YouTube URL that we still
 * couldn't extract a channel from? True when the trimmed string
 * starts with `http(s)://` or contains `youtube.com` / `youtu.be`
 * but `parseChannelQuery` gave us back a `name` kind — meaning the
 * URL parser fell all the way through.
 */
function looksLikeYoutubeUrl(trimmed: string): boolean {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)(\/|$)/i.test(
    trimmed,
  );
}

/**
 * Normalize a Channel Analyzer input string.
 *
 * Never throws. Empty / whitespace-only input yields
 * `{ usable: false }` so the caller can render a validation message
 * without needing to know the parser internals.
 */
export function normalizeChannelInput(raw: string): NormalizedChannelInput {
  const trimmed = (raw ?? "").trim();

  // Empty / whitespace-only: the natural landing state, not an error.
  if (!trimmed) {
    return {
      kind: "name",
      value: "",
      raw: "",
      usable: false,
      invalidReason: "empty",
      displayHint: "",
    };
  }

  // ── Malformed inputs the user typed with clear intent ────────────
  //
  // These are cases where we can be SURE the user meant something
  // specific (a channel id, a handle, a URL) but the string is
  // broken. We flag these before falling back to a free-text search
  // so the analyzer can surface `invalid-input` — matching the
  // spec's error taxonomy.

  // 1. Malformed channel-id-like input, e.g. "UC123" or a UC string
  //    with characters outside the allowed set. We only flag the
  //    strict ASCII-alnum-ish shape; "UCLA basketball" still routes
  //    to a normal name search.
  if (looksLikeMalformedChannelId(trimmed)) {
    return {
      kind: "channelId",
      value: trimmed,
      raw: trimmed,
      usable: false,
      invalidReason: "malformed-channel-id",
      displayHint: trimmed,
    };
  }

  // 2. Bare "@" with no handle content.
  if (trimmed === "@") {
    return {
      kind: "handle",
      value: "",
      raw: trimmed,
      usable: false,
      invalidReason: "empty-handle",
      displayHint: "@",
    };
  }

  const parsed = parseChannelQuery(trimmed);

  // 3. YouTube URL that the parser couldn't route — parseChannelQuery
  //    only returns `channelId` / `handle` for URLs that clearly
  //    identify a channel. If the input looked like a YouTube URL
  //    but the parser fell all the way through to `name`, it's an
  //    invalid URL (e.g. `https://www.youtube.com/`, a video-watch
  //    URL, or a broken path).
  if (parsed.kind === "name" && looksLikeYoutubeUrl(trimmed)) {
    return {
      kind: "name",
      value: parsed.value,
      raw: trimmed,
      usable: false,
      invalidReason: "invalid-youtube-url",
      displayHint: trimmed,
    };
  }

  const usable = parsed.value.trim().length > 0;

  let displayHint: string;
  switch (parsed.kind) {
    case "handle":
      displayHint = `@${parsed.value}`;
      break;
    case "channelId":
      displayHint = parsed.value;
      break;
    default:
      displayHint = parsed.value;
      break;
  }

  return {
    kind: parsed.kind,
    value: parsed.value,
    raw: trimmed,
    usable,
    invalidReason: usable ? null : "empty",
    displayHint,
  };
}
