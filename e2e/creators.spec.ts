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
  test("index page loads and displays creator cards", async ({ page }) => {
    await page.goto("/en/creators");
    await expect(
      page.getByRole("heading", { level: 1, name: /YouTube Creators/i }),
    ).toBeVisible();

    // Grid renders — MrBeast should be present (verified curated creator).
    await expect(page.getByTestId("creator-card-mrbeast")).toBeVisible();
  });

  test("search filters the creator grid", async ({ page }) => {
    await page.goto("/en/creators");

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
    await page.goto("/en/creators");

    // Apply country = Japan via the filter select.
    await page.getByTestId("creators-filter-country").selectOption("Japan");

    // Wait for a Japan creator to appear — confirms navigation completed.
    await expect(page.getByTestId("creator-card-hikakintv")).toBeVisible();
    // A non-Japan creator should NOT be visible.
    await expect(page.getByTestId("creator-card-mrbeast")).toHaveCount(0);
  });

  test("clear filters restores the full grid", async ({ page }) => {
    // Start with a filter active.
    await page.goto("/en/creators?country=Japan");
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
    await page.goto("/en/creators");

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

  test("unknown slug returns HTTP 404", async ({ page }) => {
    const response = await page.goto("/en/creator/no-such-creator-slug");
    // `dynamicParams = false` on `[locale]/creator/[slug]` limits the
    // route to the catalog in `src/lib/creators.ts`. Any slug outside
    // that set is rejected by the router before the page component
    // runs, so the response is stamped with a real HTTP 404 status.
    expect(response?.status()).toBe(404);

    // For dynamic-segment rejections triggered by `dynamicParams =
    // false`, Next.js renders its built-in not-found page rather than
    // walking to a `not-found.tsx` under `[locale]/`. The trace for
    // this test confirms that behavior in this app, so we assert on
    // that built-in UI verbatim (an h1 with "404" and an h2 with
    // "This page could not be found.").
    await expect(
      page.getByRole("heading", { level: 1, name: "404" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: /This page could not be found/i,
      }),
    ).toBeVisible();
  });
});

test.describe("Navigation", () => {
  test("Creators link is present in header, footer, and homepage trending section", async ({
    page,
  }) => {
    await page.goto("/en");

    // Homepage Trending Creators section has a link to /creators.
    await expect(
      page.getByTestId("creators-directory-link"),
    ).toBeVisible();

    // Header nav (desktop viewport).
    await expect(page.getByTestId("header-creators-link")).toBeVisible();

    // Footer.
    await expect(page.getByTestId("footer-creators-link")).toBeVisible();
  });

  test("Creators directory link navigates to /en/creators", async ({
    page,
  }) => {
    await page.goto("/en");
    await page.getByTestId("creators-directory-link").click();
    await expect(page).toHaveURL(/\/en\/creators$/);
    await expect(
      page.getByRole("heading", { level: 1, name: /YouTube Creators/i }),
    ).toBeVisible();
  });
});
