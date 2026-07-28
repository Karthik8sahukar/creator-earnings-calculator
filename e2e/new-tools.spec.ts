import { expect, test } from "@playwright/test";

/**
 * E2E tests for the 13 new tools (8 developer + 5 text).
 *
 * Verifies each page loads, has the correct heading, and the
 * workspace components render correctly.
 */

const DEVELOPER_TOOLS = [
  { slug: "html-formatter", title: /html formatter/i },
  { slug: "xml-formatter", title: /xml formatter/i },
  { slug: "yaml-formatter", title: /yaml formatter/i },
  { slug: "jwt-generator", title: /jwt generator/i },
  { slug: "hash-generator", title: /hash generator/i },
  { slug: "qr-generator", title: /qr.*generator/i },
  { slug: "markdown-preview", title: /markdown preview/i },
  { slug: "diff-checker", title: /diff checker/i },
];

const TEXT_TOOLS = [
  { slug: "lorem-ipsum", title: /lorem ipsum/i },
  { slug: "case-converter", title: /case converter/i },
  { slug: "remove-duplicate-lines", title: /remove duplicate/i },
  { slug: "text-compare", title: /text compare/i },
  { slug: "slug-generator", title: /slug generator/i },
];

test.describe("Developer Tools", () => {
  for (const { slug, title } of DEVELOPER_TOOLS) {
    test(`/${slug} loads with heading and workspace`, async ({ page }) => {
      await page.goto(`/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      // CodeWorkspace renders input and output textareas
      await expect(page.locator("#code-input")).toBeVisible();
    });
  }

  test("HTML Formatter formats basic HTML", async ({ page }) => {
    await page.goto("/html-formatter");
    await page.locator("#code-input").fill("<div><p>Hello</p></div>");
    await page.getByRole("button", { name: /format/i }).click();
    const output = await page.locator("#code-output").inputValue();
    expect(output).toContain("<div>");
    expect(output).toContain("  <p>");
  });

  test("Hash Generator produces SHA-256", async ({ page }) => {
    await page.goto("/hash-generator");
    await page.locator("#code-input").fill("hello");
    await page.getByRole("button", { name: /generate/i }).click();
    // SHA-256 of "hello" starts with 2cf24dba
    await expect(page.locator("#code-output")).toContainText("2cf24dba");
  });
});

test.describe("Text Tools", () => {
  for (const { slug, title } of TEXT_TOOLS) {
    test(`/${slug} loads with heading`, async ({ page }) => {
      await page.goto(`/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    });
  }

  test("Case Converter auto-processes", async ({ page }) => {
    await page.goto("/case-converter");
    await page.locator("#text-input").fill("Hello World");
    // Auto-process should show output immediately
    await expect(page.locator("#text-output")).toContainText("HELLO WORLD");
    await expect(page.locator("#text-output")).toContainText("hello world");
    await expect(page.locator("#text-output")).toContainText("hello_world");
  });

  test("Slug Generator creates URL slug", async ({ page }) => {
    await page.goto("/slug-generator");
    await page.locator("#text-input").fill("Hello World! This is a Test");
    await expect(page.locator("#text-output")).toContainText("hello-world-this-is-a-test");
  });

  test("Remove Duplicate Lines works", async ({ page }) => {
    await page.goto("/remove-duplicate-lines");
    await page.locator("#text-input").fill("hello\nworld\nhello\ntest");
    await expect(page.locator("#text-output")).toHaveValue("hello\nworld\ntest");
  });
});
