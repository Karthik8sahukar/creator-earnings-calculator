import { describe, it, expect } from "vitest";
import { generateUuid, generateUuids, validateUuid } from "./uuid";

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateUuid", () => {
  it("produces UUID v4 format", () => {
    const uuid = generateUuid();
    expect(uuid).toMatch(UUID_V4_REGEX);
  });

  it("version nibble is 4", () => {
    const uuid = generateUuid();
    expect(uuid[14]).toBe("4");
  });

  it("variant bits are valid (8, 9, a, or b)", () => {
    const uuid = generateUuid();
    expect("89ab").toContain(uuid[19]);
  });
});

describe("generateUuids", () => {
  it("produces requested quantity", () => {
    const uuids = generateUuids(10);
    expect(uuids.length).toBe(10);
  });

  it("all are valid UUID v4", () => {
    const uuids = generateUuids(20);
    for (const uuid of uuids) {
      expect(uuid).toMatch(UUID_V4_REGEX);
    }
  });

  it("all are unique in batch", () => {
    const uuids = generateUuids(50);
    const set = new Set(uuids);
    expect(set.size).toBe(50);
  });

  it("respects large quantity", () => {
    const uuids = generateUuids(100);
    expect(uuids.length).toBe(100);
  });
});

describe("validateUuid", () => {
  it("validates correct UUID v4", () => {
    const uuid = generateUuid();
    const result = validateUuid(uuid);
    expect(result.valid).toBe(true);
    expect(result.version).toBe(4);
  });

  it("rejects invalid UUID", () => {
    expect(validateUuid("not-a-uuid").valid).toBe(false);
    expect(validateUuid("").valid).toBe(false);
    expect(validateUuid("12345678-1234-1234-1234-123456789012").valid).toBe(false);
  });
});
