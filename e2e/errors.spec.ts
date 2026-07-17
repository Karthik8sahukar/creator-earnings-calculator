import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Error and edge workflows.
 *
 * Each case is triggered via the deterministic fixture:
 *   - "quota"        query → QUOTA_EXCEEDED on search
 *   - "unavailable"  query → UPSTREAM_UNAVAILABLE on search
 *   - UCQQQ… id      → QUOTA_EXCEEDED on channel fetch → error boundary
 *   - UCUUU… id      → UPSTREAM_UNAVAILABLE on channel fetch → error boundary
 *   - malformed id   → 404 (not-found segment)
 *   - Bravo channel  → 200 but no public videos
 *   - Charlie channel → 200 with hidden subscriber count
 */

test.describe("error workflows", () => {
  test("no results state", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("combobox").fill("empty");
    await expect(page.getByText(/no channels found/i)).toBeVisible();
  });

  test("invalid channel id in URL → not-found segment", async ({ page }) => {
    // Note: Next dev may serve notFound() responses with 200 or 404
    // depending on the caching layer. The content check is the source
    // of truth for the user-visible outcome.
    await page.goto(`/channel/${CHANNEL_IDS.invalid}`);
    await expect(
      page.getByRole("heading", { name: /channel not found/i }),
    ).toBeVisible();
  });

  test("YouTube quota exceeded on search shows a safe message", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("combobox").fill("quota");
    // The listbox surfaces the safe error message; nothing about internals.
    await expect(
      page.getByText(/quota has been exceeded/i),
    ).toBeVisible();
  });

  test("YouTube upstream unavailable on search shows a safe message", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("combobox").fill("unavailable");
    await expect(
      page.getByText(/currently unavailable/i),
    ).toBeVisible();
  });

  test("YouTube quota exceeded on channel page renders the error boundary", async ({
    page,
  }) => {
    await page.goto(`/channel/${CHANNEL_IDS.quotaExceeded}`);
    await expect(
      page.getByRole("heading", { name: /couldn.?t load channel/i }),
    ).toBeVisible();
  });

  test("channel with no public videos still renders profile + empty videos message", async ({
    page,
  }) => {
    await page.goto(`/channel/${CHANNEL_IDS.bravoNoVideos}`);
    await expect(
      page.getByRole("heading", { level: 1, name: /bravo channel/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/no public videos are available/i),
    ).toBeVisible();
  });

  test("channel with hidden subscriber count displays 'Hidden'", async ({
    page,
  }) => {
    await page.goto(`/channel/${CHANNEL_IDS.charlieHiddenSubs}`);
    await expect(
      page.getByRole("heading", { level: 1, name: /charlie channel/i }),
    ).toBeVisible();
    // The Subscribers stat shows "Hidden".
    await expect(
      page.getByText(/^Hidden$/).first(),
    ).toBeVisible();
  });

  test("missing API key surfaces a safe error on the search route", async ({
    page,
  }) => {
    // Route interception: force /api/search to respond as if
    // MISSING_API_KEY was thrown. This tests the client-side UX
    // without needing to disable the mock env.
    await page.route("**/api/search**", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "MISSING_API_KEY",
          message: "The YouTube API is not configured on the server.",
        }),
      }),
    );
    await page.goto("/");
    await page.getByRole("combobox").fill("something");
    await expect(
      page.getByText(/not configured on the server/i),
    ).toBeVisible();
  });
});
