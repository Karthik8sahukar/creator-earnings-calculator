import { describe, expect, it } from "vitest";

import { computeReadingTime } from "../readingTime";

/**
 * The reading-time computation is not a place we want surprises. Any
 * change to the words-per-minute constant, the strippers, or the
 * denominator lands directly under every article's `min read` label.
 */
describe("computeReadingTime", () => {
  it("returns at least one minute for very short content", () => {
    const { minutes, words } = computeReadingTime("A single sentence.");
    expect(minutes).toBe(1);
    expect(words).toBe(3);
  });

  it("scales linearly at 200 words per minute", () => {
    const source = Array.from({ length: 600 }, () => "word").join(" ");
    const { minutes, words } = computeReadingTime(source);
    expect(words).toBe(600);
    // 600 words / 200 wpm = 3 minutes.
    expect(minutes).toBe(3);
  });

  it("rounds up on partial minutes", () => {
    // 210 words at 200 wpm should round up to 2 minutes.
    const source = Array.from({ length: 210 }, () => "word").join(" ");
    const { minutes } = computeReadingTime(source);
    expect(minutes).toBe(2);
  });

  it("strips fenced code blocks so code doesn't inflate word count", () => {
    const source = [
      "Real prose here — five words worth.",
      "```",
      Array.from({ length: 500 }, () => "code").join(" "),
      "```",
    ].join("\n");
    const { words } = computeReadingTime(source);
    // The 500 code words should be excluded.
    expect(words).toBeLessThan(20);
  });

  it("strips MDX/JSX tags cleanly", () => {
    const source = [
      "One two three four five.",
      "<CalculatorCta to=\"rpm\" heading=\"heading here\" body=\"body here\" />",
      "<Callout type=\"note\">short callout body content here</Callout>",
    ].join("\n");
    const { words } = computeReadingTime(source);
    // We keep prose + the callout body (which is prose inside a JSX
    // wrapper). Self-closing JSX props DON'T survive the stripper.
    expect(words).toBeGreaterThan(5);
    expect(words).toBeLessThan(20);
  });

  it("preserves markdown link text but drops the URL", () => {
    const source = "See the [RPM Calculator](/youtube-rpm-calculator) for details.";
    const { words } = computeReadingTime(source);
    // "See the RPM Calculator for details." = 6 words.
    expect(words).toBe(6);
  });
});
