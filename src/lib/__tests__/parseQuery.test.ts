import { describe, expect, it } from "vitest";

import { parseChannelQuery } from "../parseQuery";

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

  it("treats a plain name as a name search", () => {
    expect(parseChannelQuery("MrBeast")).toEqual({
      kind: "name",
      value: "MrBeast",
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

  it("returns empty name for empty input", () => {
    expect(parseChannelQuery("")).toEqual({ kind: "name", value: "" });
    expect(parseChannelQuery("   ")).toEqual({ kind: "name", value: "" });
  });

  it("falls back to name search when URL is malformed", () => {
    const q = "https://youtube.com/@this is not a real url";
    const result = parseChannelQuery(q);
    // Whatever we do it must not throw and must not be typed as channelId.
    expect(result.kind).not.toBe("channelId");
  });

  it("falls back to name for legacy /c/ URLs", () => {
    expect(parseChannelQuery("https://youtube.com/c/PewDiePie")).toEqual({
      kind: "name",
      value: "PewDiePie",
    });
  });

  it("falls back to name for legacy /user/ URLs", () => {
    expect(parseChannelQuery("https://youtube.com/user/pewdiepie")).toEqual({
      kind: "name",
      value: "pewdiepie",
    });
  });

  it("accepts youtube.com URL without protocol", () => {
    expect(parseChannelQuery("youtube.com/@MrBeast")).toEqual({
      kind: "handle",
      value: "MrBeast",
    });
  });

  it("does not misclassify a UC-prefixed name that's the wrong shape", () => {
    // UC + 5 chars is too short to be a channel id
    const result = parseChannelQuery("UCxx");
    expect(result.kind).toBe("name");
  });

  it("does not throw on very long input", () => {
    const long = "a".repeat(5000);
    expect(() => parseChannelQuery(long)).not.toThrow();
    expect(parseChannelQuery(long).kind).toBe("name");
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
});
