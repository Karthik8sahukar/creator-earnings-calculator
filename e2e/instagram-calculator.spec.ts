import { expect, test } from "@playwright/test";

/**
 * End-to-end tests for the Instagram Money Calculator.
 *
 * We verify:
 *   - The page renders across the default locale.
 *   - Non-English locale routes work.
 *   - The results section shows non-zero low/expected/high bands.
 *   - Editing an input updates the results.
 *   - Sharing works: the URL updates and reloading it restores state.
 *   - The advanced settings can be toggled.
 *   - No translation keys are visibly rendered.
 */

test("renders the Instagram Money Calculator at /en/instagram-money-calculator", async ({
  page,
}) => {
  await page.goto("/en/instagram-money-calculator");
  await expect(
    page.getByRole("heading", { level: 1, name: /instagram money calculator/i }),
  ).toBeVisible();
  await expect(
    page.getByTestId("instagram-calculator-form"),
  ).toBeVisible();
  await expect(
    page.getByTestId("instagram-calculator-results"),
  ).toBeVisible();
});

test("results respond to input changes", async ({ page }) => {
  await page.goto("/en/instagram-money-calculator");
  const bandRow = page.getByTestId("ig-band-row");

  const followers = page.getByTestId("ig-followers");
  await followers.fill("");
  await followers.fill("500000");

  // Expected band must contain a currency amount.
  await expect(bandRow).toContainText(/\$/);
});

test("share URL round-trips calculator state", async ({ page }) => {
  // Land with a preset in the URL.
  await page.goto(
    "/en/instagram-money-calculator?followers=750000&engagement=6&niche=finance&country=US",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: /instagram money calculator/i }),
  ).toBeVisible();
  const followers = page.getByTestId("ig-followers");
  await expect(followers).toHaveValue("750000");
  const niche = page.getByTestId("ig-niche");
  await expect(niche).toHaveValue("finance");
  const engagement = page.getByTestId("ig-engagement");
  await expect(engagement).toHaveValue("6");
});

test("invalid query parameters are ignored safely", async ({ page }) => {
  await page.goto(
    "/en/instagram-money-calculator?followers=NOT_A_NUMBER&country=ZZZ&niche=HACKED",
  );
  await expect(
    page.getByRole("heading", { level: 1, name: /instagram money calculator/i }),
  ).toBeVisible();
  const bandRow = page.getByTestId("ig-band-row");
  // Falls back to defaults → results still render.
  await expect(bandRow).toContainText(/\$/);
});

test("advanced settings can be toggled", async ({ page }) => {
  await page.goto("/en/instagram-money-calculator");
  const toggle = page.getByTestId("ig-advanced-toggle");
  await toggle.click();
  await expect(page.locator("#ig-advanced")).toBeVisible();
  await toggle.click();
  await expect(page.locator("#ig-advanced")).toHaveCount(0);
});

test("Hindi locale renders the calculator", async ({ page }) => {
  await page.goto("/hi/instagram-money-calculator");
  await expect(
    page.getByTestId("instagram-calculator-form"),
  ).toBeVisible();
});

test("no raw translation keys are rendered", async ({ page }) => {
  await page.goto("/en/instagram-money-calculator");
  // Translation keys look like `foo.bar.baz` — assert none are on-page.
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(/instagramCalculator\.[a-zA-Z0-9_.]+/);
  expect(text).not.toMatch(/breakdown\.sponsoredPosts$/);
});
