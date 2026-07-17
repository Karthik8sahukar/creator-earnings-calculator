import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for Creator Earnings Calculator.
 *
 * We run the Next.js server in E2E mock mode (`E2E_MOCK_MODE=1`) so the
 * suite never touches the real YouTube API. See `src/lib/e2eFixtures.ts`
 * for the guardrails that make this impossible to enable in production.
 */

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [
        ["list"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
      ]
    : [["list"]],

  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Playwright's built-in colorScheme respects OS by default; force
    // light for consistent screenshots.
    colorScheme: "light",
  },

  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      // Tablet viewport, still driven by Chromium so a single browser
      // download covers the whole suite.
      name: "chromium-tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
      testMatch: /.*\.(responsive|smoke)\.spec\.ts/,
    },
    {
      // Mobile viewport, Chromium (not WebKit) for the same reason.
      name: "chromium-mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: false,
        hasTouch: true,
      },
      testMatch: /.*\.(responsive|smoke)\.spec\.ts/,
    },
  ],

  webServer: {
    // Start the Next.js dev server for E2E. Dev mode is fast to boot,
    // exercises the same routes, and picks up the mock env vars.
    command: `npm run dev -- --port ${PORT} --hostname 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_MOCK_MODE: "1",
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      NEXT_PUBLIC_SITE_NAME: "Creator Earnings Calculator",
      // The mock never touches YouTube — but the env schema requires
      // a non-empty key when the code path expects one. We pass a
      // placeholder so `isYoutubeApiConfigured()` is true in tests
      // that expect the health endpoint to say "configured".
      YOUTUBE_API_KEY: "e2e-mock-placeholder-not-a-real-key",
      // Keep the rate limiter permissive during tests.
      RATE_LIMIT_MAX: "1000",
    },
  },
});
