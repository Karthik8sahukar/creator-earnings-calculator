import { expect, test } from "@playwright/test";

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

test.describe("Favorites from ToolCard", () => {
  test("favorite a tool from a tool card", async ({ page }) => {
    await page.goto("/");
    // Find the first tool card's favorite button
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    await expect(favBtn).toBeVisible();
    await favBtn.click();
    // Button should now show "Remove from favorites" with aria-pressed="true"
    const pressedBtn = page.getByRole("button", { name: /remove from favorites/i }).first();
    await expect(pressedBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("clicking the favorite button does not navigate", async ({ page }) => {
    await page.goto("/");
    const url = page.url();
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    await favBtn.click();
    // URL should not change (button click should not trigger card navigation)
    expect(page.url()).toBe(url);
  });

  test("favorite survives reload", async ({ page }) => {
    await page.goto("/");
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    await favBtn.click();
    // After click, button should be in pressed state
    const pressedBtn = page.getByRole("button", { name: /remove from favorites/i }).first();
    await expect(pressedBtn).toHaveAttribute("aria-pressed", "true");

    // Reload
    await page.reload();

    // Find the button that is now pressed (favorited) — should persist
    const reloadedBtn = page.getByRole("button", { name: /remove from favorites/i }).first();
    await expect(reloadedBtn).toBeVisible();
    await expect(reloadedBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("favorited tool appears in homepage Favorites tab", async ({ page }) => {
    await page.goto("/");

    // Scope to the QuickDiscovery section to avoid duplicate ToolCard matches
    const discovery = page.locator("section").filter({ has: page.locator("#quick-discovery-title") });

    // Favorite the first tool card on the page
    const favBtn = page.getByRole("button", { name: /add to favorites/i }).first();
    // Capture the tool title from the card containing this button
    const firstCard = page.locator('[class*="card"]').filter({ has: page.getByRole("button", { name: /add to favorites/i }) }).first();
    const toolTitle = await firstCard.getByRole("heading").first().textContent();
    await favBtn.click();

    // Click the "Favorites" tab (within QuickDiscovery)
    const favoritesTab = discovery.getByRole("tab", { name: /favorites/i });
    await favoritesTab.click();

    // The tool should appear in the QuickDiscovery favorites section
    await expect(discovery.getByRole("heading", { name: toolTitle! }).first()).toBeVisible();
  });
});

test.describe("Recent Tools", () => {
  test("visiting a tool records it in Recent", async ({ page }) => {
    // Visit the coin-flip page (a decision tool)
    await page.goto("/coin-flip");
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();

    // Go to homepage and check Recent tab
    await page.goto("/");
    const discovery = page.locator("section").filter({ has: page.locator("#quick-discovery-title") });
    const recentTab = discovery.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // "Coin Flip" should appear in the QuickDiscovery recent section
    await expect(discovery.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();
  });

  test("recent tool survives reload", async ({ page }) => {
    await page.goto("/coin-flip");
    // Ensure the page fully renders (ToolVisitTracker fires on mount)
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();
    await page.goto("/");

    // Reload the homepage
    await page.reload();

    const discovery = page.locator("section").filter({ has: page.locator("#quick-discovery-title") });
    const recentTab = discovery.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();
    await expect(discovery.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();
  });

  test("reopening a tool moves it to the top", async ({ page }) => {
    // Visit two tools in order, ensuring each fully renders
    await page.goto("/coin-flip");
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();
    await page.goto("/dice-roller");
    await expect(page.getByRole("heading", { name: /dice roller/i }).first()).toBeVisible();

    // Now revisit coin-flip
    await page.goto("/coin-flip");
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();

    // Go to homepage and check Recent tab
    await page.goto("/");
    const discovery = page.locator("section").filter({ has: page.locator("#quick-discovery-title") });
    const recentTab = discovery.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // First card in recent should be Coin Flip (most recent visit)
    const recentCards = discovery.locator('[class*="card"]').filter({ has: page.getByRole("heading") });
    const firstTitle = await recentCards.first().getByRole("heading").first().textContent();
    expect(firstTitle).toMatch(/coin flip/i);
  });

  test("clicking a Recent card opens the correct localized route", async ({ page }) => {
    await page.goto("/coin-flip");
    await expect(page.getByRole("heading", { name: /coin flip/i }).first()).toBeVisible();
    await page.goto("/");

    const discovery = page.locator("section").filter({ has: page.locator("#quick-discovery-title") });
    const recentTab = discovery.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // Click the Coin Flip card link within QuickDiscovery
    const cardLink = discovery.getByRole("link", { name: /coin flip/i }).first();
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
    // Visit a tool in Spanish locale, ensure it renders
    await page.goto("/es/coin-flip");
    await expect(page.getByRole("heading").first()).toBeVisible();

    // Go to Spanish homepage and check Recent tab
    await page.goto("/es");
    const discovery = page.locator("section").filter({ has: page.locator("#quick-discovery-title") });
    const recentTab = discovery.getByRole("tab", { name: /recent/i }).last();
    await recentTab.click();

    // Click the card within QuickDiscovery — should navigate to Spanish locale
    const cardLink = discovery.getByRole("link", { name: /coin flip/i }).first();
    await cardLink.click();
    await expect(page).toHaveURL(/\/es\/coin-flip/);
  });
});
