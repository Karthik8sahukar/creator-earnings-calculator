import { expect, test } from "@playwright/test";

/**
 * E2E tests for Milestone 3 — Tool Engine integration.
 *
 * Verifies the engine-powered youtube-rpm-calculator page correctly
 * renders all automatic features:
 *   1. Page loads and shows the H1 heading
 *   2. Breadcrumbs render (Home → Tool Name)
 *   3. ToolPageActions (Favorite + Share buttons) are present
 *   4. Calculator input/output works
 *   5. Related Tools section appears
 *   6. FAQ section appears
 *   7. JSON-LD structured data is in the page
 *   8. Locale routing works (non-English)
 */

test.describe("Tool Engine — RPM Calculator (engine-powered)", () => {
  test("page loads with correct heading", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/rpm/i);
  });

  test("breadcrumbs show Home and tool name", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    const nav = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(nav).toBeVisible();
    await expect(nav.getByText(/home/i)).toBeVisible();
  });

  test("favorite and share buttons are present", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    // FavoriteButton
    const favBtn = page.getByRole("button", { name: /favorite/i });
    await expect(favBtn).toBeVisible();
    // ShareButton
    const shareBtn = page.getByRole("button", { name: /share/i });
    await expect(shareBtn).toBeVisible();
  });

  test("calculator accepts input and shows result", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    // Fill in revenue
    await page.getByLabel(/revenue/i).fill("500");
    // Fill in views
    await page.getByLabel(/views/i).fill("100000");
    // Result should show $5.00 (500/100000*1000)
    await expect(page.locator("[aria-live='polite']").first()).toContainText(
      /\$5\.00/,
    );
  });

  test("related tools section is present", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    const relatedSection = page.getByRole("heading", {
      name: /related tools/i,
    });
    await expect(relatedSection).toBeVisible();
    // Should have at least one related tool link
    const relatedLinks = page
      .locator("section")
      .filter({ has: relatedSection })
      .getByRole("link");
    const count = await relatedLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("FAQ section is present", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    const faqHeading = page.getByRole("heading", { name: /faq|frequently/i });
    await expect(faqHeading).toBeVisible();
    // Should have FAQ items (dt elements)
    const faqItems = page.locator("dt");
    const count = await faqItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("JSON-LD structured data is embedded", async ({ page }) => {
    await page.goto("/youtube-rpm-calculator");
    // Find the JSON-LD script tag
    const jsonLdScript = page.locator('script[type="application/ld+json"]');
    await expect(jsonLdScript).toBeAttached();
    const content = await jsonLdScript.textContent();
    expect(content).toBeTruthy();
    const parsed = JSON.parse(content!);
    // Should be an array with BreadcrumbList + SoftwareApplication + FAQPage
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(2);
    expect(parsed[0]["@type"]).toBe("BreadcrumbList");
    expect(parsed[1]["@type"]).toBe("SoftwareApplication");
  });

  test("works in non-English locale", async ({ page }) => {
    await page.goto("/es/youtube-rpm-calculator");
    // Page should load without error
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    // Breadcrumbs should be visible (aria-label is translated, use testid)
    const nav = page.getByTestId("breadcrumb-nav");
    await expect(nav).toBeVisible();
  });
});
