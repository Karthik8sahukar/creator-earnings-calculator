import { describe, it, expect } from "vitest";
import { executeRegex } from "@/lib/developer";

describe("Regex utilities", () => {
  it("finds matches with flags", () => {
    const result = executeRegex("\\d+", "abc 123 def 456", "g");
    expect(result.count).toBe(2);
    expect(result.matches[0].match).toBe("123");
    expect(result.matches[1].match).toBe("456");
  });

  it("extracts capturing groups", () => {
    const result = executeRegex("(\\w+)@(\\w+)", "user@host", "");
    expect(result.count).toBe(1);
    expect(result.matches[0].groups).toEqual(["user", "host"]);
  });

  it("handles zero-length global matches safely", () => {
    // This should not infinite loop
    const result = executeRegex("", "abc", "g");
    expect(result.count).toBe(0); // skipped due to zero-length
  });

  it("returns error for invalid pattern", () => {
    const result = executeRegex("[invalid", "test", "g");
    expect(result.error).toBeDefined();
    expect(result.count).toBe(0);
  });
});
