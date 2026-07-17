/**
 * Wiring test: `safeErrorResponse` must:
 *   - NOT report `YouTubeApiError` (classified upstream response)
 *   - NOT report `z.ZodError` (expected validation failure)
 *   - Report any other exception exactly once, with redacted context
 *
 * The response body must always be a stable public shape.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { safeErrorResponse } from "../apiHelpers";
import { setErrorReporter, type ErrorReporter } from "../errorReporter";
import { YouTubeApiError } from "../errors";
import { withContext } from "../observability";

describe("safeErrorResponse -> ErrorReporter wiring", () => {
  let captured: unknown[];
  let capturedCtx: Array<Record<string, unknown> | undefined>;

  beforeEach(() => {
    captured = [];
    capturedCtx = [];
    const fake: ErrorReporter = {
      captureException(err, ctx) {
        captured.push(err);
        capturedCtx.push(ctx);
      },
      captureMessage() {
        /* no-op */
      },
    };
    setErrorReporter(fake);
  });
  afterEach(() => {
    setErrorReporter(null);
  });

  it("does not report a classified YouTubeApiError", () => {
    const res = safeErrorResponse(
      new YouTubeApiError(429, "QUOTA_EXCEEDED", "quota"),
    );
    expect(res.status).toBe(429);
    expect(captured).toHaveLength(0);
  });

  it("does not report a ZodError", () => {
    const zerr = z.object({ x: z.string() }).safeParse({ x: 1 });
    if (zerr.success) throw new Error("expected error");
    const res = safeErrorResponse(zerr.error);
    expect(res.status).toBe(400);
    expect(captured).toHaveLength(0);
  });

  it("reports unexpected exceptions with route context, redacted", async () => {
    const err = new Error("kaboom /root/x AIzaSyC-abcdefghijklmnopqrstuvwxyz1234");
    await withContext("api.search", async () => {
      const res = safeErrorResponse(err);
      expect(res.status).toBe(500);
      const body = await res.json();
      // The public message is generic — never leaks internals.
      expect(body.message).toBe("Unexpected server error.");
      expect(body.error).toBe("INTERNAL_ERROR");
    });
    expect(captured).toHaveLength(1);
    // The reported error is redacted to a stack-free normalized shape.
    const reported = captured[0] as Record<string, unknown>;
    expect(reported.name).toBe("Error");
    expect(String(reported.message)).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
    // Route context flows through.
    expect(capturedCtx[0]?.route).toBe("api.search");
  });

  it("reports even when called outside a request context (no route info)", () => {
    const res = safeErrorResponse(new TypeError("no context"));
    expect(res.status).toBe(500);
    expect(captured).toHaveLength(1);
  });
});
