import { describe, expect, it } from "vitest";

import { safeErrorResponse } from "../apiHelpers";
import { YouTubeApiError } from "../errors";

describe("safeErrorResponse", () => {
  it("maps YouTubeApiError to a stable code + message", async () => {
    const res = safeErrorResponse(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "Quota hit"),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({ error: "QUOTA_EXCEEDED", message: "Quota hit" });
  });

  it("rewrites unknown codes to a safe generic upstream code", async () => {
    const res = safeErrorResponse(
      new YouTubeApiError(500, "SOMETHING_UNSAFE", "leaky details"),
    );
    const body = await res.json();
    expect(body.error).toBe("UPSTREAM_ERROR");
  });

  it("returns 500 INTERNAL_ERROR for arbitrary errors without leaking details", async () => {
    const res = safeErrorResponse(
      new Error("/home/app/secret_path exploded"),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("INTERNAL_ERROR");
    // Must not leak the original error message
    expect(body.message).not.toContain("/home/app");
    expect(body.message).not.toContain("secret_path");
  });

  it("never returns a stack trace or environment variables", async () => {
    process.env._TEST_LEAK_ = "should_not_leak";
    try {
      const res = safeErrorResponse(new Error("boom"));
      const body = await res.json();
      const serialized = JSON.stringify(body);
      expect(serialized).not.toContain("should_not_leak");
      expect(serialized).not.toContain("stack");
    } finally {
      delete process.env._TEST_LEAK_;
    }
  });
});
