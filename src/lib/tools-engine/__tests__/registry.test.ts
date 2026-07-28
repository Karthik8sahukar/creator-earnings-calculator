import { describe, it, expect } from "vitest";
import { NEW_TOOLS_REGISTRY, getNewToolBySlug } from "../registry";

describe("NEW_TOOLS_REGISTRY integrity", () => {
  it("contains 13 tools", () => {
    expect(NEW_TOOLS_REGISTRY).toHaveLength(13);
  });

  it("every slug is unique", () => {
    const slugs = NEW_TOOLS_REGISTRY.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every href is unique", () => {
    const hrefs = NEW_TOOLS_REGISTRY.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("every tool has a valid category", () => {
    const validCategories = ["developer", "text", "pdf"];
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(validCategories).toContain(tool.category);
    }
  });

  it("every tool has non-empty title, description, longDescription", () => {
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(tool.title.length).toBeGreaterThan(0);
      expect(tool.description.length).toBeGreaterThan(0);
      expect(tool.longDescription.length).toBeGreaterThan(0);
    }
  });

  it("every tool has at least 1 FAQ", () => {
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(tool.faq.length).toBeGreaterThan(0);
      for (const item of tool.faq) {
        expect(item.q.trim().length).toBeGreaterThan(0);
        expect(item.a.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("every tool has keywords", () => {
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(tool.keywords.length).toBeGreaterThan(0);
    }
  });

  it("every tool has at least 2 related tools", () => {
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(tool.relatedTools.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("no href contains locale prefix", () => {
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(tool.href).not.toMatch(/\/(en|es|hi|pt|de|fr|ja)\//);
    }
  });

  it("every href starts with /", () => {
    for (const tool of NEW_TOOLS_REGISTRY) {
      expect(tool.href.startsWith("/")).toBe(true);
    }
  });
});

describe("getNewToolBySlug", () => {
  it("returns tool for valid slug", () => {
    const tool = getNewToolBySlug("html-formatter");
    expect(tool).toBeDefined();
    expect(tool!.title).toBe("HTML Formatter");
  });

  it("returns undefined for invalid slug", () => {
    expect(getNewToolBySlug("nonexistent-tool")).toBeUndefined();
  });
});
