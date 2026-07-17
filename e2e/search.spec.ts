import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Channel search + full channel workspace workflow.
 */

test.describe("channel search workflow", () => {
  test("search → select → channel dashboard renders", async ({ page }) => {
    await page.goto("/");

    // 1. Homepage
    await expect(
      page.getByRole("heading", { level: 1, name: /youtube money calculator/i }),
    ).toBeVisible();

    // 2. Enter a channel name
    const input = page.getByRole("combobox");
    await input.fill("test");

    // 3+4. Suggestions load with multiple results
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    const options = listbox.getByRole("option");
    await expect(options).toHaveCount(3);

    // 5. Verify profile images appear
    const optionImages = listbox.locator("img");
    await expect(optionImages).toHaveCount(3);

    // 6. Select the first channel
    await options.first().click();

    // 7. Profile card loads (Alpha fixture)
    await expect(
      page.getByRole("heading", { level: 1, name: "Alpha Test Channel" }),
    ).toBeVisible();
    // Includes the "View on YouTube" link
    const viewLink = page.getByRole("link", { name: /view alpha test channel on youtube/i });
    await expect(viewLink).toHaveAttribute(
      "href",
      /youtube\.com/,
    );
    await expect(viewLink).toHaveAttribute("target", "_blank");
    await expect(viewLink).toHaveAttribute("rel", /noopener/);

    // 8. Recent videos load
    await expect(
      page.getByRole("heading", { name: /recent videos/i }),
    ).toBeVisible();
    await expect(page.getByText("How to test end to end")).toBeVisible();

    // 9. Performance statistics
    await expect(
      page.getByRole("heading", { name: /performance analysis/i }),
    ).toBeVisible();

    // 10. Earnings calculator
    await expect(
      page.getByRole("heading", { name: /earnings estimator/i }),
    ).toBeVisible();
  });

  test("selecting a channel navigates to /channel/[channelId]", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("combobox").fill("test");
    await page.getByRole("listbox").getByRole("option").first().click();
    await page.waitForURL(new RegExp(`/channel/${CHANNEL_IDS.alpha}`));
  });

  test("empty results state renders a helpful message", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("combobox").fill("empty");
    await expect(
      page.getByText(/no channels found/i),
    ).toBeVisible();
  });
});
