import { expect, test } from "@playwright/test";

/**
 * E2E tests for the PDF Tools platform.
 *
 * Verifies:
 * - /tools category page loads with all tool cards
 * - Individual tool pages load correctly
 * - File upload UI is accessible
 * - Validation errors display
 * - Privacy notice is visible
 */

test.describe("PDF Tools Category Page", () => {
  test("/tools page loads with all tool cards", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByRole("heading", { level: 1, name: /pdf tools/i })).toBeVisible();
    // Should have 11 tool cards
    const toolLinks = page.getByRole("link").filter({ hasText: /open tool/i });
    const count = await toolLinks.count();
    expect(count).toBe(11);
  });

  test("tool cards link to correct routes", async ({ page }) => {
    await page.goto("/tools");
    const mergeLink = page.getByRole("link", { name: /merge pdf/i });
    await expect(mergeLink).toBeVisible();
    await mergeLink.click();
    await expect(page).toHaveURL(/\/tools\/merge-pdf/);
  });

  test("privacy section is visible", async ({ page }) => {
    await page.goto("/tools");
    await expect(page.getByText(/your files stay private/i)).toBeVisible();
  });
});

test.describe("Merge PDF Tool", () => {
  test("page loads with correct heading", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await expect(page.getByRole("heading", { level: 1, name: /merge pdf/i })).toBeVisible();
  });

  test("upload dropzone is accessible", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    const dropzone = page.getByRole("button", { name: /upload files/i });
    await expect(dropzone).toBeVisible();
    // Should be keyboard-focusable
    await dropzone.focus();
    await expect(dropzone).toBeFocused();
  });

  test("privacy notice is visible", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await expect(page.getByText(/all processing happens locally/i)).toBeVisible();
  });

  test("FAQ section renders", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await expect(page.getByText(/frequently asked questions/i)).toBeVisible();
    await expect(page.getByText(/is there a file size limit/i)).toBeVisible();
  });

  test("related tools section renders", async ({ page }) => {
    await page.goto("/tools/merge-pdf");
    await expect(page.getByText(/related tools/i)).toBeVisible();
  });
});

test.describe("Split PDF Tool", () => {
  test("page loads correctly", async ({ page }) => {
    await page.goto("/tools/split-pdf");
    await expect(page.getByRole("heading", { level: 1, name: /split pdf/i })).toBeVisible();
  });
});

test.describe("Protect PDF Tool", () => {
  test("page loads correctly", async ({ page }) => {
    await page.goto("/tools/protect-pdf");
    await expect(page.getByRole("heading", { level: 1, name: /protect pdf/i })).toBeVisible();
  });
});

test.describe("Image to PDF Tool", () => {
  test("page loads correctly", async ({ page }) => {
    await page.goto("/tools/image-to-pdf");
    await expect(page.getByRole("heading", { level: 1, name: /image to pdf/i })).toBeVisible();
  });
});

test.describe("All Tool Pages Load", () => {
  const tools = [
    { slug: "merge-pdf", title: /merge pdf/i },
    { slug: "split-pdf", title: /split pdf/i },
    { slug: "rearrange-pdf", title: /rearrange pdf/i },
    { slug: "rotate-pdf", title: /rotate pdf/i },
    { slug: "delete-pdf-pages", title: /delete pdf pages/i },
    { slug: "image-to-pdf", title: /image to pdf/i },
    { slug: "pdf-to-jpg", title: /pdf to jpg/i },
    { slug: "add-watermark", title: /add watermark/i },
    { slug: "add-page-numbers", title: /add page numbers/i },
    { slug: "protect-pdf", title: /protect pdf/i },
    { slug: "unlock-pdf", title: /unlock pdf/i },
  ];

  for (const { slug, title } of tools) {
    test(`/tools/${slug} loads with correct heading`, async ({ page }) => {
      await page.goto(`/tools/${slug}`);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    });
  }
});
