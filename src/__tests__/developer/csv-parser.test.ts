import { describe, it, expect } from "vitest";
import { parseCsv, detectDelimiter } from "@/lib/developer";

describe("CSV parser", () => {
  it("parses quoted commas", () => {
    const csv = 'name,address\n"Smith, John","123 Main St, Apt 4"';
    const result = parseCsv(csv);
    expect(result.rowCount).toBe(1);
    expect(result.data[0].name).toBe("Smith, John");
    expect(result.data[0].address).toBe("123 Main St, Apt 4");
  });

  it("handles multiline quoted fields", () => {
    const csv = 'name,bio\nAlice,"Line 1\nLine 2"';
    const result = parseCsv(csv);
    expect(result.data[0].bio).toBe("Line 1\nLine 2");
  });

  it("handles escaped quotes", () => {
    const csv = 'name,quote\nBob,"He said ""hello"""';
    const result = parseCsv(csv);
    expect(result.data[0].quote).toBe('He said "hello"');
  });

  it("detects custom delimiter", () => {
    expect(detectDelimiter("a;b;c\n1;2;3")).toBe(";");
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
    expect(detectDelimiter("a|b|c\n1|2|3")).toBe("|");
  });

  it("creates nested objects from dot-notation keys", () => {
    const csv = "name,address.city,address.zip\nAlice,Bengaluru,560001";
    const result = parseCsv(csv, { nested: true });
    const row = result.data[0] as Record<string, unknown>;
    const address = row.address as Record<string, unknown>;
    expect(address.city).toBe("Bengaluru");
    expect(address.zip).toBe(560001);
  });

  it("rejects __proto__ pollution in nested keys", () => {
    const csv = "__proto__.polluted,name\ntrue,test";
    const result = parseCsv(csv, { nested: true });
    const row = result.data[0] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(row, "__proto__")).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(row.name).toBe("test");
  });

  it("rejects constructor.prototype pollution in nested keys", () => {
    const csv = "constructor.prototype.polluted,name\ntrue,test";
    const result = parseCsv(csv, { nested: true });
    const row = result.data[0] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(row, "constructor")).toBe(false);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(row.name).toBe("test");
  });

  it("rejects prototype at any depth in nested keys", () => {
    const csv = "safe.prototype.polluted,name\ntrue,test";
    const result = parseCsv(csv, { nested: true });
    const row = result.data[0] as Record<string, unknown>;
    const safe = row.safe as Record<string, unknown> | undefined;
    if (safe) {
      expect(Object.prototype.hasOwnProperty.call(safe, "prototype")).toBe(false);
    }
    expect(row.name).toBe("test");
  });

  it("rejects dangerous flat keys without nested mode", () => {
    const csv = "__proto__,name\nmalicious,test";
    const result = parseCsv(csv, { nested: false });
    const row = result.data[0] as Record<string, unknown>;
    expect(Object.prototype.hasOwnProperty.call(row, "__proto__")).toBe(false);
    expect(row.name).toBe("test");
  });

  it("valid nested fields work alongside dangerous rejections", () => {
    const csv = "user.name,__proto__.hack,user.age\nAlice,bad,30";
    const result = parseCsv(csv, { nested: true });
    const row = result.data[0] as Record<string, unknown>;
    const user = row.user as Record<string, unknown>;
    expect(user.name).toBe("Alice");
    expect(user.age).toBe(30);
    expect(Object.prototype.hasOwnProperty.call(row, "__proto__")).toBe(false);
  });
});
