/**
 * Tests for the ErrorReporter abstraction.
 *
 * Contract:
 *   - The default reporter is a no-op that never throws.
 *   - `setErrorReporter()` swaps the active reporter.
 *   - `reportException()` and `reportMessage()` redact secrets from
 *     both the error and the context before handing them to the
 *     provider.
 *   - A broken provider (that throws) never bubbles up to the caller.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getErrorReporter,
  reportException,
  reportMessage,
  setErrorReporter,
  type ErrorReporter,
} from "../errorReporter";

const REAL_KEY = "AIzaSyC-abcdefghijklmnopqrstuvwxyz1234";

describe("ErrorReporter default", () => {
  afterEach(() => {
    setErrorReporter(null);
    vi.restoreAllMocks();
  });

  it("has a no-op default that never throws", () => {
    const r = getErrorReporter();
    expect(() =>
      r.captureException(new Error("nope"), { route: "x" }),
    ).not.toThrow();
    expect(() => r.captureMessage("hello", { a: 1 })).not.toThrow();
  });

  it("reportException / reportMessage tolerate no reporter installed", () => {
    expect(() => reportException(new Error("x"))).not.toThrow();
    expect(() => reportMessage("hello")).not.toThrow();
  });
});

describe("ErrorReporter with a custom provider", () => {
  let captured: {
    exceptions: Array<[unknown, Record<string, unknown> | undefined]>;
    messages: Array<[string, Record<string, unknown> | undefined]>;
  };
  let fake: ErrorReporter;

  beforeEach(() => {
    captured = { exceptions: [], messages: [] };
    fake = {
      captureException(err, ctx) {
        captured.exceptions.push([err, ctx]);
      },
      captureMessage(msg, ctx) {
        captured.messages.push([msg, ctx]);
      },
    };
    setErrorReporter(fake);
  });
  afterEach(() => {
    setErrorReporter(null);
    vi.restoreAllMocks();
  });

  it("delegates to the installed reporter", () => {
    reportException(new Error("kaboom"), { route: "api.search" });
    reportMessage("hello", { a: 1 });
    expect(captured.exceptions).toHaveLength(1);
    expect(captured.messages).toHaveLength(1);
    expect(captured.messages[0]![0]).toBe("hello");
    expect(captured.messages[0]![1]).toEqual({ a: 1 });
  });

  it("redacts API keys from error messages and context", () => {
    const err = new Error(`upstream failed for key=${REAL_KEY}`);
    reportException(err, {
      requestUrl: `https://googleapis.com/x?key=${REAL_KEY}`,
      apiKey: REAL_KEY,
      status: 500,
    });
    const [reportedErr, reportedCtx] = captured.exceptions[0]!;
    // The provider receives a redacted plain object for the error and
    // a redacted context — no AIza pattern anywhere.
    const serialized = JSON.stringify([reportedErr, reportedCtx]);
    expect(serialized).not.toContain(REAL_KEY);
    expect(serialized).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
    // Sensitive object keys are wholesale redacted regardless of value.
    expect((reportedCtx as Record<string, unknown>).apiKey).toBe(
      "[REDACTED]",
    );
    // Non-sensitive fields survive.
    expect((reportedCtx as Record<string, unknown>).status).toBe(500);
  });

  it("normalizes Error into a stack-free shape", () => {
    const err = new Error("boom");
    err.stack = "Error: boom\n  at Bar (/tmp/x.js:1:1)";
    reportException(err);
    const [reportedErr] = captured.exceptions[0]!;
    const obj = reportedErr as Record<string, unknown>;
    expect(obj.name).toBe("Error");
    expect(obj.message).toBe("boom");
    expect(obj.stack).toBeUndefined();
  });

  it("swallows exceptions thrown by the provider", () => {
    setErrorReporter({
      captureException() {
        throw new Error("provider broken");
      },
      captureMessage() {
        throw new Error("provider broken");
      },
    });
    expect(() => reportException(new Error("x"))).not.toThrow();
    expect(() => reportMessage("hello")).not.toThrow();
  });

  it("setErrorReporter(null) restores the no-op", () => {
    reportException(new Error("first"));
    expect(captured.exceptions).toHaveLength(1);
    setErrorReporter(null);
    reportException(new Error("second"));
    // The no-op reporter took over — nothing new arrived at `captured`.
    expect(captured.exceptions).toHaveLength(1);
  });
});
