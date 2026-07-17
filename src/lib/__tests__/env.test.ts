/**
 * Tests for the Zod-based environment validation.
 *
 * We test the schemas at the *module* level (they parse eagerly), so we
 * reset env vars and re-import between assertions using
 * `vi.resetModules()`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type EnvSnapshot = Record<string, string | undefined>;

const KEYS_UNDER_TEST = [
  "NEXT_PUBLIC_SITE_NAME",
  "NEXT_PUBLIC_SITE_URL",
  "NODE_ENV",
  "YOUTUBE_API_KEY",
  "YOUTUBE_TIMEOUT_MS",
  "RATE_LIMIT_MAX",
  "RATE_LIMIT_WINDOW_MS",
  "TRUST_PROXY",
] as const;

function snapshotEnv(): EnvSnapshot {
  return Object.fromEntries(KEYS_UNDER_TEST.map((k) => [k, process.env[k]]));
}

function restoreEnv(snapshot: EnvSnapshot) {
  for (const [k, v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function setEnv(overrides: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(overrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

async function loadPublicEnv() {
  vi.resetModules();
  return import("../env.public");
}

async function loadServerEnv() {
  vi.resetModules();
  return import("../env.server");
}

describe("env.public", () => {
  let snapshot: EnvSnapshot;
  beforeEach(() => {
    snapshot = snapshotEnv();
  });
  afterEach(() => {
    restoreEnv(snapshot);
    vi.restoreAllMocks();
  });

  it("uses safe defaults in development", async () => {
    setEnv({
      NODE_ENV: "development",
      NEXT_PUBLIC_SITE_NAME: undefined,
      NEXT_PUBLIC_SITE_URL: undefined,
    });
    const { publicEnv } = await loadPublicEnv();
    expect(publicEnv.siteName).toBe("YouTube Money Calculator");
    expect(publicEnv.siteUrl).toBe("http://localhost:3000");
    expect(publicEnv.isDevelopment).toBe(true);
    expect(publicEnv.isProduction).toBe(false);
  });

  it("strips a trailing slash from NEXT_PUBLIC_SITE_URL", async () => {
    setEnv({
      NODE_ENV: "test",
      NEXT_PUBLIC_SITE_URL: "https://example.com/",
    });
    const { publicEnv } = await loadPublicEnv();
    expect(publicEnv.siteUrl).toBe("https://example.com");
  });

  it("requires an absolute URL for NEXT_PUBLIC_SITE_URL in production", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "not-a-url",
    });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadPublicEnv()).rejects.toThrow(
      /Invalid public environment/i,
    );
    // The dev-facing log must NOT contain the raw invalid value.
    const logged = errSpy.mock.calls.map((c) => String(c[0])).join("\n");
    expect(logged).not.toContain("not-a-url");
  });

  it("rejects a missing NEXT_PUBLIC_SITE_URL in production", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: undefined,
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadPublicEnv()).rejects.toThrow(
      /Invalid public environment/i,
    );
  });

  it("accepts a valid absolute URL in production", async () => {
    setEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://prod.example.com",
      NEXT_PUBLIC_SITE_NAME: "Prod Site",
    });
    const { publicEnv } = await loadPublicEnv();
    expect(publicEnv.siteUrl).toBe("https://prod.example.com");
    expect(publicEnv.isProduction).toBe(true);
    expect(publicEnv.siteName).toBe("Prod Site");
  });
});

describe("env.server", () => {
  let snapshot: EnvSnapshot;
  beforeEach(() => {
    snapshot = snapshotEnv();
    // Server env module doesn't touch public env, so we can keep defaults.
    setEnv({
      NEXT_PUBLIC_SITE_URL: undefined,
      NODE_ENV: "test",
    });
  });
  afterEach(() => {
    restoreEnv(snapshot);
    vi.restoreAllMocks();
  });

  it("applies numeric defaults when unset", async () => {
    setEnv({
      YOUTUBE_API_KEY: undefined,
      YOUTUBE_TIMEOUT_MS: undefined,
      RATE_LIMIT_MAX: undefined,
      RATE_LIMIT_WINDOW_MS: undefined,
      TRUST_PROXY: undefined,
    });
    const { serverEnv, isYoutubeApiConfigured } = await loadServerEnv();
    expect(serverEnv.youtubeApiKey).toBe("");
    expect(serverEnv.youtubeTimeoutMs).toBe(8000);
    expect(serverEnv.rateLimitMax).toBe(60);
    expect(serverEnv.rateLimitWindowMs).toBe(60_000);
    expect(serverEnv.trustProxy).toBe(false);
    expect(isYoutubeApiConfigured()).toBe(false);
  });

  it("coerces numeric env values from strings", async () => {
    setEnv({
      YOUTUBE_TIMEOUT_MS: "3000",
      RATE_LIMIT_MAX: "5",
      RATE_LIMIT_WINDOW_MS: "1500",
    });
    const { serverEnv } = await loadServerEnv();
    expect(serverEnv.youtubeTimeoutMs).toBe(3000);
    expect(serverEnv.rateLimitMax).toBe(5);
    expect(serverEnv.rateLimitWindowMs).toBe(1500);
  });

  it("rejects out-of-range values", async () => {
    setEnv({ RATE_LIMIT_MAX: "0" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadServerEnv()).rejects.toThrow(
      /Invalid server environment/i,
    );
  });

  it("rejects non-numeric numeric envs", async () => {
    setEnv({ YOUTUBE_TIMEOUT_MS: "not-a-number" });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(loadServerEnv()).rejects.toThrow(
      /Invalid server environment/i,
    );
    const logged = errSpy.mock.calls.map((c) => String(c[0])).join("\n");
    // Value must NOT be echoed back (could contain secrets in real usage).
    expect(logged).not.toContain("not-a-number");
  });

  it("parses TRUST_PROXY truthy values", async () => {
    for (const truthy of ["1", "true", "TRUE", "yes", "on"]) {
      setEnv({ TRUST_PROXY: truthy });
      const { serverEnv } = await loadServerEnv();
      expect(serverEnv.trustProxy).toBe(true);
    }
  });

  it("parses TRUST_PROXY falsy values", async () => {
    for (const falsy of ["0", "false", "no", "off", "", undefined]) {
      setEnv({ TRUST_PROXY: falsy });
      const { serverEnv } = await loadServerEnv();
      expect(serverEnv.trustProxy).toBe(false);
    }
  });

  it("marks YouTube API as configured when a key is present", async () => {
    setEnv({ YOUTUBE_API_KEY: "AIza-test-key" });
    const { isYoutubeApiConfigured, serverEnv } = await loadServerEnv();
    expect(isYoutubeApiConfigured()).toBe(true);
    // The exported value contains the key (needed by the wrapper) —
    // but the module is `import "server-only"` so it never reaches
    // the client. We do NOT expose it anywhere else in the app.
    expect(serverEnv.youtubeApiKey).toBe("AIza-test-key");
  });

  it("does not include env values in the thrown Error message", async () => {
    setEnv({ RATE_LIMIT_MAX: "-5" });
    vi.spyOn(console, "error").mockImplementation(() => {});
    let caught: unknown;
    try {
      await loadServerEnv();
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).not.toContain("-5");
  });
});
