import { expect, test } from "@playwright/test";

import { CHANNEL_IDS } from "./fixtures/ids";

/**
 * Channel search + full channel workspace workflow.
 *
 * The App Store redesign moved channel search to the "Creators" tab.
 * Tests must switch to that tab before interacting with the search.
 */

/** Navigate to homepage and open the Creators tab to reveal YouTube search. */
async function openCreatorSearch(page: import("@playwright/test").Page) {
  await page.goto("/youtube-money-calculator");
}

test.describe("channel search workflow", () => {
  test("search → submit → channel result → navigate to dashboard", async ({
    page,
  }) => {
    await openCreatorSearch(page);

    // Enter a query into the textbox
    const input = page.getByRole("textbox");
    await input.fill("@MrBeast");

    // Click the Search Channel button
    const searchBtn = page.getByRole("button", { name: /search channel/i });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    // Results appear (E2E mock returns 3 channels for any valid query)
    await expect(page.getByText("Alpha Test Channel")).toBeVisible();

    // Click the first result to navigate
    await page.getByText("Alpha Test Channel").click();

    // Channel dashboard loads
    await expect(
      page.getByRole("heading", { level: 1, name: "Alpha Test Channel" }),
    ).toBeVisible();

    // Includes the "View on YouTube" link
    const viewLink = page.getByRole("link", {
      name: /view alpha test channel on youtube/i,
    });
    await expect(viewLink).toHaveAttribute("href", /youtube\.com/);
    await expect(viewLink).toHaveAttribute("target", "_blank");
    await expect(viewLink).toHaveAttribute("rel", /noopener/);

    // Recent videos load
    await expect(
      page.getByRole("heading", { name: /recent videos/i }),
    ).toBeVisible();
    await expect(page.getByText("How to test end to end")).toBeVisible();

    // Performance statistics
    await expect(
      page.getByRole("heading", { name: /performance analysis/i }),
    ).toBeVisible();

    // Earnings calculator
    await expect(
      page.getByRole("heading", { name: /earnings estimator/i }),
    ).toBeVisible();
  });

  test("selecting a channel navigates to /channel/[channelId]", async ({
    page,
  }) => {
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("@alpha");
    await page.getByRole("button", { name: /search channel/i }).click();
    await page.getByText("Alpha Test Channel").click();
    await page.waitForURL(new RegExp(`/channel/${CHANNEL_IDS.alpha}`));
  });

  test("empty results state renders a helpful message", async ({ page }) => {
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("@empty");
    await page.getByRole("button", { name: /search channel/i }).click();
    const error = page.getByTestId("channel-search-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(/no channels found/i);
  });

  test("invalid plain text is rejected with validation message", async ({
    page,
  }) => {
    await openCreatorSearch(page);
    await page.getByRole("textbox").fill("MrBeast");
    await page.getByRole("button", { name: /search channel/i }).click();
    const error = page.getByTestId("channel-search-error");
    await expect(error).toBeVisible();
    await expect(error).toContainText(
      /valid YouTube @handle, channel URL, or channel ID/i,
    );
  });
});
