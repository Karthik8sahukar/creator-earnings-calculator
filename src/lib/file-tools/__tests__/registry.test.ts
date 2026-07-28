import { describe, it, expect } from "vitest";
import { PDF_TOOLS, getPdfToolBySlug, getRelatedPdfTools } from "../registry";

describe("PDF_TOOLS registry", () => {
  it("contains 11 tools", () => {
    expect(PDF_TOOLS).toHaveLength(11);
  });

  it("every tool has a unique slug", () => {
    const slugs = PDF_TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every tool has a unique href", () => {
    const hrefs = PDF_TOOLS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("every tool has non-empty title, description, longDescription", () => {
    for (const tool of PDF_TOOLS) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.longDescription.length).toBeGreaterThan(0);
    }
  });

  it("every tool has at least 1 FAQ item", () => {
    for (const tool of PDF_TOOLS) {
      expect(tool.faq.length).toBeGreaterThan(0);
      for (const item of tool.faq) {
        expect(item.q.trim().length).toBeGreaterThan(0);
        expect(item.a.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("every tool has at least 2 related tools", () => {
    for (const tool of PDF_TOOLS) {
      expect(tool.relatedTools.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("every related tool slug exists in the registry", () => {
    for (const tool of PDF_TOOLS) {
      for (const relSlug of tool.relatedTools) {
        expect(getPdfToolBySlug(relSlug)).toBeDefined();
      }
    }
  });

  it("every tool has keywords", () => {
    for (const tool of PDF_TOOLS) {
      expect(tool.keywords.length).toBeGreaterThan(0);
    }
  });

  it("every tool has valid validation rules", () => {
    for (const tool of PDF_TOOLS) {
      expect(tool.validation.acceptedTypes.length).toBeGreaterThan(0);
      expect(tool.validation.maxFileSize).toBeGreaterThan(0);
      expect(tool.validation.maxFiles).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("getPdfToolBySlug", () => {
  it("returns tool for valid slug", () => {
    const tool = getPdfToolBySlug("merge-pdf");
    expect(tool).toBeDefined();
    expect(tool!.title).toBe("Merge PDF");
  });

  it("returns undefined for invalid slug", () => {
    expect(getPdfToolBySlug("nonexistent")).toBeUndefined();
  });
});

describe("getRelatedPdfTools", () => {
  it("returns related tools for merge-pdf", () => {
    const related = getRelatedPdfTools("merge-pdf");
    expect(related.length).toBeGreaterThan(0);
    expect(related.every((t) => t.slug !== "merge-pdf")).toBe(true);
  });

  it("returns empty array for invalid slug", () => {
    expect(getRelatedPdfTools("invalid")).toEqual([]);
  });
});
