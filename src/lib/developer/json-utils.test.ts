import { describe, it, expect } from "vitest";
import { formatJson, minifyJson, validateJson, countJsonStats } from "./json-utils";

describe("formatJson", () => {
  it("formats an object with 2-space indent", () => {
    const result = formatJson('{"a":1,"b":2}', "2");
    expect(result).toContain("  ");
    expect(result).toContain('"a": 1');
  });

  it("formats with 4-space indent", () => {
    const result = formatJson('{"x":1}', "4");
    expect(result).toContain("    ");
  });

  it("formats with tab indent", () => {
    const result = formatJson('{"x":1}', "tab");
    expect(result).toContain("\t");
  });

  it("formats arrays", () => {
    const result = formatJson("[1,2,3]");
    expect(result).toContain("1,\n");
  });

  it("formats primitives", () => {
    expect(formatJson("42")).toBe("42");
    expect(formatJson('"hello"')).toBe('"hello"');
    expect(formatJson("true")).toBe("true");
    expect(formatJson("null")).toBe("null");
  });

  it("sorts keys when requested", () => {
    const result = formatJson('{"b":2,"a":1}', "2", true);
    const aPos = result.indexOf('"a"');
    const bPos = result.indexOf('"b"');
    expect(aPos).toBeLessThan(bPos);
  });

  it("throws on invalid JSON", () => {
    expect(() => formatJson("{invalid}")).toThrow();
  });

  it("handles Unicode", () => {
    const result = formatJson('{"emoji":"🎉","jp":"日本語"}');
    expect(result).toContain("🎉");
    expect(result).toContain("日本語");
  });

  it("handles empty input", () => {
    expect(() => formatJson("")).toThrow();
  });

  it("handles nested objects", () => {
    const input = '{"a":{"b":{"c":1}}}';
    const result = formatJson(input);
    expect(result).toContain('"c": 1');
  });
});

describe("minifyJson", () => {
  it("removes whitespace", () => {
    const input = '{\n  "hello": "world"\n}';
    expect(minifyJson(input)).toBe('{"hello":"world"}');
  });

  it("preserves string whitespace", () => {
    const input = '{"msg": "hello   world"}';
    expect(minifyJson(input)).toBe('{"msg":"hello   world"}');
  });

  it("handles escaped strings", () => {
    const input = '{"path": "C:\\\\Users\\\\test"}';
    const result = minifyJson(input);
    expect(result).toContain("C:\\\\Users\\\\test");
  });

  it("throws on invalid JSON", () => {
    expect(() => minifyJson("{bad}")).toThrow();
  });

  it("handles Unicode", () => {
    const input = '{ "emoji": "🌍" }';
    expect(minifyJson(input)).toBe('{"emoji":"🌍"}');
  });
});

describe("validateJson", () => {
  it("valid object", () => {
    expect(validateJson('{"a":1}').valid).toBe(true);
  });

  it("valid array", () => {
    expect(validateJson("[1,2,3]").valid).toBe(true);
  });

  it("valid string", () => {
    expect(validateJson('"hello"').valid).toBe(true);
  });

  it("valid number", () => {
    expect(validateJson("42").valid).toBe(true);
  });

  it("valid boolean", () => {
    expect(validateJson("true").valid).toBe(true);
    expect(validateJson("false").valid).toBe(true);
  });

  it("valid null", () => {
    expect(validateJson("null").valid).toBe(true);
  });

  it("rejects trailing comma", () => {
    const result = validateJson('{"a":1,}');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("rejects unquoted key", () => {
    const result = validateJson("{a:1}");
    expect(result.valid).toBe(false);
  });

  it("rejects malformed string", () => {
    const result = validateJson('{"key": value}');
    expect(result.valid).toBe(false);
  });

  it("handles empty input", () => {
    const result = validateJson("");
    expect(result.valid).toBe(false);
  });

  it("provides line info when possible", () => {
    const input = '{\n  "a": 1,\n  "b": }';
    const result = validateJson(input);
    expect(result.valid).toBe(false);
    // Line info may or may not be available depending on engine
    if (result.line) {
      expect(result.line).toBeGreaterThan(0);
    }
  });
});

describe("countJsonStats", () => {
  it("counts objects and arrays", () => {
    const stats = countJsonStats('{"arr":[1,2], "nested":{}}');
    expect(stats.objects).toBe(2);
    expect(stats.arrays).toBe(1);
  });

  it("counts primitives", () => {
    const stats = countJsonStats('{"s":"x","n":1,"b":true,"nil":null}');
    expect(stats.strings).toBe(1);
    expect(stats.numbers).toBe(1);
    expect(stats.booleans).toBe(1);
    expect(stats.nulls).toBe(1);
    expect(stats.keys).toBe(4);
  });

  it("returns zeroes for invalid JSON", () => {
    const stats = countJsonStats("not json");
    expect(stats.objects).toBe(0);
  });
});
