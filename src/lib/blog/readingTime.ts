/**
 * Compute reading time and word count for a markdown/MDX string.
 *
 * We deliberately avoid pulling in the `reading-time` npm package —
 * the computation is trivially small and this way we control both:
 *   - the words-per-minute constant (200 = mid-range adult reader for
 *     the kind of prose we publish; industry-standard 250 wpm feels
 *     too fast for finance-adjacent content readers actually engage with)
 *   - the stripping of MDX/JSX syntax so `<CalculatorCta ... />` tags
 *     don't inflate the count.
 */

const WORDS_PER_MINUTE = 200;

// A pragmatic-but-not-perfect stripper. Removes fenced code blocks,
// inline code, self-closing MDX tags, standard HTML tags, markdown
// syntax marks, and links/images down to their text. Perfect fidelity
// is not required — the reading time is a rounded-to-the-minute
// estimate.
const STRIPPERS: [RegExp, string][] = [
  [/```[\s\S]*?```/g, " "],           // fenced code
  [/`[^`\n]+`/g, " "],                 // inline code
  [/<[^>]+\/>/g, " "],                 // self-closing tags
  [/<[^>]+>/g, " "],                   // opening/closing tags
  [/!\[[^\]]*\]\([^)]+\)/g, " "],      // markdown images
  [/\[([^\]]+)\]\([^)]+\)/g, "$1"],    // markdown links → link text
  [/[#*_~`>]/g, " "],                  // markdown syntax chars
];

export interface ReadingTimeResult {
  minutes: number;
  words: number;
}

export function computeReadingTime(source: string): ReadingTimeResult {
  let text = source;
  for (const [re, replacement] of STRIPPERS) {
    text = text.replace(re, replacement);
  }
  // Split on any whitespace; filter empties introduced by the strippers.
  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 0 && /[a-zA-Z0-9]/.test(w));

  const wordCount = words.length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  return { minutes, words: wordCount };
}
