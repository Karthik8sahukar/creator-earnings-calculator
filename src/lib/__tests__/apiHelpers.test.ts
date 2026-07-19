import { describe, expect, it } from "vitest";

import { safeErrorResponse } from "../apiHelpers";
import { YouTubeApiError } from "../errors";

describe("safeErrorResponse", () => {
  it("maps YouTubeApiError to the canonical envelope with a stable code + message", async () => {
    const res = safeErrorResponse(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "Quota hit"),
    );
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body).toEqual({
      success: false,
      error: { code: "QUOTA_EXCEEDED", message: "Quota hit" },
    });
  });

  it("propagates the specific API_DISABLED code", async () => {
    const res = safeErrorResponse(
      new YouTubeApiError(500, "API_DISABLED", "Enable the API"),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("API_DISABLED");
  });

  it("propagates the specific KEY_RESTRICTED code", async () => {
    const res = safeErrorResponse(
      new YouTubeApiError(500, "KEY_RESTRICTED", "Restricted key"),
    );
    const body = await res.json();
    expect(body.error.code).toBe("KEY_RESTRICTED");
  });

  it("rewrites unknown YouTubeApiError codes to the safe generic YOUTUBE_API_ERROR", async () => {
    const res = safeErrorResponse(
      new YouTubeApiError(500, "SOMETHING_UNSAFE", "leaky details"),
    );
    const body = await res.json();
    expect(body.error.code).toBe("YOUTUBE_API_ERROR");
  });

  it("returns 500 INTERNAL_ERROR for arbitrary errors without leaking details", async () => {
    const res = safeErrorResponse(
      new Error("/home/app/secret_path exploded"),
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    // Must not leak the original error message
    expect(body.error.message).not.toContain("/home/app");
    expect(body.error.message).not.toContain("secret_path");
  });

  it("sets Cache-Control: no-store on every error response", async () => {
    const res = safeErrorResponse(new Error("boom"));
    expect(res.headers.get("Cache-Control")).toBe("no-store");
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
