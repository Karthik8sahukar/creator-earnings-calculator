import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Responsive smoke tests. The project configuration in
 * `playwright.config.ts` runs this file across three viewports:
 * 375×812 (mobile), 768×1024 (tablet), 1440×900 (desktop).
 */

test("homepage renders with search textbox and Search Channel button", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /youtube money calculator/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /search channel/i }),
  ).toBeVisible();
});

test("search textbox and button remain usable on all viewports", async ({
  page,
}) => {
  await page.goto("/");
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
