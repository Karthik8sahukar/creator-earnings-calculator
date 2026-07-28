import { expect, test } from "@playwright/test";

/**
 * E2E for the Creator Profile system.
 *
 * The Playwright config runs Next with `E2E_MOCK_MODE=1`, so the
 * YouTube resolver returns fixture channels for any handle lookup.
 * That means:
 *   - `/creators` renders the full catalog with no live API.
 *   - `/creator/mrbeast` resolves via `searchChannels("@MrBeast")`
 *     which returns the fixture channels — the page renders with
 *     the creator's catalog metadata plus fixture stats.
 *
 * We assert only on the parts that are stable regardless of what
 * fixture happens to be returned (breadcrumbs, hero name, earnings
 * heading, FAQ presence, JSON-LD embed).
 */

test.describe("Creators directory", () => {
  test("index page loads and displays creator cards", async ({ page }) => {
    await page.goto("/creators");
    await expect(
      page.getByRole("heading", { level: 1, name: /YouTube Creators/i }),
    ).toBeVisible();

    // Grid renders — MrBeast should be present (verified curated creator).
    await expect(page.getByTestId("creator-card-mrbeast")).toBeVisible();
  });

  test("search filters the creator grid", async ({ page }) => {
    await page.goto("/creators");

    // Search for a specific creator.
    await page.getByTestId("creators-search").fill("markiplier");
    // Wait for the search to take effect (debounced URL navigation).
    await expect(page.getByTestId("creator-card-markiplier")).toBeVisible();
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);
  });

  test("country filter shows only creators from that country", async ({
    page,
  }) => {
    // Visit with a clean slate — no search state.
    await page.goto("/creators");

    // Apply country = Japan via the filter select.
    await page.getByTestId("creators-filter-country").selectOption("Japan");

    // Wait for a Japan creator to appear — confirms navigation completed.
    await expect(page.getByTestId("creator-card-hikakintv")).toBeVisible();
    // A non-Japan creator should NOT be visible.
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);
  });

  test("clear filters restores the full grid", async ({ page }) => {
    // Start with a filter active.
    await page.goto("/creators?country=Japan");
    await expect(page.getByTestId("creator-card-hikakintv")).toBeVisible();
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);

    // Clear all filters.
    await page.getByTestId("creators-clear-filters").click();

    // Full grid restores — MrBeast returns.
    await expect(page.getByTestId("creator-card-mrbeast")).toBeVisible();
  });

  test("search then filter independently without interference", async ({
    page,
  }) => {
    await page.goto("/creators");

    // First: search for Markiplier specifically.
    await page.getByTestId("creators-search").fill("Markiplier");
    await expect(page.getByTestId("creator-card-markiplier")).toBeVisible();

    // Clear search by emptying the input and pressing Enter for
    // immediate sync (avoids debounce timing).
    await page.getByTestId("creators-search").fill("");
    await page.getByTestId("creators-search").press("Enter");
    // Wait for full grid to reload.
    await expect(page.getByTestId("creator-card-mrbeast")).toBeVisible();

    // Now apply Japan filter on the clean slate.
    await page.getByTestId("creators-filter-country").selectOption("Japan");
    await expect(page.getByTestId("creator-card-hikakintv")).toBeVisible();
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);
  });

  test("directory emits BreadcrumbList + ItemList JSON-LD", async ({
    page,
  }) => {
    await page.goto("/creators");
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
    await page.goto("/creator/mrbeast");

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
    await page.goto("/creator/mrbeast");
    // MrBeast's relatedCreators includes ishowspeed — pick that one.
    const link = page.getByTestId("related-creator-ishowspeed");
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/creator\/ishowspeed$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /IShowSpeed/i }),
    ).toBeVisible();
  });

  test("unknown slug returns HTTP 404", async ({ page }) => {
    const response = await page.goto("/creator/no-such-creator-slug");
    expect(response?.status()).toBe(404);

    // The 404 page shows either the Next.js built-in "404" heading
    // or our custom not-found page with "Page not found".
    // Either way, a recovery link back to the homepage should exist.
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    expect(headingText).toMatch(/404|not found/i);

    // A link to navigate away should be present
    await expect(page.getByRole("link", { name: /home|back/i })).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("Creators is accessible from header dropdown and footer link", async ({
    page,
  }) => {
    await page.goto("/");

    // Header nav (desktop) — Creators is a dropdown button in the new navigation.
    await expect(
      page.getByRole("button", { name: /^Creators$/i }),
    ).toBeVisible();

    // Footer still has a direct link to /creators.
    await expect(page.getByTestId("footer-creators-link")).toBeVisible();
  });

  test("Creators dropdown navigates to /creators", async ({
    page,
  }) => {
    await page.goto("/");

    // Open Creators dropdown
    await page.getByRole("button", { name: /^Creators$/i }).click();

    // Click "Browse Creators" link in the dropdown
    await page.getByRole("link", { name: /Browse Creators/i }).click();

    await expect(page).toHaveURL(/\/creators$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /YouTube Creators/i }),
    ).toBeVisible();
  });
});
