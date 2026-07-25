import { describe, it, expect } from "vitest";
import { generateUuid, generateUuids, validateUuid } from "@/lib/developer";

describe("UUID utilities", () => {
  it("generates valid UUID v4 format", () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("generates requested quantity", () => {
    expect(generateUuids(1)).toHaveLength(1);
    expect(generateUuids(10)).toHaveLength(10);
    expect(generateUuids(100)).toHaveLength(100);
  });

  it("validates correct UUIDs", () => {
    expect(validateUuid("550e8400-e29b-41d4-a716-446655440000")).toEqual({ valid: true, version: 4 });
    expect(validateUuid("6ba7b810-9dad-11d1-80b4-00c04fd430c8")).toEqual({ valid: true, version: 1 });
  });

  it("rejects invalid UUIDs", () => {
    expect(validateUuid("not-a-uuid")).toEqual({ valid: false });
    expect(validateUuid("")).toEqual({ valid: false });
  });
});
