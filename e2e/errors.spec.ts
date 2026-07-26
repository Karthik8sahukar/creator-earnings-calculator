import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Error and edge workflows.
 *
 * Each case is triggered via the deterministic fixture:
 *   - "@empty"       query → no results
 *   - "quota"        query → QUOTA_EXCEEDED on search
 *   - "unavailable"  query → UPSTREAM_UNAVAILABLE on search
 *   - UCQQQ… id      → QUOTA_EXCEEDED on channel fetch → error boundary
 *   - UCUUU… id      → UPSTREAM_UNAVAILABLE on channel fetch → error boundary
 *   - malformed id   → 404 (not-found segment)
 *   - Bravo channel  → 200 but no public videos
 *   - Charlie channel → 200 with hidden subscriber count
 */

test.describe("error workflows", () => {
  /**
   * Helper: navigate to homepage and switch to the Creators tab
   * so the YouTube channel search (ChannelWorkspace) is visible.
   * The App Store redesign defaults to the Tools tab.
   */
  async function openCreatorSearch(page: import("@playwright/test").Page) {
    await page.goto("/");
    // Switch to Creators tab to reveal the YouTube channel search
    await page.getByRole("tab", { name: /creators/i }).click();
  }

  test("no results state", async ({ page }) => {
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("@empty");
    await page.getByRole("button", { name: /search channel/i }).click();
    const error = page.getByTestId("channel-search-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/no channels found/i);
  });

  test("invalid channel id in URL → not-found segment", async ({ page }) => {
    await page.goto(`/channel/${CHANNEL_IDS.invalid}`);
    await expect(
      page.getByRole("heading", { name: /channel not found/i }),
    ).toBeVisible();
  });

  test("YouTube quota exceeded on search shows a safe message", async ({
    page,
  }) => {
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("@quota");
    await page.getByRole("button", { name: /search channel/i }).click();
    const error = page.getByTestId("channel-search-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/quota has been exceeded/i);
  });

  test("YouTube upstream unavailable on search shows a safe message", async ({
    page,
  }) => {
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("@unavailable");
    await page.getByRole("button", { name: /search channel/i }).click();
    const error = page.getByTestId("channel-search-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/currently unavailable/i);
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
    await expect(page.getByText(/^Hidden$/).first()).toBeVisible();
  });

  test("missing API key surfaces a safe error on the search route", async ({
    page,
  }) => {
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
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("@something");
    await page.getByRole("button", { name: /search channel/i }).click();
    await expect(
      page.getByText(/not configured on the server/i),
    ).toBeVisible();
  });
});
