import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Responsive smoke tests. The project configuration in
 * `playwright.config.ts` runs this file across three viewports:
 * 375×812 (mobile), 768×1024 (tablet), 1440×900 (desktop).
 */

test("homepage renders and the search input is reachable", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /search any youtube channel/i }),
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toBeVisible();
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
