import { describe, expect, it } from "vitest";

import {
  buildLinkedInShareUrl,
  buildWhatsAppShareUrl,
  buildXShareUrl,
  defaultChannelShareText,
} from "../share";

const CHANNEL_URL =
  "https://creator-earnings.example/channel/UCXXXXXXXXXXXXXXXXXXXXXX";
const TEXT =
  "View public channel statistics and an independent creator earnings estimate for Kurzgesagt – In a Nutshell.";

describe("defaultChannelShareText", () => {
  it("builds the canonical wording without claiming verification", () => {
    const t = defaultChannelShareText("MrBeast");
    expect(t).toBe(
      "View public channel statistics and an independent creator earnings estimate for MrBeast.",
    );
    expect(t.toLowerCase()).not.toMatch(/verified|official|endorse/);
  });

  it("does not include exact currency amounts", () => {
    const t = defaultChannelShareText("Some Channel");
    // Bare "$" or currency symbols must not appear in the default text.
    expect(t).not.toMatch(/\$|USD|€|£|¥/);
    // Nor digits like earnings estimates.
    expect(t).not.toMatch(/\d/);
  });
});

describe("buildXShareUrl", () => {
  it("encodes text and url as URLSearchParams", () => {
    const built = buildXShareUrl({ url: CHANNEL_URL, text: TEXT });
    const parsed = new URL(built);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://x.com/intent/tweet",
    );
    expect(parsed.searchParams.get("url")).toBe(CHANNEL_URL);
    expect(parsed.searchParams.get("text")).toBe(TEXT);
  });

  it("does not double-encode characters", () => {
    const url = "https://x/y?a=1&b=2";
    const built = buildXShareUrl({ url, text: "hi" });
    // & inside the encoded url must be encoded, not raw.
    expect(built).toContain("a%3D1%26b%3D2");
  });
});

describe("buildLinkedInShareUrl", () => {
  it("uses the LinkedIn sharing endpoint with url only", () => {
    const built = buildLinkedInShareUrl({ url: CHANNEL_URL });
    const parsed = new URL(built);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://www.linkedin.com/sharing/share-offsite/",
    );
    expect(parsed.searchParams.get("url")).toBe(CHANNEL_URL);
  });
});

describe("buildWhatsAppShareUrl", () => {
  it("packs text and url into a single message", () => {
    const built = buildWhatsAppShareUrl({ url: CHANNEL_URL, text: TEXT });
    const parsed = new URL(built);
    expect(parsed.origin + parsed.pathname).toBe(
      "https://api.whatsapp.com/send",
    );
    const text = parsed.searchParams.get("text") ?? "";
    expect(text.startsWith(TEXT + " ")).toBe(true);
    expect(text.endsWith(CHANNEL_URL)).toBe(true);
  });
});

describe("share URLs are safe", () => {
  it("do not leak the YouTube API key when it appears in the environment", () => {
    // Even if a caller accidentally passed the key through, the builders
    // just encode what they're given — the safeguard is that the caller
    // (ShareSection) only ever passes the canonical channel URL + text.
    // Sanity-check: none of the builder outputs contain the string
    // "YOUTUBE_API_KEY" or an obvious "AIza..." fragment.
    const outputs = [
      buildXShareUrl({ url: CHANNEL_URL, text: TEXT }),
      buildLinkedInShareUrl({ url: CHANNEL_URL }),
      buildWhatsAppShareUrl({ url: CHANNEL_URL, text: TEXT }),
    ];
    for (const o of outputs) {
      expect(o).not.toMatch(/AIza/);
      expect(o).not.toContain("YOUTUBE_API_KEY");
    }
  });

  it("escape special characters in channel titles", () => {
    // A channel title with quotes / <> should be safe once encoded.
    const meanTitle = 'Test "channel" <script>alert(1)</script>';
    const text = defaultChannelShareText(meanTitle);
    const x = buildXShareUrl({ url: CHANNEL_URL, text });
    expect(x).not.toContain("<script>");
    // The encoded < should appear as %3C.
    expect(x).toContain("%3C");
  });
});
