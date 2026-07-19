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
      expect(r.raw).toBe("");
      expect(r.displayHint).toBe("");
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
