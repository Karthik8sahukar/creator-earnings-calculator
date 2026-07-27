import { expect, test } from "@playwright/test";

/**
 * E2E tests for Milestone 2 — Search & Discovery enhancements.
 *
 * Tests the search modal with:
 *   1. Opening via Cmd+K / Ctrl+K shortcut
 *   2. Popular searches shown in empty state
 *   3. Trending tools shown in empty state
 *   4. Search results with highlighted text
 *   5. Keyboard navigation (ArrowDown, Enter)
 *   6. Selecting a result navigates to the tool
 *   7. Recent searches persist across modal opens
 *   8. Removing a recent search
 *   9. Zero-results suggestions
 *  10. Alias matching (e.g. "heads or tails" → Coin Flip)
 *  11. Non-English locale search works
 */

test.describe("Search Modal — Opening & Closing", () => {
  test("opens with Ctrl+K shortcut", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /search tools/i });
    await expect(dialog).toBeVisible();
  });

  test("closes with Escape", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /search tools/i });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("opens with / shortcut when not in an input", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("/");
    const dialog = page.getByRole("dialog", { name: /search tools/i });
    await expect(dialog).toBeVisible();
  });
});

test.describe("Search Modal — Empty State", () => {
  test("shows popular searches when opened", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    // Should show "Popular searches" section with pill buttons
    await expect(page.getByText(/popular searches/i)).toBeVisible();
    // At least one suggestion pill should exist
    const pills = page.getByRole("dialog").locator("button").filter({ hasText: /coin|json|word|rpm|uuid|random/i });
    await expect(pills.first()).toBeVisible();
  });

  test("shows trending tools when opened", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await expect(page.getByText(/trending tools/i)).toBeVisible();
  });

  test("clicking a popular search fills the input", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    // Click the first popular search pill
    const pill = page.getByRole("dialog").locator("button").filter({ hasText: /coin flip/i }).first();
    await pill.click();
    // Input should now have the query
    const input = page.getByRole("dialog").getByRole("textbox");
    await expect(input).toHaveValue(/coin flip/i);
  });
});

test.describe("Search Modal — Results & Highlights", () => {
  test("typing a query shows results", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("json");
    // Results list should appear
    const results = page.getByRole("dialog").getByRole("listbox");
    await expect(results).toBeVisible();
    // Should contain at least one result with "JSON" in the title
    await expect(results.getByRole("option").first()).toBeVisible();
  });

  test("results have highlighted matching text", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("coin");
    // Should have <mark> elements highlighting the matched text
    const marks = page.getByRole("dialog").locator("mark");
    await expect(marks.first()).toBeVisible();
    const markText = await marks.first().textContent();
    expect(markText?.toLowerCase()).toContain("coin");
  });

  test("alias matching works (heads or tails → Coin Flip)", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("heads or tails");
    // Should show Coin Flip in results
    const results = page.getByRole("dialog").getByRole("listbox");
    await expect(results.getByText(/coin flip/i).first()).toBeVisible();
  });
});

test.describe("Search Modal — Keyboard Navigation", () => {
  test("ArrowDown moves active selection", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("calculator");
    // Wait for results
    const firstOption = page.getByRole("dialog").getByRole("option").first();
    await expect(firstOption).toBeVisible();
    // First item should be active by default
    await expect(firstOption).toHaveAttribute("aria-selected", "true");
    // Arrow down should move to second
    await page.keyboard.press("ArrowDown");
    const secondOption = page.getByRole("dialog").getByRole("option").nth(1);
    await expect(secondOption).toHaveAttribute("aria-selected", "true");
  });

  test("Enter navigates to the active result", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("coin flip");
    // Wait for results
    const firstOption = page.getByRole("dialog").getByRole("option").first();
    await expect(firstOption).toBeVisible();
    // Press Enter to navigate
    await page.keyboard.press("Enter");
    // Should navigate to coin-flip page
    await expect(page).toHaveURL(/\/coin-flip/);
  });
});

test.describe("Search Modal — Recent Searches", () => {
  test("search is recorded and shown on next open", async ({ page }) => {
    await page.goto("/");
    // First search
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("dice roller");
    await page.keyboard.press("Enter");
    // Wait for navigation
    await expect(page).toHaveURL(/\/dice-roller/);

    // Navigate back to homepage where the search modal lives
    await page.goto("/");
    // Open search again
    await page.keyboard.press("Control+k");
    // Should show "Recent searches" section with "dice roller"
    await expect(page.getByRole("dialog").getByText("Recent searches", { exact: true })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("dice roller")).toBeVisible();
  });

  test("clicking a recent search fills input", async ({ page }) => {
    // Seed a recent search
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("behumler:search-history", JSON.stringify(["coin flip", "json"]));
    });
    await page.reload();

    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog").getByText("Recent searches", { exact: true })).toBeVisible();
    // Click "coin flip" in recent
    const recentItem = page.getByRole("dialog").getByText("coin flip").first();
    await recentItem.click();
    const input = page.getByRole("dialog").getByRole("textbox");
    await expect(input).toHaveValue("coin flip");
  });

  test("removing a recent search works", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("behumler:search-history", JSON.stringify(["remove-me", "keep-me"]));
    });
    await page.reload();

    await page.keyboard.press("Control+k");
    // Should show both
    await expect(page.getByRole("dialog").getByText("remove-me")).toBeVisible();

    // Hover over the item to reveal the X button and click it
    const item = page.getByRole("dialog").locator("div").filter({ hasText: "remove-me" }).first();
    await item.hover();
    const removeBtn = page.getByRole("dialog").getByRole("button", { name: /remove.*remove-me/i });
    await removeBtn.click();

    // Should be gone
    await expect(page.getByRole("dialog").getByText("remove-me")).not.toBeVisible();
    // Other should remain
    await expect(page.getByRole("dialog").getByText("keep-me")).toBeVisible();
  });

  test("clear all removes all recent searches", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("behumler:search-history", JSON.stringify(["one", "two", "three"]));
    });
    await page.reload();

    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog").getByText("Recent searches", { exact: true })).toBeVisible();

    // Click "Clear all"
    const clearBtn = page.getByRole("dialog").getByText(/clear all/i);
    await clearBtn.click();

    // Recent searches section should disappear
    await expect(page.getByRole("dialog").getByText("Recent searches", { exact: true })).not.toBeVisible();
  });
});

test.describe("Search Modal — Zero Results", () => {
  test("shows suggestions when no results found", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    await input.fill("xyznonexistent");
    // Should show "No tools found" message
    await expect(page.getByRole("dialog").getByText(/no tools found/i)).toBeVisible();
    // Should show category suggestion pills
    const suggestionPills = page.getByRole("dialog").locator("button").filter({ hasText: /calculator|random|json|text|converter/i });
    await expect(suggestionPills.first()).toBeVisible();
  });

  test("shows 'you might be looking for' when partial matches exist", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const input = page.getByRole("dialog").getByRole("textbox");
    // Use a query that won't match any title/tag/alias but has words
    // that partially overlap with category names for zero-result suggestions
    await input.fill("zznotool qwerty");
    // May show "You might be looking for" if zero-results suggestions find related tools
    // Or "No tools found" — the important thing is no crash
    const dialog = page.getByRole("dialog");
    const noResults = dialog.getByText(/no tools found/i);
    const suggestions = dialog.getByText(/you might be looking for/i);
    // At least one of these should appear
    await expect(noResults.or(suggestions).first()).toBeVisible();
  });
});

test.describe("Search Modal — Locale", () => {
  test("search works in non-English locale", async ({ page }) => {
    await page.goto("/es");
    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog", { name: /search tools/i });
    await expect(dialog).toBeVisible();

    const input = dialog.getByRole("textbox");
    await input.fill("coin flip");
    await page.keyboard.press("Enter");
    // Should navigate to Spanish locale coin-flip page
    await expect(page).toHaveURL(/\/es\/coin-flip/);
  });
});
