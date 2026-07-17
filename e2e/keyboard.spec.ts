import { expect, test } from "@playwright/test";

/**
 * Keyboard-only interactions on the search combobox.
 * Verifies arrow-key navigation, Enter to select, Escape to close.
 */

test("keyboard workflow: arrow keys navigate, enter selects, escape closes", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("combobox");
  await input.focus();
  await input.fill("test");

  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  const options = listbox.getByRole("option");
  await expect(options).toHaveCount(3);

  // Arrow Down → first option becomes active
  await input.press("ArrowDown");
  await expect(options.nth(0)).toHaveAttribute("aria-selected", "true");

  // Arrow Down twice more → third option
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await expect(options.nth(2)).toHaveAttribute("aria-selected", "true");

  // Arrow Up → second option
  await input.press("ArrowUp");
  await expect(options.nth(1)).toHaveAttribute("aria-selected", "true");

  // Enter → selects, navigates, and the listbox goes away
  await input.press("Enter");
  await expect(listbox).toBeHidden();
  await page.waitForURL(/\/channel\//);
});

test("Escape closes the suggestion list", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("combobox");
  await input.fill("test");
  const listbox = page.getByRole("listbox");
  await expect(listbox).toBeVisible();
  await input.press("Escape");
  await expect(listbox).toBeHidden();
});
