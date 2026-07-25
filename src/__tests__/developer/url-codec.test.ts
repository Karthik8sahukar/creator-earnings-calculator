import { describe, it, expect } from "vitest";
import { safeEncode, safeDecode } from "@/lib/developer";

describe("URL codec utilities", () => {
  it("encodes Unicode characters", () => {
    const result = safeEncode("café ☕", "component");
    expect(result.result).toContain("%");
    expect(result.error).toBeUndefined();
  });

  it("encodes reserved characters in component mode", () => {
    const result = safeEncode("key=value&foo=bar", "component");
    expect(result.result).toContain("%3D");
    expect(result.result).toContain("%26");
  });

  it("decodes percent-encoded strings", () => {
    const result = safeDecode("hello%20world%21", "component");
    expect(result.result).toBe("hello world!");
  });

  it("reports error on malformed percent encoding", () => {
    const result = safeDecode("%GG%invalid", "component");
    expect(result.error).toBeDefined();
  });
});
