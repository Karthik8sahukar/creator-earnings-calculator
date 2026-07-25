/**
 * Regex execution utilities (JavaScript engine).
 */

export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

export interface RegexResult {
  matches: RegexMatch[];
  count: number;
  error?: string;
}

export type RegexFlag = "g" | "i" | "m" | "s" | "u" | "y";

/** Execute a regex pattern against text. */
export function executeRegex(
  pattern: string,
  text: string,
  flags: string,
): RegexResult {
  if (!pattern) return { matches: [], count: 0 };
  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid regex";
    return { matches: [], count: 0, error: msg };
  }

  const matches: RegexMatch[] = [];
  const maxMatches = 1000;

  if (flags.includes("g")) {
    let m: RegExpExecArray | null;
    let iterations = 0;
    while ((m = regex.exec(text)) !== null) {
      iterations++;
      if (iterations > maxMatches) break;
      // Prevent infinite loop on zero-length matches
      if (m[0].length === 0) {
        regex.lastIndex++;
        continue;
      }
      matches.push(toMatch(m));
    }
  } else {
    const m = regex.exec(text);
    if (m) matches.push(toMatch(m));
  }

  return { matches, count: matches.length };
}

function toMatch(m: RegExpExecArray): RegexMatch {
  return {
    match: m[0],
    index: m.index,
    groups: m.slice(1),
    namedGroups: m.groups ? { ...m.groups } : {},
  };
}

/** Apply replacement. */
export function applyReplace(
  pattern: string,
  text: string,
  flags: string,
  replacement: string,
): { result: string; error?: string } {
  try {
    const regex = new RegExp(pattern, flags);
    return { result: text.replace(regex, replacement) };
  } catch (e) {
    return { result: "", error: e instanceof Error ? e.message : "Error" };
  }
}

export const SAMPLE_PATTERN = "\\b[A-Z][a-z]+\\b";
export const SAMPLE_TEXT = "Hello World from JavaScript";
export const SAMPLE_FLAGS = "g";
