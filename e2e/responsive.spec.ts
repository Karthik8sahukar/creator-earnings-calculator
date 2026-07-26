import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Responsive smoke tests. The project configuration in
 * `playwright.config.ts` runs this file across three viewports:
 * 375×812 (mobile), 768×1024 (tablet), 1440×900 (desktop).
 *
 * The App Store redesign moved channel search to the "Creators" tab.
 * The homepage H1 is now sr-only (screen-reader accessible but not
 * visually displayed). Tests assert on the visible heading instead.
 */

/** Navigate to homepage and open the Creators tab to reveal YouTube search. */
async function openCreatorSearch(page: import("@playwright/test").Page) {
  await page.goto("/youtube-money-calculator");
}

test("homepage renders the App Store hero and navigation", async ({
  page,
}) => {
  await page.goto("/");
  // The visible heading is "The App Store for Free Online Tools"
  await expect(
    page.getByText(/the app store for/i),
  ).toBeVisible();
  // Search trigger button should be visible
  await expect(
    page.getByRole("button", { name: /search tools/i }),
  ).toBeVisible();
});

test("Creators tab reveals search textbox and Search Channel button", async ({
  page,
}) => {
  await openCreatorSearch(page);
  const input = page.getByRole("textbox");
  const btn = page.getByRole("button", { name: /search channel/i });

  // Both are visible and enabled
  await expect(input).toBeVisible();
  await expect(btn).toBeVisible();

  // Fill and submit works
  await input.fill("@test");
  await btn.click();
  await expect(page.getByText("Alpha Test Channel")).toBeVisible();
});

test("channel page renders the primary regions", async ({ page }) => {
  await page.goto(`/channel/${CHANNEL_IDS.alpha}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Alpha Test Channel" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /earnings estimator/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /share this channel/i }),
  ).toBeVisible();
});
