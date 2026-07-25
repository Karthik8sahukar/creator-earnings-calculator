import { describe, it, expect } from "vitest";
import { decodeJwt, isExpired, SAMPLE_JWT } from "@/lib/developer";

describe("JWT utilities", () => {
  it("decodes a valid JWT", () => {
    const result = decodeJwt(SAMPLE_JWT);
    expect(result.header.alg).toBe("HS256");
    expect(result.header.typ).toBe("JWT");
    expect(result.payload.sub).toBe("1234567890");
    expect(result.payload.name).toBe("John Doe");
    expect(result.payload.iss).toBe("example.com");
  });

  it("decodes Unicode payloads", () => {
    // Create a JWT with Unicode in payload
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const payloadObj = { name: "日本語テスト", emoji: "🎉" };
    const payloadBytes = new TextEncoder().encode(JSON.stringify(payloadObj));
    const payloadB64 = btoa(String.fromCharCode(...payloadBytes)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const token = `${header}.${payloadB64}.fakesig`;
    const result = decodeJwt(token);
    expect(result.payload.name).toBe("日本語テスト");
    expect(result.payload.emoji).toBe("🎉");
  });

  it("throws on malformed token", () => {
    expect(() => decodeJwt("not.a.valid.token")).toThrow();
    expect(() => decodeJwt("onlyonepart")).toThrow();
    expect(() => decodeJwt("two.parts")).toThrow();
  });

  it("detects expired tokens", () => {
    const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 };
    expect(isExpired(expiredPayload)).toBe(true);
    const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
    expect(isExpired(validPayload)).toBe(false);
  });
});
