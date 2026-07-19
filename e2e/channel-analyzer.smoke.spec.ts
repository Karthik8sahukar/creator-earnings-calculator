import { expect, test } from "@playwright/test";

/**
 * Smoke tests for the Channel Analyzer.
 *
 * These run against `next dev` booted with `E2E_MOCK_MODE=1`, so the
 * YouTube service returns the fixture data from
 * `src/lib/e2eFixtures.ts` — no live API key required.
 *
 * We only assert:
 *   • the page renders with the hero + input
 *   • an empty state is shown before submission
 *   • submitting a known @handle populates the results section
 *   • the AI-summary placeholder renders (contract for future wiring)
 *   • the related-tools section renders
 *
 * All numeric math is covered by unit tests in
 * `src/lib/channelAnalyzer/__tests__/*`.
 */

test("renders the hero and empty state", async ({ page }) => {
  await page.goto("/tools/channel-analyzer");
  await expect(
    page.getByRole("heading", { name: /analyze any youtube channel/i }),
  ).toBeVisible();
  // Empty-state card is visible until the user submits.
  await expect(page.getByText(/paste a youtube channel/i)).toBeVisible();
  // Input + submit button are both reachable.
  await expect(page.getByTestId("channel-analyzer-input")).toBeVisible();
  await expect(page.getByTestId("channel-analyzer-submit")).toBeVisible();
});

test("submitting a channel handle produces a result card", async ({ page }) => {
  await page.goto("/tools/channel-analyzer");
  await page
    .getByPlaceholder(/youtube\.com\/@MrBeast/i)
    .fill("@MrBeast");
  await page.getByTestId("channel-analyzer-submit").click();

  // A results section — heading of the performance grid.
  await expect(
    page.getByRole("heading", {
      name: /performance & earnings snapshot/i,
    }),
  ).toBeVisible({ timeout: 15_000 });

  // A currency amount somewhere in the tiles.
  await expect(page.getByText(/\$\d/).first()).toBeVisible();

  // AI Summary placeholder present + labelled "Coming soon".
  await expect(
    page.getByRole("heading", { name: /ai insights/i }),
  ).toBeVisible();
  await expect(page.getByText(/coming soon/i).first()).toBeVisible();
});

test("related tools section links to the other calculators", async ({
  page,
}) => {
  await page.goto("/tools/channel-analyzer");
  await expect(
    page.getByRole("heading", { name: /related free tools/i }),
  ).toBeVisible();
  // Sanity: at least the RPM calculator is linked.
  await expect(
    page.getByRole("link", { name: /RPM Calculator/i }).first(),
  ).toBeVisible();
});
