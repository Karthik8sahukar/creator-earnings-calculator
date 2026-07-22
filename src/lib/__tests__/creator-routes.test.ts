/**
 * Route integrity tests for the creator profile system.
 *
 * Validates that ALL 200 creators can be resolved and would
 * generate valid pages without runtime errors.
 */

import { describe, expect, it } from "vitest";

import {
  type Creator,
  getCreatorBySlug,
  getCreatorCountryTier,
  getCreatorNiche,
  listCreators,
  resolveCountryCode,
  resolveNicheId,
} from "../creators";

const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

describe("creator route integrity — all 200 creators", () => {
  const creators = listCreators();

  it("returns exactly 200 creators", () => {
    expect(creators.length).toBe(200);
  });

  it("every slug is valid for URL routing", () => {
    for (const c of creators) {
      expect(c.slug.length).toBeGreaterThan(0);
      expect(c.slug).not.toContain(" ");
      expect(c.slug).not.toContain("/");
      expect(c.slug.trim()).toBe(c.slug);
      // Slugs should be lowercase with hyphens
      expect(c.slug).toMatch(SLUG_REGEX);
    }
  });

  it("every creator resolves via getCreatorBySlug", () => {
    for (const c of creators) {
      const resolved = getCreatorBySlug(c.slug);
      expect(resolved, `getCreatorBySlug("${c.slug}") returned undefined`).toBeDefined();
      expect(resolved!.slug).toBe(c.slug);
      expect(resolved!.displayName).toBe(c.displayName);
    }
  });

  it("every creator has required fields for page rendering", () => {
    for (const c of creators) {
      expect(c.displayName.length, `${c.slug} missing displayName`).toBeGreaterThan(0);
      expect(c.youtubeHandle.startsWith("@"), `${c.slug} handle must start with @`).toBe(true);
      expect(c.country.length, `${c.slug} missing country`).toBeGreaterThan(0);
      expect(c.category.length, `${c.slug} missing category`).toBeGreaterThan(0);
      expect(c.description.length, `${c.slug} missing description`).toBeGreaterThan(0);
      expect(Array.isArray(c.relatedCreators), `${c.slug} relatedCreators not array`).toBe(true);
    }
  });

  it("every creator's relatedCreators resolve to real slugs", () => {
    const allSlugs = new Set(creators.map((c: Creator) => c.slug));
    for (const c of creators) {
      for (const related of c.relatedCreators) {
        expect(allSlugs.has(related), `${c.slug} references unknown slug "${related}"`).toBe(true);
      }
    }
  });

  it("every creator has a valid countryCode that resolves to a tier", () => {
    for (const c of creators) {
      const code = resolveCountryCode(c);
      expect(code.length, `${c.slug} has empty countryCode`).toBeGreaterThan(0);
      const tier = getCreatorCountryTier(c);
      expect(tier.baseRpm, `${c.slug} tier has no baseRpm`).toBeGreaterThan(0);
    }
  });

  it("every creator has a valid niche that resolves", () => {
    for (const c of creators) {
      const nicheId = resolveNicheId(c);
      expect(nicheId.length, `${c.slug} has empty nicheId`).toBeGreaterThan(0);
      const niche = getCreatorNiche(c);
      expect(niche.rpmMultiplier, `${c.slug} niche has no rpmMultiplier`).toBeGreaterThan(0);
    }
  });

  it("channelId is either empty string or valid UC pattern", () => {
    const UC_REGEX = /^UC[A-Za-z0-9_-]{22}$/;
    for (const c of creators) {
      if (c.channelId) {
        expect(c.channelId, `${c.slug} has invalid channelId "${c.channelId}"`).toMatch(UC_REGEX);
      }
    }
  });

  it("no duplicate slugs exist", () => {
    const slugs = creators.map((c: Creator) => c.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it("no duplicate non-empty channelIds exist", () => {
    const ids = creators
      .map((c: Creator) => c.channelId)
      .filter((id) => id.length > 0);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("generateStaticParams would cover all 200 creators x 7 locales", () => {
    // Simulate what generateStaticParams does
    const locales = ["en", "hi", "es", "pt", "de", "fr", "ja"];
    const params: Array<{ locale: string; slug: string }> = [];
    for (const locale of locales) {
      for (const c of creators) {
        params.push({ locale, slug: c.slug });
      }
    }
    expect(params.length).toBe(200 * 7);
  });

  it("unverified creator (empty channelId) does not crash profile building", () => {
    // Find an unverified creator
    const unverified = creators.find((c: Creator) => !c.channelId);
    expect(unverified, "no unverified creators found").toBeDefined();
    // Basic field access should not throw
    expect(() => {
      const _name = unverified!.displayName;
      const _handle = unverified!.youtubeHandle;
      const _country = unverified!.country;
      const _category = unverified!.category;
      const _related = unverified!.relatedCreators;
      const _tier = getCreatorCountryTier(unverified!);
      const _niche = getCreatorNiche(unverified!);
    }).not.toThrow();
  });

  it("only unknown slugs should produce 404 (not missing channelId)", () => {
    // An unverified creator's slug should still resolve
    const unverified = creators.find((c: Creator) => !c.channelId);
    expect(unverified).toBeDefined();
    expect(getCreatorBySlug(unverified!.slug)).toBeDefined();

    // An unknown slug should NOT resolve
    expect(getCreatorBySlug("this-slug-does-not-exist-xyz")).toBeUndefined();
  });
});
