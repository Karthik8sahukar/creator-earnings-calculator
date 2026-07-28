import { expect, test } from "@playwright/test";

/**
 * Wave 1 Developer Tools — Playwright smoke tests.
 */

test.describe("JSON Formatter", () => {
  test("formats JSON and shows output", async ({ page }) => {
    await page.goto("/json-formatter");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const input = page.locator("#json-input");
    await input.fill('{"b":2,"a":1}');
    await page.getByRole("button", { name: /beautify/i }).click();
    await expect(page.getByText(/"a": 1/)).toBeVisible();
  });

  test("copies formatted output", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/json-formatter");
    await page.locator("#json-input").fill('{"x":1}');
    await page.getByRole("button", { name: /beautify/i }).click();
    await page.getByRole("button", { name: /copy/i }).first().click();
    // Clipboard should have formatted JSON
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    expect(clip).toContain('"x"');
  });
});

test.describe("JSON Validator", () => {
  test("accepts valid JSON", async ({ page }) => {
    await page.goto("/json-validator");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const input = page.locator("#json-validate-input");
    await input.fill('{"valid": true}');
    await expect(page.getByText(/valid json/i)).toBeVisible();
  });

  test("rejects invalid JSON", async ({ page }) => {
    await page.goto("/json-validator");
    const input = page.locator("#json-validate-input");
    await input.fill("{invalid}");
    await expect(page.getByText(/invalid json/i)).toBeVisible();
  });
});

test.describe("JSON Minifier", () => {
  test("minifies and reports size", async ({ page }) => {
    await page.goto("/json-minifier");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const input = page.locator("#minify-input");
    await input.fill('{\n  "hello": "world"\n}');
    await page.getByRole("button", { name: /minify/i }).click();
    // Should show minified output
    await expect(page.getByText(/{"hello":"world"}/)).toBeVisible();
    // Should show size stats
    await expect(page.getByText(/saved/i)).toBeVisible();
  });
});

test.describe("Base64 Encoder/Decoder", () => {
  test("encodes and decodes Unicode", async ({ page }) => {
    await page.goto("/base64-encoder-decoder");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Encode
    const input = page.locator("#b64-input");
    await input.fill("Hello 🌍");
    await page.getByRole("button", { name: /^encode$/i }).click();
    await expect(page.locator("pre")).toBeVisible();
    const encoded = await page.locator("pre").textContent();
    expect(encoded!.trim().length).toBeGreaterThan(0);

    // Swap and decode
    await page.getByRole("button", { name: /swap/i }).click();
    await page.getByRole("button", { name: /^decode$/i }).click();
    await expect(page.getByText("Hello 🌍")).toBeVisible();
  });
});

test.describe("UUID Generator", () => {
  test("generates requested quantity", async ({ page }) => {
    await page.goto("/uuid-generator");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator("#uuid-qty").fill("3");
    await page.getByRole("button", { name: /generate/i }).first().click();
    // Should show 3 UUIDs
    const items = page.locator("li code");
    await expect(items).toHaveCount(3);
    // Each should be a valid UUID v4 format
    const first = await items.first().textContent();
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});

test.describe("Tool Engine Integration", () => {
  test("favorite works on a wave 1 tool", async ({ page }) => {
    await page.goto("/uuid-generator");
    const favBtn = page.getByRole("button", { name: /favorite/i });
    await expect(favBtn).toBeVisible();
    await favBtn.click();
    await expect(favBtn).toHaveAttribute("aria-pressed", "true");
  });

  test("share button renders", async ({ page }) => {
    await page.goto("/json-validator");
    const shareBtn = page.getByRole("button", { name: /share/i });
    await expect(shareBtn).toBeVisible();
  });

  test("related tools render", async ({ page }) => {
    await page.goto("/json-formatter");
    await expect(page.getByRole("heading", { name: /related tools/i })).toBeVisible();
  });

  test("FAQ renders when supplied", async ({ page }) => {
    await page.goto("/json-formatter");
    await expect(page.getByRole("heading", { name: /faq|frequently/i })).toBeVisible();
  });

  test("JSON-LD parses successfully", async ({ page }) => {
    await page.goto("/json-validator");
    const script = page.locator('script[type="application/ld+json"]');
    await expect(script).toBeAttached();
    const raw = await script.textContent();
    const data = JSON.parse(raw!);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]["@type"]).toBe("BreadcrumbList");
  });

  test("page loads correctly", async ({ page }) => {
    await page.goto("/uuid-generator");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/\/uuid-generator/);
  });

  test("keyboard nav on UUID generator", async ({ page }) => {
    await page.goto("/uuid-generator");
    // Tab to quantity input
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    // Tab to Generate button and press Enter
    const genBtn = page.getByRole("button", { name: /generate/i }).first();
    await genBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("li code").first()).toBeVisible();
  });
});
