import { expect, test, type Page } from "@playwright/test";

/**
 * E2E tests for Milestone 1 — Favorites, Recent Tools, and Share integration.
 *
 * Tests the full user flow:
 *   1. Favoriting from a tool card
 *   2. Clicking favorite doesn't navigate
 *   3. Favorites persist across reload
 *   4. Favorited tools appear in homepage Favorites tab
 *   5. Visiting a tool records it in Recent
 *   6. Recent survives reload
 *   7. Reopening a tool moves it to the top
 *   8. Clicking a Recent/Favorite card opens the correct route
 *   9. Share button shows copy feedback
 *  10. Non-English locale preserves navigation
 */

// Helper: get the favorite button within a tool card by tool title
async function getFavoriteButtonInCard(page: Page, toolTitle: string) {
  const card = page.locator('[class*="card"]', { has: page.getByRole("heading", { name: toolTitle }) }).first();
  return card.getByRole("button", { name: /favorite/i });
}

test.describe("Favorites from ToolCard", () => {
  test("favorite a tool from a tool card", async ({ page }) => {
    await page.goto("/");
    // Find the first tool card's favorite button
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    await expect(favBtn).toBeVisible();
    await favBtn.click();
    // Button should now show "Remove from favorites"
    await expect(favBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking the favorite button does not navigate", async ({ page }) => {
    await page.goto("/");
    const url = page.url();
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    await favBtn.click();
    // URL should not change
    expect(page.url()).toBe(url);
  });

  test("favorite survives reload", async ({ page }) => {
    await page.goto("/");
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    await favBtn.click();
    await expect(favBtn).toHaveAttribute("aria-pressed", "true");

    // Reload
    await page.reload();

    // Find the button that is now pressed (favorited)
    const pressedBtn = page.getByRole("button", { name: /remove from favorites/i }).first();
    await expect(pressedBtn).toBeVisible();
    await expect(pressedBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("favorited tool appears in homepage Favorites tab", async ({ page }) => {
    await page.goto("/");

    // Favorite the first tool card — capture its title
    const firstCard = page.locator('[class*="card"]').filter({ has: page.getByRole("button", { name: /add to favorites/i }) }).first();
    const toolTitle = await firstCard.getByRole("heading").first().textContent();
    const favBtn = firstCard.getByRole("button", { name: /add to favorites/i });
    await favBtn.click();

    // Click the "Favorites" tab
    const favoritesTab = page.getByRole("tab", { name: /favorites/i });
    await favoritesTab.click();

    // The tool should appear in the favorites section
    await expect(page.getByRole("heading", { name: toolTitle! })).toBeVisible();
  });
});

test.describe("Recent Tools", () => {
  test("visiting a tool records it in Recent", async ({ page }) => {
    // Visit the coin-flip page (a decision tool)
    await page.goto("/coin-flip");
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();

    // Go to homepage and check Recent tab
    await page.goto("/");
    const recentTab = page.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // "Coin Flip" should appear
    await expect(page.getByRole("heading", { name: /coin flip/i })).toBeVisible();
  });

  test("recent tool survives reload", async ({ page }) => {
    await page.goto("/coin-flip");
    await page.goto("/");

    // Reload the homepage
    await page.reload();

    const recentTab = page.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();
    await expect(page.getByRole("heading", { name: /coin flip/i })).toBeVisible();
  });

  test("reopening a tool moves it to the top", async ({ page }) => {
    // Visit two tools in order
    await page.goto("/coin-flip");
    await page.goto("/dice-roller");

    // Now revisit coin-flip
    await page.goto("/coin-flip");

    // Go to homepage and check Recent tab
    await page.goto("/");
    const recentTab = page.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // First card in recent should be Coin Flip (most recent visit)
    const recentCards = page.locator('[class*="card"]').filter({ has: page.getByRole("heading") });
    const firstTitle = await recentCards.first().getByRole("heading").first().textContent();
    expect(firstTitle).toMatch(/coin flip/i);
  });

  test("clicking a Recent card opens the correct localized route", async ({ page }) => {
    await page.goto("/coin-flip");
    await page.goto("/");

    const recentTab = page.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // Click the Coin Flip card link
    const cardLink = page.getByRole("link", { name: /coin flip/i }).first();
    await cardLink.click();

    // Should navigate to the coin-flip page
    await expect(page).toHaveURL(/\/coin-flip/);
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();
  });
});

test.describe("Share Button", () => {
  test("share button displays copy-success feedback", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/coin-flip");

    const shareBtn = page.getByRole("button", { name: /share/i });
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    // Should show "Copied!" feedback
    await expect(page.getByRole("button", { name: /link copied/i })).toBeVisible();
  });
});

test.describe("Locale Behavior", () => {
  test("non-English locale preserves navigation correctly", async ({ page }) => {
    // Visit a tool in Spanish locale
    await page.goto("/es/coin-flip");
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Go to Spanish homepage and check Recent tab
    await page.goto("/es");
    const recentTab = page.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // Click the card — should navigate to Spanish locale
    const cardLink = page.getByRole("link", { name: /coin flip/i }).first();
    await cardLink.click();
    await expect(page).toHaveURL(/\/es\/coin-flip/);
  });
});
