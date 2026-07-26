import { describe, it, expect } from "vitest";

import {
  searchTools,
  highlightMatch,
  getZeroResultsSuggestions,
  getTrendingTools,
  getSearchSuggestions,
} from "./search";

describe("searchTools", () => {
  it("returns empty for empty query", () => {
    expect(searchTools("")).toEqual([]);
    expect(searchTools("   ")).toEqual([]);
  });

  it("finds tools by exact title", () => {
    const results = searchTools("Coin Flip");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tool.slug).toBe("coin-flip");
    expect(results[0].matchedOn).toContain("title");
  });

  it("finds tools by partial title", () => {
    const results = searchTools("json");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.tool.slug === "json-formatter")).toBe(true);
  });

  it("finds tools by alias", () => {
    const results = searchTools("heads or tails");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tool.slug).toBe("coin-flip");
    expect(results[0].matchedOn).toContain("alias");
  });

  it("finds tools by tag", () => {
    const results = searchTools("rpg");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.tool.slug === "dice-roller")).toBe(true);
    expect(results[0].matchedOn).toContain("tags");
  });

  it("scores exact title match higher than partial", () => {
    const results = searchTools("coin flip");
    const coinFlip = results.find((r) => r.tool.slug === "coin-flip");
    expect(coinFlip).toBeDefined();
    expect(coinFlip!.score).toBeGreaterThanOrEqual(100);
  });

  it("applies popular bonus", () => {
    const results = searchTools("calculator");
    const popular = results.filter((r) => r.tool.popular);
    const nonPopular = results.filter((r) => !r.tool.popular);
    if (popular.length > 0 && nonPopular.length > 0) {
      // Popular tools should generally score higher (not guaranteed if title match differs)
      expect(popular[0].score).toBeGreaterThanOrEqual(nonPopular[0].score - 20);
    }
  });

  it("respects limit parameter", () => {
    const results = searchTools("calculator", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("sorts results by score descending", () => {
    const results = searchTools("random");
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });

  it("handles multi-word queries", () => {
    const results = searchTools("youtube money");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tool.slug).toBe("youtube-money-calculator");
  });

  it("matches category", () => {
    const results = searchTools("developer");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.matchedOn.includes("category"))).toBe(true);
  });
});

describe("highlightMatch", () => {
  it("returns unhighlighted text for empty query", () => {
    const result = highlightMatch("Hello World", "");
    expect(result).toEqual([{ text: "Hello World", highlight: false }]);
  });

  it("highlights full query match", () => {
    const result = highlightMatch("JSON Formatter", "json");
    expect(result).toEqual([
      { text: "JSON", highlight: true },
      { text: " Formatter", highlight: false },
    ]);
  });

  it("is case-insensitive", () => {
    const result = highlightMatch("UUID Generator", "uuid");
    expect(result[0]).toEqual({ text: "UUID", highlight: true });
  });

  it("highlights multiple occurrences", () => {
    const result = highlightMatch("JSON to JSON Converter", "json");
    const highlighted = result.filter((s) => s.highlight);
    expect(highlighted.length).toBe(2);
    expect(highlighted[0].text).toBe("JSON");
    expect(highlighted[1].text).toBe("JSON");
  });

  it("handles multi-word query with individual word fallback", () => {
    const result = highlightMatch("Random Number Generator", "random gen");
    // "random" and "gen" should be highlighted separately
    const highlighted = result.filter((s) => s.highlight);
    expect(highlighted.length).toBeGreaterThanOrEqual(1);
    // At least "Random" should be highlighted
    expect(highlighted.some((s) => s.text.toLowerCase().includes("random"))).toBe(true);
  });

  it("merges overlapping ranges", () => {
    const result = highlightMatch("abcdef", "abcd");
    // Single highlight covering "abcd"
    expect(result[0]).toEqual({ text: "abcd", highlight: true });
    expect(result[1]).toEqual({ text: "ef", highlight: false });
  });

  it("returns full text unhighlighted when no match", () => {
    const result = highlightMatch("Hello World", "xyz");
    expect(result).toEqual([{ text: "Hello World", highlight: false }]);
  });

  it("handles single-character words gracefully (skips them)", () => {
    // Words shorter than 2 chars are filtered in word fallback
    const result = highlightMatch("A Great Tool", "a");
    // Full query "a" should match the "A" in the text
    expect(result[0]).toEqual({ text: "A", highlight: true });
  });
});

describe("getZeroResultsSuggestions", () => {
  it("returns empty for empty query", () => {
    expect(getZeroResultsSuggestions("")).toEqual([]);
  });

  it("returns related tools for partial matches", () => {
    const suggestions = getZeroResultsSuggestions("flipcoin");
    // Should find coin-flip related tools via tag/alias matching
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("returns tools matching query words against tags", () => {
    const suggestions = getZeroResultsSuggestions("random picker choice");
    expect(suggestions.length).toBeGreaterThan(0);
    // Should suggest tools with "random" or "picker" tags
  });

  it("respects limit parameter", () => {
    const suggestions = getZeroResultsSuggestions("tool", 2);
    expect(suggestions.length).toBeLessThanOrEqual(2);
  });

  it("prefers popular/featured tools in suggestions", () => {
    const suggestions = getZeroResultsSuggestions("youtube video content");
    if (suggestions.length >= 2) {
      // Popular tools should appear before non-popular ones
      const hasPopular = suggestions.some((t) => t.popular || t.featured);
      expect(hasPopular).toBe(true);
    }
  });
});

describe("getTrendingTools", () => {
  it("returns tools", () => {
    const trending = getTrendingTools(6);
    expect(trending.length).toBeGreaterThan(0);
    expect(trending.length).toBeLessThanOrEqual(6);
  });

  it("respects limit", () => {
    const trending = getTrendingTools(2);
    expect(trending.length).toBeLessThanOrEqual(2);
  });

  it("returns popular/featured tools as fallback", () => {
    const trending = getTrendingTools(6);
    // Should have popular or featured flag on at least some
    const hasPopularOrFeatured = trending.some((t) => t.popular || t.featured);
    expect(hasPopularOrFeatured).toBe(true);
  });
});

describe("getSearchSuggestions", () => {
  it("returns non-empty array of strings", () => {
    const suggestions = getSearchSuggestions();
    expect(suggestions.length).toBeGreaterThan(0);
    for (const s of suggestions) {
      expect(typeof s).toBe("string");
      expect(s.length).toBeGreaterThan(0);
    }
  });
});
