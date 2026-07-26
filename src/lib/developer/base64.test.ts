import { describe, it, expect } from "vitest";
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url } from "./base64";

describe("encodeBase64", () => {
  it("encodes ASCII", () => {
    expect(encodeBase64("Hello")).toBe("SGVsbG8=");
  });

  it("encodes Unicode", () => {
    const encoded = encodeBase64("日本語");
    const decoded = decodeBase64(encoded);
    expect(decoded).toBe("日本語");
  });

  it("encodes emoji", () => {
    const encoded = encodeBase64("🎉🌍");
    const decoded = decodeBase64(encoded);
    expect(decoded).toBe("🎉🌍");
  });

  it("handles empty string", () => {
    expect(encodeBase64("")).toBe("");
  });
});

describe("decodeBase64", () => {
  it("decodes ASCII", () => {
    expect(decodeBase64("SGVsbG8=")).toBe("Hello");
  });

  it("decodes with padding", () => {
    expect(decodeBase64("YQ==")).toBe("a");
    expect(decodeBase64("YWI=")).toBe("ab");
    expect(decodeBase64("YWJj")).toBe("abc");
  });

  it("throws on malformed Base64", () => {
    expect(() => decodeBase64("!!!invalid!!!")).toThrow();
  });

  it("handles empty string", () => {
    expect(decodeBase64("")).toBe("");
  });
});

describe("encodeBase64Url", () => {
  it("replaces + with - and / with _", () => {
    // A string that produces + and / in standard base64
    const input = "subjects?_d";
    const encoded = encodeBase64Url(input);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("round-trips with decodeBase64Url", () => {
    const original = "Hello 🌍! Test/data+more";
    const encoded = encodeBase64Url(original);
    const decoded = decodeBase64Url(encoded);
    expect(decoded).toBe(original);
  });
});

describe("decodeBase64Url", () => {
  it("decodes URL-safe encoded string", () => {
    const original = "test data with special chars";
    const encoded = encodeBase64Url(original);
    expect(decodeBase64Url(encoded)).toBe(original);
  });
});
