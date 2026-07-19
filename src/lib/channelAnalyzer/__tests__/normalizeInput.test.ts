import { describe, expect, it } from "vitest";

import { normalizeChannelInput } from "../normalizeInput";

/**
 * Tests for the Channel Analyzer input normalizer.
 *
 * The normalizer wraps `parseChannelQuery` — most of the parsing
 * behaviour is exercised in `parseQuery.test.ts` (if any); here we
 * verify the normalizer contract itself:
 *
 *   • Every supported input shape (URL, @handle, bare handle, id,
 *     name) yields the right `kind`.
 *   • The `usable` flag correctly reflects empty / whitespace input.
 *   • `displayHint` returns a canonical, user-facing echo.
 */

describe("normalizeChannelInput", () => {
  it("classifies a full channel URL with @handle", () => {
    const r = normalizeChannelInput("https://www.youtube.com/@MrBeast");
    expect(r.kind).toBe("handle");
    expect(r.value).toBe("MrBeast");
    expect(r.displayHint).toBe("@MrBeast");
    expect(r.usable).toBe(true);
  });

  it("classifies a bare @handle", () => {
    const r = normalizeChannelInput("@MrBeast");
    expect(r.kind).toBe("handle");
    expect(r.value).toBe("MrBeast");
    expect(r.displayHint).toBe("@MrBeast");
  });

  it("classifies a bare word (no @, no URL) as a free-text name", () => {
    const r = normalizeChannelInput("MrBeast");
    expect(r.kind).toBe("name");
    expect(r.value).toBe("MrBeast");
    expect(r.displayHint).toBe("MrBeast");
    expect(r.usable).toBe(true);
  });

  it("classifies a raw channel id", () => {
    const raw = "UCX6OQ3DkcsbYNE6H8uQQuVA";
    const r = normalizeChannelInput(raw);
    expect(r.kind).toBe("channelId");
    expect(r.value).toBe(raw);
    expect(r.displayHint).toBe(raw);
    expect(r.usable).toBe(true);
  });

  it("extracts a channel id from a /channel/UC... URL", () => {
    const raw =
      "https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA";
    const r = normalizeChannelInput(raw);
    expect(r.kind).toBe("channelId");
    expect(r.value).toBe("UCX6OQ3DkcsbYNE6H8uQQuVA");
  });

  it("returns not-usable for empty input", () => {
    for (const raw of ["", "   ", "\n\t"]) {
      const r = normalizeChannelInput(raw);
      expect(r.usable).toBe(false);
      expect(r.invalidReason).toBe("empty");
      expect(r.raw).toBe("");
      expect(r.displayHint).toBe("");
    }
  });

  it("flags UC-like strings that fail the id regex as 'malformed-channel-id'", () => {
    // Each of these starts with UC and uses the channel-id charset
    // (`[A-Za-z0-9_-]`) so the user's intent was clearly "channel
    // ID", but the length is out of the strict [22, 42] range that
    // real YouTube ids sit in.
    for (const raw of [
      "UC123",
      "UCTooShort",
      "UC-still-too-short-",
      "UCabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQ", // 47 chars — too long
    ]) {
      const r = normalizeChannelInput(raw);
      expect(r.usable, `for ${raw}`).toBe(false);
      expect(r.invalidReason, `for ${raw}`).toBe("malformed-channel-id");
    }
  });

  it("does NOT flag names that happen to start with UC (e.g. 'UCLA basketball')", () => {
    // Free-text queries that happen to begin with "UC" but contain
    // characters (spaces, punctuation) that can't appear in a
    // channel id must NOT be flagged — they're legitimate name
    // searches.
    for (const raw of [
      "UCLA basketball",
      "UC Berkeley",
      "UC!!!!!!!!!!!!!!!!!!!!!!",
    ]) {
      const r = normalizeChannelInput(raw);
      expect(r.usable, `for ${raw}`).toBe(true);
      expect(r.kind, `for ${raw}`).toBe("name");
    }
  });

  it("flags YouTube URLs with no channel identifier as 'invalid-youtube-url'", () => {
    for (const raw of [
      "https://www.youtube.com/",
      "https://youtube.com/watch?v=abc",
      "https://www.youtube.com/results?search_query=foo",
      "youtube.com/feed/trending",
    ]) {
      const r = normalizeChannelInput(raw);
      expect(r.usable, `for ${raw}`).toBe(false);
      expect(r.invalidReason, `for ${raw}`).toBe("invalid-youtube-url");
    }
  });

  it("flags a bare '@' as 'empty-handle'", () => {
    const r = normalizeChannelInput("@");
    expect(r.usable).toBe(false);
    expect(r.invalidReason).toBe("empty-handle");
  });

  it("marks all valid inputs as usable with invalidReason null", () => {
    for (const raw of [
      "@MrBeast",
      "MrBeast",
      "UCX6OQ3DkcsbYNE6H8uQQuVA",
      "https://www.youtube.com/@MrBeast",
      "https://www.youtube.com/channel/UCX6OQ3DkcsbYNE6H8uQQuVA",
    ]) {
      const r = normalizeChannelInput(raw);
      expect(r.usable, `for ${raw}`).toBe(true);
      expect(r.invalidReason, `for ${raw}`).toBeNull();
    }
  });

  it("trims surrounding whitespace before classifying", () => {
    const r = normalizeChannelInput("   @Kurzgesagt   ");
    expect(r.kind).toBe("handle");
    expect(r.value).toBe("Kurzgesagt");
    expect(r.raw).toBe("@Kurzgesagt"); // trimmed
    expect(r.displayHint).toBe("@Kurzgesagt");
  });

  it("degrades legacy /c/ and /user/ URLs to a free-text name search", () => {
    const c = normalizeChannelInput("https://www.youtube.com/c/PewDiePie");
    expect(c.kind).toBe("name");
    expect(c.value).toBe("PewDiePie");

    const u = normalizeChannelInput("https://www.youtube.com/user/nigahiga");
    expect(u.kind).toBe("name");
    expect(u.value).toBe("nigahiga");
  });

  it("handles null / undefined gracefully", () => {
    // TypeScript would forbid this, but the runtime guard exists so
    // upstream mishaps don't crash the analyzer.
    const r = normalizeChannelInput(
      undefined as unknown as string,
    );
    expect(r.usable).toBe(false);
    expect(r.raw).toBe("");
  });
});
