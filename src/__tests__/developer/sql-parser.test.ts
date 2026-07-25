import { describe, it, expect } from "vitest";
import { parseSqlInsert } from "@/lib/developer";

describe("SQL parser", () => {
  it("parses multiple rows", () => {
    const sql = "INSERT INTO t (a, b) VALUES (1, 'x'), (2, 'y');";
    const result = parseSqlInsert(sql);
    expect(result.rowCount).toBe(2);
    expect(result.data[0]).toEqual({ a: 1, b: "x" });
    expect(result.data[1]).toEqual({ a: 2, b: "y" });
  });

  it("handles commas inside strings", () => {
    const sql = "INSERT INTO t (name) VALUES ('Smith, John'), ('Doe, Jane');";
    const result = parseSqlInsert(sql);
    expect(result.rowCount).toBe(2);
    expect(result.data[0].name).toBe("Smith, John");
    expect(result.data[1].name).toBe("Doe, Jane");
  });

  it("handles escaped apostrophes", () => {
    const sql = "INSERT INTO t (msg) VALUES ('it''s fine');";
    const result = parseSqlInsert(sql);
    expect(result.data[0].msg).toBe("it's fine");
  });

  it("handles NULL values", () => {
    const sql = "INSERT INTO t (a, b) VALUES (1, NULL);";
    const result = parseSqlInsert(sql);
    expect(result.data[0].b).toBeNull();
  });

  it("returns error for invalid input", () => {
    const result = parseSqlInsert("SELECT * FROM users");
    expect(result.error).toBeDefined();
    expect(result.rowCount).toBe(0);
  });
});
