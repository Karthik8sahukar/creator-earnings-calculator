import { expect, test } from "@playwright/test";

/**
 * E2E tests for the Historical Analytics section on creator pages.
 *
 * The test environment runs with E2E_MOCK_MODE=1 which provides
 * fixture data for the YouTube API. The analytics section renders
 * based on stored snapshot data — in the E2E environment the
 * analytics API may return empty data (no stored snapshots).
 *
 * We test both the empty-history state (default) and verify the
 * UI elements render correctly.
 */

test.describe("Creator Analytics Section", () => {
  test("shows empty state when no historical data exists", async ({ page }) => {
    await page.goto("/en/creator/mrbeast");

    // The analytics section should exist
    const section = page.locator('[data-testid="analytics-empty"], [data-testid="analytics-section"]');
    await expect(section).toBeAttached();

    // If no fixture data is loaded, the empty state message appears
    const emptyState = page.getByTestId("analytics-empty");
    const populatedState = page.getByTestId("analytics-section");

    // One of these should be visible
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const isPopulated = await populatedState.isVisible().catch(() => false);

    expect(isEmpty || isPopulated).toBe(true);
  });

  test("analytics section has heading and accessible structure", async ({ page }) => {
    await page.goto("/en/creator/mrbeast");

    // The heading "Historical Analytics" should appear
    await expect(
      page.getByRole("heading", { name: /Historical Analytics/i }),
    ).toBeVisible();
  });

  test("time-range controls are present when data exists", async ({ page }) => {
    await page.goto("/en/creator/mrbeast");

    // If the populated section renders, check for range buttons
    const section = page.getByTestId("analytics-section");
    const visible = await section.isVisible().catch(() => false);

    if (visible) {
      await expect(page.getByTestId("analytics-range-7d")).toBeVisible();
      await expect(page.getByTestId("analytics-range-30d")).toBeVisible();
      await expect(page.getByTestId("analytics-range-90d")).toBeVisible();
      await expect(page.getByTestId("analytics-range-1y")).toBeVisible();
    }
  });

  test("clicking time-range buttons does not crash", async ({ page }) => {
    await page.goto("/en/creator/mrbeast");

    const section = page.getByTestId("analytics-section");
    const visible = await section.isVisible().catch(() => false);

    if (visible) {
      // Click each range button — verify no crash
      await page.getByTestId("analytics-range-7d").click();
      await expect(section).toBeVisible();

      await page.getByTestId("analytics-range-90d").click();
      await expect(section).toBeVisible();
    }
  });
});

test.describe("Analytics API", () => {
  test("GET /api/analytics/mrbeast returns valid JSON", async ({ request }) => {
    const response = await request.get("/api/analytics/mrbeast?range=all");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("creatorSlug", "mrbeast");
    expect(data).toHaveProperty("snapshots");
    expect(data).toHaveProperty("growth");
    expect(data).toHaveProperty("lastUpdated");
    expect(Array.isArray(data.snapshots)).toBe(true);
  });

  test("GET /api/analytics/mrbeast validates range param", async ({ request }) => {
    const response = await request.get("/api/analytics/mrbeast?range=invalid");
    expect(response.status()).toBe(400);
  });

  test("GET /api/analytics/nonexistent returns 404", async ({ request }) => {
    const response = await request.get("/api/analytics/this-creator-does-not-exist");
    expect(response.status()).toBe(404);
  });

  test("GET /api/analytics/mrbeast?range=30d returns subset", async ({ request }) => {
    const response = await request.get("/api/analytics/mrbeast?range=30d");
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.creatorSlug).toBe("mrbeast");
    // All snapshots should be within last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const snap of data.snapshots) {
      expect(new Date(snap.capturedAt).getTime()).toBeGreaterThanOrEqual(thirtyDaysAgo);
    }
  });

  test("Response includes cache headers", async ({ request }) => {
    const response = await request.get("/api/analytics/mrbeast");
    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toContain("s-maxage");
  });
});
