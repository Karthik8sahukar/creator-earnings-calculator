/**
 * JSON formatting and validation utilities.
 */

export type IndentType = "2" | "4" | "tab";

export interface JsonStats {
  objects: number;
  arrays: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  keys: number;
}

/** Format (beautify) JSON with given indentation. */
export function formatJson(input: string, indent: IndentType = "2", sortKeys = false): string {
  const parsed = JSON.parse(input);
  const indentValue = indent === "tab" ? "\t" : Number(indent);
  if (sortKeys) {
    return JSON.stringify(sortObject(parsed), null, indentValue);
  }
  return JSON.stringify(parsed, null, indentValue);
}

/** Minify JSON. */
export function minifyJson(input: string): string {
  return JSON.stringify(JSON.parse(input));
}

/** Validate JSON and return error info. */
export function validateJson(input: string): { valid: boolean; error?: string; line?: number; column?: number } {
  try {
    JSON.parse(input);
    return { valid: true };
  } catch (e) {
    const msg = e instanceof SyntaxError ? e.message : "Invalid JSON";
    const match = msg.match(/position (\d+)/);
    if (match) {
      const pos = parseInt(match[1], 10);
      const lines = input.slice(0, pos).split("\n");
      return { valid: false, error: msg, line: lines.length, column: lines[lines.length - 1].length + 1 };
    }
    return { valid: false, error: msg };
  }
}

/** Count JSON entities. */
export function countJsonStats(input: string): JsonStats {
  const stats: JsonStats = { objects: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0, nulls: 0, keys: 0 };
  try {
    const parsed = JSON.parse(input);
    traverse(parsed, stats);
  } catch { /* return zeroes */ }
  return stats;
}

function traverse(value: unknown, stats: JsonStats): void {
  if (value === null) { stats.nulls++; return; }
  if (Array.isArray(value)) {
    stats.arrays++;
    for (const item of value) traverse(item, stats);
    return;
  }
  if (typeof value === "object") {
    stats.objects++;
    const entries = Object.entries(value as Record<string, unknown>);
    stats.keys += entries.length;
    for (const [, v] of entries) traverse(v, stats);
    return;
  }
  if (typeof value === "string") { stats.strings++; return; }
  if (typeof value === "number") { stats.numbers++; return; }
  if (typeof value === "boolean") { stats.booleans++; return; }
}

function sortObject(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj as Record<string, unknown>).sort()) {
    sorted[key] = sortObject((obj as Record<string, unknown>)[key]);
  }
  return sorted;
}

export const SAMPLE_JSON = `{
  "name": "John Doe",
  "age": 30,
  "email": "john@example.com",
  "isActive": true,
  "address": {
    "street": "123 Main St",
    "city": "Springfield",
    "zip": "62704"
  },
  "hobbies": ["reading", "cycling", "photography"],
  "scores": [95, 87, 92],
  "metadata": null
}`;
