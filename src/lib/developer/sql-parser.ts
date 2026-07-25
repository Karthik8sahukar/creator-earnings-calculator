/**
 * SQL INSERT statement to JSON converter.
 * Supports VALUES clauses with proper string escaping.
 */

export interface SqlParseResult {
  data: Record<string, unknown>[];
  rowCount: number;
  error?: string;
}

/** Parse SQL INSERT statements to JSON. */
export function parseSqlInsert(sql: string): SqlParseResult {
  const trimmed = sql.trim();
  if (!trimmed) return { data: [], rowCount: 0 };

  // Match INSERT INTO table (columns) VALUES ...
  const insertRegex =
    /INSERT\s+INTO\s+\S+\s*\(([^)]+)\)\s*VALUES\s*/i;
  const match = trimmed.match(insertRegex);

  if (!match) {
    // Try without column names
    const noColRegex = /INSERT\s+INTO\s+\S+\s*VALUES\s*/i;
    if (noColRegex.test(trimmed)) {
      return parseWithoutColumns(trimmed);
    }
    return { data: [], rowCount: 0, error: "Expected INSERT INTO ... VALUES" };
  }

  const columns = match[1].split(",").map((c) =>
    c.trim().replace(/[`"[\]]/g, "")
  );
  const valuesStr = trimmed.slice(match[0].length);
  const rows = parseValueRows(valuesStr);

  if (rows.error) return { data: [], rowCount: 0, error: rows.error };

  const data = rows.values.map((row) => {
    const obj: Record<string, unknown> = {};
    columns.forEach((col, i) => {
      obj[col] = i < row.length ? row[i] : null;
    });
    return obj;
  });

  return { data, rowCount: data.length };
}

function parseWithoutColumns(sql: string): SqlParseResult {
  const valuesIdx = sql.search(/VALUES\s*/i);
  if (valuesIdx === -1) return { data: [], rowCount: 0, error: "No VALUES found" };
  const afterValues = sql.slice(valuesIdx).replace(/^VALUES\s*/i, "");
  const rows = parseValueRows(afterValues);
  if (rows.error) return { data: [], rowCount: 0, error: rows.error };

  const data = rows.values.map((row) => {
    const obj: Record<string, unknown> = {};
    row.forEach((val, i) => { obj[`col${i + 1}`] = val; });
    return obj;
  });
  return { data, rowCount: data.length };
}

interface ParsedRows {
  values: unknown[][];
  error?: string;
}

function parseValueRows(input: string): ParsedRows {
  const values: unknown[][] = [];
  let i = 0;
  const s = input.trim().replace(/;\s*$/, "");

  while (i < s.length) {
    // Skip whitespace and commas between rows
    while (i < s.length && /[\s,]/.test(s[i])) i++;
    if (i >= s.length) break;
    if (s[i] !== "(") {
      return { values, error: `Expected '(' at position ${i}` };
    }
    i++; // skip (
    const row = parseRow(s, i);
    if (row.error) return { values, error: row.error };
    values.push(row.values);
    i = row.endIndex;
  }
  return { values };
}

interface RowResult {
  values: unknown[];
  endIndex: number;
  error?: string;
}

function parseRow(s: string, start: number): RowResult {
  const values: unknown[] = [];
  let i = start;

  while (i < s.length) {
    while (i < s.length && s[i] === " ") i++;
    if (s[i] === ")") return { values, endIndex: i + 1 };

    if (s[i] === ",") { i++; continue; }

    // Parse value
    const val = parseValue(s, i);
    if (val.error) return { values, endIndex: i, error: val.error };
    values.push(val.value);
    i = val.endIndex;
  }
  return { values, endIndex: i, error: "Missing closing ')'" };
}


interface ValueResult {
  value: unknown;
  endIndex: number;
  error?: string;
}

function parseValue(s: string, start: number): ValueResult {
  let i = start;
  while (i < s.length && s[i] === " ") i++;

  // String literal
  if (s[i] === "'") {
    return parseString(s, i);
  }

  // NULL
  if (s.slice(i, i + 4).toUpperCase() === "NULL") {
    return { value: null, endIndex: i + 4 };
  }

  // Boolean
  if (s.slice(i, i + 4).toUpperCase() === "TRUE") {
    return { value: true, endIndex: i + 4 };
  }
  if (s.slice(i, i + 5).toUpperCase() === "FALSE") {
    return { value: false, endIndex: i + 5 };
  }

  // Number
  let numStr = "";
  while (i < s.length && /[0-9.\-eE+]/.test(s[i])) {
    numStr += s[i]; i++;
  }
  if (numStr) {
    const num = Number(numStr);
    if (!isNaN(num)) return { value: num, endIndex: i };
  }

  return { value: null, endIndex: i, error: `Unexpected token at position ${start}` };
}

function parseString(s: string, start: number): ValueResult {
  let i = start + 1; // skip opening quote
  let result = "";
  while (i < s.length) {
    if (s[i] === "'" && s[i + 1] === "'") {
      result += "'"; i += 2; // escaped single quote
    } else if (s[i] === "'") {
      return { value: result, endIndex: i + 1 };
    } else if (s[i] === "\\" && i + 1 < s.length) {
      result += s[i + 1]; i += 2; // backslash escape
    } else {
      result += s[i]; i++;
    }
  }
  return { value: result, endIndex: i, error: "Unterminated string" };
}

export const SAMPLE_SQL = `INSERT INTO users (id, name, email, active)
VALUES
(1, 'Alice', 'alice@example.com', true),
(2, 'Bob', 'bob@example.com', false),
(3, 'Charlie', 'charlie@example.com', true);`;
