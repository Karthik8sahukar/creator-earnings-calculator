import { expect, test } from "@playwright/test";

/**
 * Smoke tests for the four standalone calculators.
 * We only verify the page renders and the primary output responds
 * to input changes — the maths itself is covered in unit tests.
 */

test("RPM calculator", async ({ page }) => {
  await page.goto("/youtube-rpm-calculator");
  await expect(
    page.getByRole("heading", { name: /rpm/i }).first(),
  ).toBeVisible();
  await page.getByLabel("Revenue amount").fill("500");
  await page.getByLabel("Total views").fill("100000");
  // 500 / 100000 * 1000 = 5
  // The result appears in the highlighted headline AND in the
  // "formula" echo below. Assert the headline only.
  await expect(
    page.locator('[aria-live="polite"]', { hasText: /\$5\.00/ }),
  ).toBeVisible();
});

test("CPM calculator", async ({ page }) => {
  await page.goto("/youtube-cpm-calculator");
  await expect(
    page.getByRole("heading", { name: /cpm/i }).first(),
  ).toBeVisible();
  await page.getByLabel("Gross ad revenue amount").fill("200");
  await page.getByLabel("Monetized impressions").fill("50000");
  // 200 / 50000 * 1000 = 4
  await expect(
    page.locator('[aria-live="polite"]', { hasText: /\$4\.00/ }),
  ).toBeVisible();
});

test("Shorts calculator", async ({ page }) => {
  await page.goto("/youtube-shorts-calculator");
  await expect(
    page.getByRole("heading", { name: /shorts/i }).first(),
  ).toBeVisible();
  await page.getByLabel("Monthly Shorts views").fill("2000000");
  // Expected band should be a real currency amount, non-zero.
  const expectedBand = page.getByText("Expected monthly").locator("..");
  await expect(expectedBand).toContainText(/\$\d/);
});

test("Sponsorship calculator", async ({ page }) => {
  await page.goto("/youtube-sponsorship-calculator");
  await expect(
    page.getByRole("heading", { name: /sponsorship/i }).first(),
  ).toBeVisible();
  await page.getByLabel("Subscribers").fill("500000");
  await page.getByLabel("Average views per video").fill("200000");
  const expected = page.getByText("Expected rate (per video)").locator("..");
  await expect(expected).toContainText(/\$\d/);
});
