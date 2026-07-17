/**
 * Utilities for building safe social-share URLs.
 *
 * Rules:
 *   - Only ever include public data (the channel URL and the channel
 *     display name).
 *   - Never include the YouTube API key.
 *   - Never include exact earning figures in the default share text
 *     (the user has to opt in from the UI to include those).
 *   - Encode all query values with `encodeURIComponent` — that's the
 *     only responsibility of these builders.
 *
 * These functions are deliberately pure and easy to unit-test.
 */

export interface ShareTargetInput {
  /** Absolute URL to the shareable page. */
  url: string;
  /** Prose share text — must NOT include private data. */
  text: string;
}

/** Build the intent URL for X (formerly Twitter). */
export function buildXShareUrl({ url, text }: ShareTargetInput): string {
  const params = new URLSearchParams({ text, url });
  return `https://x.com/intent/tweet?${params.toString()}`;
}

/** Build the LinkedIn share URL. LinkedIn reads title/description from OG. */
export function buildLinkedInShareUrl({ url }: { url: string }): string {
  const params = new URLSearchParams({ url });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/** Build the WhatsApp click-to-chat URL with prefilled text. */
export function buildWhatsAppShareUrl({ url, text }: ShareTargetInput): string {
  // WhatsApp expects the entire message in `text`.
  const params = new URLSearchParams({ text: `${text} ${url}` });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

/**
 * Standard share text for a channel. Deliberately generic and does NOT
 * claim the estimate is verified or endorsed.
 */
export function defaultChannelShareText(channelTitle: string): string {
  return `View public channel statistics and an independent monthly earnings estimate for ${channelTitle}.`;
}
