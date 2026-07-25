import { describe, it, expect } from "vitest";
import { encodeBase64, decodeBase64, encodeBase64Url, decodeBase64Url } from "@/lib/developer";

describe("Base64 utilities", () => {
  it("encodes and decodes ASCII text", () => {
    const text = "Hello, World!";
    const encoded = encodeBase64(text);
    expect(encoded).toBe("SGVsbG8sIFdvcmxkIQ==");
    expect(decodeBase64(encoded)).toBe(text);
  });

  it("handles Unicode correctly", () => {
    const text = "こんにちは 🌍 café";
    const encoded = encodeBase64(text);
    expect(decodeBase64(encoded)).toBe(text);
  });

  it("encodes/decodes Base64URL", () => {
    const text = "Hello+World/Test=End";
    const encoded = encodeBase64Url(text);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    expect(decodeBase64Url(encoded)).toBe(text);
  });

  it("throws on invalid Base64 input", () => {
    expect(() => decodeBase64("not valid base64!!!")).toThrow();
  });
});
