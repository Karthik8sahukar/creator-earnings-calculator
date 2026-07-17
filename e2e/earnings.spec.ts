import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Earnings calculator interactions:
 *   1. Change monthly views
 *   2. Change country
 *   3. Change niche
 *   4. Change monetized %
 *   5. Add sponsorship income
 *   6. Change currency
 *   7. Verify earnings update
 *   8. Copy or generate a share URL
 *   9. Reload the share URL
 *  10. Confirm assumptions are restored
 */

test("earnings workflow: assumptions drive the estimate and round-trip through the URL", async ({
  page,
}) => {
  await page.goto(`/channel/${CHANNEL_IDS.alpha}`);
  await expect(
    page.getByRole("heading", { name: /earnings estimator/i }),
  ).toBeVisible();

  // Read the initial monthly total.
  const monthly = page.getByTestId("earnings-monthly");
  const initialText = (await monthly.textContent()) ?? "";
  expect(initialText.length).toBeGreaterThan(0);

  // 1. Change monthly views
  const monthlyViews = page.getByLabel("Monthly views", { exact: true });
  await monthlyViews.fill("500000");

  // 2. Change country
  await page.getByLabel("Country / audience", { exact: true }).selectOption("US");

  // 3. Change niche
  await page.getByLabel("Niche", { exact: true }).selectOption("finance");

  // 4. Change monetized %
  const monetized = page.getByLabel("Monetized views %", { exact: true });
  await monetized.fill("80");
  await monetized.dispatchEvent("change");

  // 5. Add sponsorship income
  await page.getByLabel("Sponsorships", { exact: true }).fill("500");

  // 6. Change currency
  await page.getByLabel("Display currency", { exact: true }).selectOption("EUR");

  // 7. Verify the headline changed away from the initial reading.
  await expect(monthly).not.toHaveText(initialText);
  await expect(monthly).toContainText("€");

  // 8. Wait for the debounced URL sync (200ms in-app) to write our
  //    changes. `waitForFunction` polls rather than sleeping for a
  //    fixed duration, which keeps the test stable on slow CI runners.
  await page.waitForFunction(
    () =>
      window.location.search.includes("cur=EUR") &&
      window.location.search.includes("n=finance") &&
      window.location.search.includes("sp=500"),
    undefined,
    { timeout: 5000 },
  );
  const shareUrl = page.url();
  expect(shareUrl).toContain("cur=EUR");
  expect(shareUrl).toContain("n=finance");
  expect(shareUrl).toContain("sp=500");
  expect(shareUrl).toContain(`/channel/${CHANNEL_IDS.alpha}`);

  // 9. Reload the share URL in a fresh navigation.
  await page.goto(shareUrl);

  // 10. Assumptions are restored.
  await expect(
    page.getByLabel("Country / audience", { exact: true }),
  ).toHaveValue("US");
  await expect(
    page.getByLabel("Niche", { exact: true }),
  ).toHaveValue("finance");
  await expect(
    page.getByLabel("Display currency", { exact: true }),
  ).toHaveValue("EUR");
  await expect(
    page.getByLabel("Sponsorships", { exact: true }),
  ).toHaveValue("500");
});

test("copy share link surfaces success in an ARIA live region", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`/channel/${CHANNEL_IDS.alpha}`);
  await expect(
    page.getByRole("heading", { name: /share this channel/i }),
  ).toBeVisible();
  await page.getByTestId("share-copy-link").click();
  await expect(
    page.getByRole("status").filter({ hasText: /link copied/i }),
  ).toBeVisible();
});
