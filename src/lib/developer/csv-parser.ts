/**
 * CSV parsing utilities with proper state-machine parser.
 * Supports quoted fields, escaped quotes, custom delimiters.
 */

export type Delimiter = "," | ";" | "\t" | "|";

export interface CsvParseOptions {
  delimiter?: Delimiter;
  hasHeader?: boolean;
  typeInference?: boolean;
  nested?: boolean;
}

export interface CsvParseResult {
  data: Record<string, unknown>[];
  rowCount: number;
  columnCount: number;
  headers: string[];
  error?: string;
}

const DANGEROUS_KEYS = new Set([
  "__proto__", "prototype", "constructor",
]);

/** Detect delimiter from first line. */
export function detectDelimiter(input: string): Delimiter {
  const firstLine = input.split("\n")[0] || "";
  const counts: [Delimiter, number][] = [
    [",", (firstLine.match(/,/g) || []).length],
    [";", (firstLine.match(/;/g) || []).length],
    ["\t", (firstLine.match(/\t/g) || []).length],
    ["|", (firstLine.match(/\|/g) || []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

/** Parse CSV text into structured data. */
export function parseCsv(input: string, options: CsvParseOptions = {}): CsvParseResult {
  if (!input.trim()) return { data: [], rowCount: 0, columnCount: 0, headers: [] };

  const delimiter = options.delimiter || detectDelimiter(input);
  const hasHeader = options.hasHeader !== false;
  const rows = parseRows(input, delimiter);

  if (rows.length === 0) return { data: [], rowCount: 0, columnCount: 0, headers: [] };

  let headers: string[];
  let dataRows: string[][];

  if (hasHeader) {
    headers = rows[0];
    dataRows = rows.slice(1);
  } else {
    headers = rows[0].map((_, i) => `col${i + 1}`);
    dataRows = rows;
  }

  const columnCount = headers.length;
  const data: Record<string, unknown>[] = [];

  for (const row of dataRows) {
    if (row.every((cell) => cell === "")) continue;
    const obj: Record<string, unknown> = Object.create(null);
    headers.forEach((header, i) => {
      const value = i < row.length ? row[i] : "";
      const processed = options.typeInference !== false
        ? inferType(value) : value;

      if (options.nested && header.includes(".")) {
        setNestedValue(obj, header, processed);
      } else {
        if (DANGEROUS_KEYS.has(header)) return;
        obj[header] = processed;
      }
    });
    data.push(obj);
  }

  return { data, rowCount: data.length, columnCount, headers };
}


/** State-machine CSV row parser. */
function parseRows(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];

    if (inQuotes) {
      if (ch === '"' && input[i + 1] === '"') {
        field += '"'; i += 2;
      } else if (ch === '"') {
        inQuotes = false; i++;
      } else {
        field += ch; i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true; i++;
      } else if (ch === delimiter) {
        row.push(field); field = ""; i++;
      } else if (ch === "\r" && input[i + 1] === "\n") {
        row.push(field); field = "";
        rows.push(row); row = []; i += 2;
      } else if (ch === "\n") {
        row.push(field); field = "";
        rows.push(row); row = []; i++;
      } else {
        field += ch; i++;
      }
    }
  }
  // Final field/row
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Infer primitive types from string values. */
function inferType(value: string): unknown {
  if (value === "") return "";
  if (value.toLowerCase() === "null") return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  const num = Number(value);
  if (!isNaN(num) && value.trim() !== "") return num;
  return value;
}

/** Check if any segment in a dot-path is dangerous. */
function hasDangerousSegment(path: string): boolean {
  return path.split(".").some((seg) => DANGEROUS_KEYS.has(seg));
}

/** Set a nested value using dot notation with prototype pollution protection. */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  if (hasDangerousSegment(path)) return;

  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
      current[key] = Object.create(null);
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]] = value;
}

export const SAMPLE_CSV = `name,email,age,address.city,address.zip
Alice,alice@example.com,28,Bengaluru,560001
Bob,bob@example.com,35,Mumbai,400001
Charlie,charlie@example.com,42,Delhi,110001`;
