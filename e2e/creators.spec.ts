import { expect, test } from "@playwright/test";

/**
 * E2E for the Creator Profile system.
 *
 * The Playwright config runs Next with `E2E_MOCK_MODE=1`, so the
 * YouTube resolver returns fixture channels for any handle lookup.
 * That means:
 *   - `/en/creators` renders the full catalog with no live API.
 *   - `/en/creator/mrbeast` resolves via `searchChannels("@MrBeast")`
 *     which returns the fixture channels — the page renders with
 *     the creator's catalog metadata plus fixture stats.
 *
 * We assert only on the parts that are stable regardless of what
 * fixture happens to be returned (breadcrumbs, hero name, earnings
 * heading, FAQ presence, JSON-LD embed).
 */

test.describe("Creators directory", () => {
  test("index page lists creators and supports search + filters", async ({
    page,
  }) => {
    await page.goto("/en/creators");
    await expect(
      page.getByRole("heading", { level: 1, name: /YouTube Creators/i }),
    ).toBeVisible();

    // Grid renders — at least MrBeast should be present since we
    // curate them into `CREATORS`.
    await expect(page.getByTestId("creator-card-mrbeast")).toBeVisible();
    await expect(page.getByTestId("creator-card-carryminati")).toBeVisible();

    // Search filters the grid.
    await page.getByTestId("creators-search").fill("carryminati");
    await expect(page.getByTestId("creator-card-carryminati")).toBeVisible();
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);

    // Clear search + filter by country = India.
    await page.getByTestId("creators-search").fill("");
    await page.getByTestId("creators-filter-country").selectOption("India");
    // A handful of India creators should be visible.
    await expect(page.getByTestId("creator-card-carryminati")).toBeVisible();
    await expect(page.getByTestId("creator-card-techburner")).toBeVisible();
    // A global-only creator should NOT be visible.
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);

    // Clear filters restores the full grid.
    await page.getByTestId("creators-clear-filters").click();
    await expect(page.getByTestId("creator-card-mrbeast")).toBeVisible();
  });

  test("directory emits BreadcrumbList + ItemList JSON-LD", async ({
    page,
  }) => {
    await page.goto("/en/creators");
    const script = page.getByTestId("creators-index-jsonld");
    await expect(script).toBeAttached();
    const raw = await script.textContent();
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    const types = Array.isArray(parsed)
      ? parsed.map((p) => p["@type"])
      : [parsed["@type"]];
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("ItemList");
  });
});

test.describe("Creator profile page", () => {
  test("renders the hero, earnings section, and JSON-LD for MrBeast", async ({
    page,
  }) => {
    await page.goto("/en/creator/mrbeast");

    // Hero shows the display name from the catalog.
    await expect(
      page.getByRole("heading", { level: 1, name: /MrBeast/i }),
    ).toBeVisible();

    // Earnings section renders (title includes creator name).
    await expect(
      page.getByRole("heading", { level: 2, name: /How much does MrBeast make/ }),
    ).toBeVisible();

    // Related calculators / related creators / FAQ all present.
    await expect(
      page.getByRole("heading", { level: 2, name: /Estimate this creator/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: /Similar creators/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: /Frequently asked questions/i,
      }),
    ).toBeVisible();

    // A JSON-LD block is embedded and includes at least one Person schema.
    const raw = await page.getByTestId("creator-jsonld").textContent();
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!);
    const types = Array.isArray(parsed)
      ? parsed.map((p) => p["@type"])
      : [parsed["@type"]];
    expect(types).toContain("BreadcrumbList");
    expect(types).toContain("Person");
    expect(types).toContain("Organization");
  });

  test("clicking a related creator card navigates to another profile", async ({
    page,
  }) => {
    await page.goto("/en/creator/mrbeast");
    // MrBeast's relatedCreators includes ishowspeed — pick that one.
    const link = page.getByTestId("related-creator-ishowspeed");
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/en\/creator\/ishowspeed$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /IShowSpeed/i }),
    ).toBeVisible();
  });

  test("unknown slug renders the creator-not-found page", async ({ page }) => {
    const response = await page.goto("/en/creator/no-such-creator-slug");
    // Next returns 404 for a page that calls notFound()
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: /Creator not found/i }),
    ).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("Creators link is present in header + footer + homepage strip", async ({
    page,
  }) => {
    await page.goto("/en");

    // Homepage strip.
    await expect(
      page.getByRole("heading", { level: 2, name: /Popular creators/i }),
    ).toBeVisible();
    await expect(
      page.getByTestId("popular-creators-view-all"),
    ).toBeVisible();

    // Header nav (desktop viewport).
    await expect(page.getByTestId("header-creators-link")).toBeVisible();

    // Footer.
    await expect(page.getByTestId("footer-creators-link")).toBeVisible();
  });

  test("'View all creators' link navigates to /en/creators", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.getByTestId("popular-creators-view-all").click();
    await expect(page).toHaveURL(/\/en\/creators$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /YouTube Creators/i }),
    ).toBeVisible();
  });
});
