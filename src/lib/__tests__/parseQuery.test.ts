import { describe, expect, it } from "vitest";

import { parseChannelQuery, UNSUPPORTED_INPUT_MESSAGE } from "../parseQuery";

const REAL_CID = "UCX6OQ3DkcsbYNE6H8uQQuVA"; // MrBeast — this file uses only its shape
const OTHER_CID = "UC-lHJZR3Gqxm24_Vd_AJ5Yw";

describe("parseChannelQuery", () => {
  it("recognizes a raw channel id", () => {
    expect(parseChannelQuery(REAL_CID)).toEqual({
      kind: "channelId",
      value: REAL_CID,
    });
  });

  it("recognizes a naked @handle", () => {
    expect(parseChannelQuery("@MrBeast")).toEqual({
      kind: "handle",
      value: "MrBeast",
    });
  });

  it("rejects plain text as unsupported (no fuzzy search)", () => {
    expect(parseChannelQuery("MrBeast")).toEqual({
      kind: "unsupported",
      value: "MrBeast",
    });
  });

  it("rejects random gibberish as unsupported", () => {
    expect(parseChannelQuery("hjbhj")).toEqual({
      kind: "unsupported",
      value: "hjbhj",
    });
  });

  it("rejects 'Gaming channel' as unsupported", () => {
    expect(parseChannelQuery("Gaming channel")).toEqual({
      kind: "unsupported",
      value: "Gaming channel",
    });
  });

  it("rejects 'PewDiePie' (no @) as unsupported", () => {
    expect(parseChannelQuery("PewDiePie")).toEqual({
      kind: "unsupported",
      value: "PewDiePie",
    });
  });

  it("recognizes /@handle URL", () => {
    expect(parseChannelQuery("https://www.youtube.com/@MrBeast")).toEqual({
      kind: "handle",
      value: "MrBeast",
    });
  });

  it("recognizes /channel/UC... URL", () => {
    expect(
      parseChannelQuery(`https://youtube.com/channel/${REAL_CID}`),
    ).toEqual({ kind: "channelId", value: REAL_CID });
  });

  it("recognizes another /channel/UC... URL", () => {
    expect(
      parseChannelQuery(`https://youtube.com/channel/${OTHER_CID}`),
    ).toEqual({ kind: "channelId", value: OTHER_CID });
  });

  it("preserves query params without breaking parsing", () => {
    expect(
      parseChannelQuery("https://www.youtube.com/@MrBeast?feature=share"),
    ).toEqual({ kind: "handle", value: "MrBeast" });
  });

  it("handles trailing slashes on handle URLs", () => {
    expect(parseChannelQuery("https://www.youtube.com/@MrBeast/")).toEqual({
      kind: "handle",
      value: "MrBeast",
    });
  });

  it("handles trailing slashes on channel URLs", () => {
    expect(
      parseChannelQuery(`https://www.youtube.com/channel/${REAL_CID}/`),
    ).toEqual({ kind: "channelId", value: REAL_CID });
  });

  it("trims leading and trailing whitespace", () => {
    expect(parseChannelQuery("   @MrBeast   ")).toEqual({
      kind: "handle",
      value: "MrBeast",
    });
  });

  it("returns unsupported for empty input", () => {
    expect(parseChannelQuery("")).toEqual({ kind: "unsupported", value: "" });
    expect(parseChannelQuery("   ")).toEqual({ kind: "unsupported", value: "" });
  });

  it("returns unsupported for malformed URL", () => {
    const q = "https://youtube.com/@this is not a real url";
    const result = parseChannelQuery(q);
    expect(result.kind).toBe("unsupported");
  });

  it("rejects legacy /c/ URLs as unsupported", () => {
    expect(parseChannelQuery("https://youtube.com/c/PewDiePie")).toEqual({
      kind: "unsupported",
      value: "https://youtube.com/c/PewDiePie",
    });
  });

  it("rejects legacy /user/ URLs as unsupported", () => {
    expect(parseChannelQuery("https://youtube.com/user/pewdiepie")).toEqual({
      kind: "unsupported",
      value: "https://youtube.com/user/pewdiepie",
    });
  });

  it("accepts youtube.com URL without protocol", () => {
    expect(parseChannelQuery("youtube.com/@MrBeast")).toEqual({
      kind: "handle",
      value: "MrBeast",
    });
  });

  it("does not misclassify a UC-prefixed string that's the wrong length", () => {
    // UC + 5 chars is too short to be a channel id
    const result = parseChannelQuery("UCxx");
    expect(result.kind).toBe("unsupported");
  });

  it("does not throw on very long input", () => {
    const long = "a".repeat(5000);
    expect(() => parseChannelQuery(long)).not.toThrow();
    expect(parseChannelQuery(long).kind).toBe("unsupported");
  });

  it("safely handles malicious-looking input", () => {
    const inputs = [
      "<script>alert(1)</script>",
      "'; DROP TABLE users; --",
      "javascript:alert(1)",
      "\\u0000\\u0001",
      "https://youtube.com/@%3Cscript%3E",
    ];
    for (const raw of inputs) {
      expect(() => parseChannelQuery(raw)).not.toThrow();
    }
  });

  it("exports UNSUPPORTED_INPUT_MESSAGE", () => {
    expect(UNSUPPORTED_INPUT_MESSAGE).toContain("@handle");
    expect(UNSUPPORTED_INPUT_MESSAGE).toContain("channel URL");
    expect(UNSUPPORTED_INPUT_MESSAGE).toContain("channel ID");
  });
});
