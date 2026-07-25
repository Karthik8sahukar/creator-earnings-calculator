import { describe, it, expect } from "vitest";
import { validateCron, humanizeCron } from "@/lib/developer";

describe("Cron utilities", () => {
  it("validates known presets", () => {
    expect(validateCron("* * * * *").valid).toBe(true);
    expect(validateCron("*/5 * * * *").valid).toBe(true);
    expect(validateCron("0 9 * * 1-5").valid).toBe(true);
    expect(validateCron("0 0 1 * *").valid).toBe(true);
  });

  it("rejects invalid fields", () => {
    expect(validateCron("60 * * * *").valid).toBe(false);
    expect(validateCron("* 25 * * *").valid).toBe(false);
    expect(validateCron("* * 32 * *").valid).toBe(false);
    expect(validateCron("a b c d e").valid).toBe(false);
    expect(validateCron("* *").valid).toBe(false);
  });

  it("humanizes expressions", () => {
    expect(humanizeCron("* * * * *")).toBe("Every minute");
    expect(humanizeCron("*/5 * * * *")).toBe("Every 5 minutes");
    expect(humanizeCron("0 9 * * 1-5")).toContain("9");
    expect(humanizeCron("0 0 1 * *")).toContain("day 1");
  });
});
