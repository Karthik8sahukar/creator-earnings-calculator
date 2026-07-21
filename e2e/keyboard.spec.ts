import { expect, test } from "@playwright/test";

/**
 * Keyboard interactions for the channel search.
 *
 * The new UX has no combobox, no arrow-key navigation, no Escape.
 * Enter submits the search, just like clicking "Search Channel".
 */

test("pressing Enter submits the search and loads results", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox");
  await input.focus();
  await input.fill("@test");
  await input.press("Enter");

  // Results appear after submission
  await expect(page.getByText("Alpha Test Channel")).toBeVisible();
});

test("pressing Enter navigates to channel after clicking a result", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox");
  await input.fill("@test");
  await input.press("Enter");

  // Wait for result and click it
  await expect(page.getByText("Alpha Test Channel")).toBeVisible();
  await page.getByText("Alpha Test Channel").click();
  await page.waitForURL(/\/channel\//);
});

test("Enter with invalid input shows validation message", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox");
  await input.fill("gaming channel");
  await input.press("Enter");

  const error = page.getByTestId("channel-search-error");
  await expect(error).toBeVisible();
  await expect(error).toContainText(
    /valid YouTube @handle, channel URL, or channel ID/i,
  );
});
