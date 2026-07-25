/**
 * Standard five-field Unix cron expression utilities.
 * Supports: minute hour day-of-month month day-of-week
 */

export interface CronFields {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export interface CronPreset {
  label: string;
  expression: string;
}

export const PRESETS: CronPreset[] = [
  { label: "Every minute", expression: "* * * * *" },
  { label: "Every 5 minutes", expression: "*/5 * * * *" },
  { label: "Every hour", expression: "0 * * * *" },
  { label: "Every day at midnight", expression: "0 0 * * *" },
  { label: "Every day at 9:00 AM", expression: "0 9 * * *" },
  { label: "Every Monday at 9:00 AM", expression: "0 9 * * 1" },
  { label: "First day of every month", expression: "0 0 1 * *" },
  { label: "Weekdays at 9:00 AM", expression: "0 9 * * 1-5" },
];

const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Parse cron string into fields. */
export function parseCron(expr: string): CronFields | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return { minute: parts[0], hour: parts[1], dayOfMonth: parts[2], month: parts[3], dayOfWeek: parts[4] };
}

/** Validate a cron expression. */
export function validateCron(expr: string): { valid: boolean; error?: string } {
  const fields = parseCron(expr);
  if (!fields) return { valid: false, error: "Expected 5 space-separated fields" };
  const checks: [string, number, number, string][] = [
    [fields.minute, 0, 59, "minute"],
    [fields.hour, 0, 23, "hour"],
    [fields.dayOfMonth, 1, 31, "day-of-month"],
    [fields.month, 1, 12, "month"],
    [fields.dayOfWeek, 0, 7, "day-of-week"],
  ];
  for (const [field, min, max, name] of checks) {
    if (!isValidField(field, min, max)) {
      return { valid: false, error: `Invalid ${name} field: "${field}"` };
    }
  }
  return { valid: true };
}

function isValidField(field: string, min: number, max: number): boolean {
  if (field === "*") return true;
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      const [range, step] = part.split("/");
      if (!step || isNaN(Number(step)) || Number(step) < 1) return false;
      if (range !== "*" && !isValidRange(range, min, max)) return false;
    } else if (part.includes("-")) {
      if (!isValidRange(part, min, max)) return false;
    } else {
      const n = Number(part);
      if (isNaN(n) || n < min || n > max) return false;
    }
  }
  return true;
}

function isValidRange(range: string, min: number, max: number): boolean {
  const [startStr, endStr] = range.split("-");
  const start = Number(startStr);
  const end = Number(endStr);
  if (isNaN(start) || isNaN(end)) return false;
  return start >= min && end <= max && start <= end;
}

/** Humanize a cron expression to plain English. */
export function humanizeCron(expr: string): string {
  const fields = parseCron(expr);
  if (!fields) return "Invalid cron expression";

  const { minute, hour, dayOfMonth, month, dayOfWeek } = fields;
  const parts: string[] = [];

  // Time
  if (minute === "*" && hour === "*") {
    parts.push("Every minute");
  } else if (minute.startsWith("*/")) {
    parts.push(`Every ${minute.slice(2)} minutes`);
  } else if (hour === "*") {
    parts.push(`At minute ${minute} of every hour`);
  } else if (minute === "0" && hour.startsWith("*/")) {
    parts.push(`Every ${hour.slice(2)} hours`);
  } else {
    const h = hour === "*" ? "every hour" : `${hour.padStart(2, "0")}`;
    const m = minute.padStart(2, "0");
    if (hour !== "*") {
      parts.push(`At ${h}:${m}`);
    } else {
      parts.push(`At minute ${m} of ${h}`);
    }
  }

  // Day of month
  if (dayOfMonth !== "*") {
    parts.push(`on day ${dayOfMonth} of the month`);
  }

  // Month
  if (month !== "*") {
    const monthName = MONTH_NAMES[Number(month)] || month;
    parts.push(`in ${monthName}`);
  }

  // Day of week
  if (dayOfWeek !== "*") {
    if (dayOfWeek === "1-5") {
      parts.push("on weekdays");
    } else if (dayOfWeek === "0,6") {
      parts.push("on weekends");
    } else {
      const days = dayOfWeek.split(",").map((d) => DAY_NAMES[Number(d)] || d);
      parts.push(`on ${days.join(", ")}`);
    }
  }

  return parts.join(" ");
}

/** Calculate next N run times (using browser local time). */
export function getNextRuns(expr: string, count = 5): Date[] {
  const validation = validateCron(expr);
  if (!validation.valid) return [];
  const fields = parseCron(expr)!;
  const runs: Date[] = [];
  const now = new Date();
  const candidate = new Date(now);
  candidate.setSeconds(0, 0);
  candidate.setMinutes(candidate.getMinutes() + 1);

  let iterations = 0;
  const maxIterations = 525600; // 1 year of minutes

  while (runs.length < count && iterations < maxIterations) {
    iterations++;
    if (matchesCron(candidate, fields)) {
      runs.push(new Date(candidate));
    }
    candidate.setMinutes(candidate.getMinutes() + 1);
  }
  return runs;
}

function matchesCron(date: Date, fields: CronFields): boolean {
  return (
    matchesField(date.getMinutes(), fields.minute, 0, 59) &&
    matchesField(date.getHours(), fields.hour, 0, 23) &&
    matchesField(date.getDate(), fields.dayOfMonth, 1, 31) &&
    matchesField(date.getMonth() + 1, fields.month, 1, 12) &&
    matchesField(date.getDay(), fields.dayOfWeek, 0, 7)
  );
}

function matchesField(value: number, field: string, min: number, max: number): boolean {
  if (field === "*") return true;
  const parts = field.split(",");
  for (const part of parts) {
    if (part.includes("/")) {
      const [range, stepStr] = part.split("/");
      const step = Number(stepStr);
      const start = range === "*" ? min : Number(range.split("-")[0]);
      if ((value - start) % step === 0 && value >= start) return true;
    } else if (part.includes("-")) {
      const [s, e] = part.split("-").map(Number);
      if (value >= s && value <= e) return true;
    } else {
      if (value === Number(part) || (Number(part) === 7 && value === 0)) return true;
    }
  }
  return false;
}
