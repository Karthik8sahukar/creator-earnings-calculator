/**
 * Shared text statistics engine for Character Counter and Word Counter tools.
 * Pure functions — no side effects, safe for client-side use.
 */

export interface TextStatistics {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  uniqueWords: number;
  sentences: number;
  paragraphs: number;
  lines: number;
  whitespaceCount: number;
  readingTimeMinutes: number;
  speakingTimeMinutes: number;
  averageWordLength: number;
  longestWord: string;
  averageSentenceLength: number;
  averageParagraphLength: number;
  estimatedPages: number;
  estimatedA4Pages: number;
  keywordDensity: KeywordEntry[];
  mostFrequentWords: FrequencyEntry[];
}

export interface KeywordEntry {
  word: string;
  count: number;
  density: number;
}

export interface FrequencyEntry {
  word: string;
  count: number;
}

/** Average reading speed in words per minute. */
const READING_WPM = 238;
/** Average speaking speed in words per minute. */
const SPEAKING_WPM = 150;
/** Words per standard page (double-spaced, 12pt). */
const WORDS_PER_PAGE = 250;
/** Words per A4 page (single-spaced, 12pt). */
const WORDS_PER_A4 = 500;

/**
 * Compute comprehensive text statistics from raw input.
 */
export function computeTextStats(text: string): TextStatistics {
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, "").length;

  // Words: split on whitespace, filter empties
  const wordList = text.split(/\s+/).filter((w) => w.length > 0);
  const words = wordList.length;

  // Unique words (case-insensitive)
  const lowerWords = wordList.map((w) => w.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F'-]/g, "")).filter((w) => w.length > 0);
  const uniqueWords = new Set(lowerWords).size;

  // Sentences: split on sentence-ending punctuation
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  // Paragraphs: blocks separated by one or more blank lines
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length || (text.trim().length > 0 ? 1 : 0);

  // Lines
  const lines = text === "" ? 0 : text.split("\n").length;

  // Whitespace count
  const whitespaceCount = (text.match(/\s/g) || []).length;

  // Reading & speaking time
  const readingTimeMinutes = words > 0 ? words / READING_WPM : 0;
  const speakingTimeMinutes = words > 0 ? words / SPEAKING_WPM : 0;

  // Average word length
  const totalCharsInWords = wordList.reduce((sum, w) => sum + w.replace(/[^a-zA-Z0-9\u00C0-\u024F]/g, "").length, 0);
  const averageWordLength = words > 0 ? totalCharsInWords / words : 0;

  // Longest word
  const longestWord = wordList.reduce((longest, w) => {
    const cleaned = w.replace(/[^a-zA-Z0-9\u00C0-\u024F'-]/g, "");
    return cleaned.length > longest.length ? cleaned : longest;
  }, "");

  // Average sentence length
  const averageSentenceLength = sentences > 0 ? words / sentences : 0;

  // Average paragraph length (words per paragraph)
  const averageParagraphLength = paragraphs > 0 ? words / paragraphs : 0;

  // Estimated pages
  const estimatedPages = words > 0 ? words / WORDS_PER_PAGE : 0;
  const estimatedA4Pages = words > 0 ? words / WORDS_PER_A4 : 0;

  // Keyword density (top 10)
  const freq = new Map<string, number>();
  for (const w of lowerWords) {
    if (w.length < 2) continue;
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  const sortedFreq = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  const keywordDensity: KeywordEntry[] = sortedFreq.slice(0, 10).map(([word, count]) => ({
    word,
    count,
    density: words > 0 ? (count / words) * 100 : 0,
  }));

  const mostFrequentWords: FrequencyEntry[] = sortedFreq.slice(0, 20).map(([word, count]) => ({
    word,
    count,
  }));

  return {
    characters,
    charactersNoSpaces,
    words,
    uniqueWords,
    sentences,
    paragraphs,
    lines,
    whitespaceCount,
    readingTimeMinutes,
    speakingTimeMinutes,
    averageWordLength,
    longestWord,
    averageSentenceLength,
    averageParagraphLength,
    estimatedPages,
    estimatedA4Pages,
    keywordDensity,
    mostFrequentWords,
  };
}

/**
 * Format time in minutes to a human-readable string.
 */
export function formatTime(minutes: number): string {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return seconds <= 0 ? "0 sec" : `${seconds} sec`;
  }
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}
