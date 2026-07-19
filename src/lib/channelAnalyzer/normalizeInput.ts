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
   * A canonical display form the UI can put back into the input field
   * after normalization. Handles are prefixed with `@`; channel ids
   * are returned verbatim; free-text is echoed back unchanged.
   */
  displayHint: string;
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

  if (!trimmed) {
    return {
      kind: "name",
      value: "",
      raw: "",
      usable: false,
      displayHint: "",
    };
  }

  const parsed = parseChannelQuery(trimmed);
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
    displayHint,
  };
}
