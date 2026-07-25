/**
 * UUID generation and validation utilities.
 * Uses crypto.randomUUID or crypto.getRandomValues — never Math.random.
 */

/** Generate a single UUID v4. */
export function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback using getRandomValues
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Generate multiple UUIDs. */
export function generateUuids(count: number): string[] {
  return Array.from({ length: count }, () => generateUuid());
}

/** Format UUID based on options. */
export function formatUuid(uuid: string, uppercase: boolean, hyphens: boolean): string {
  const result = hyphens ? uuid : uuid.replace(/-/g, "");
  return uppercase ? result.toUpperCase() : result.toLowerCase();
}

/** Validate a UUID string and identify version. */
export function validateUuid(input: string): { valid: boolean; version?: number } {
  const trimmed = input.trim().toLowerCase();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-([1-5])[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
  const match = trimmed.match(uuidRegex);
  if (match) return { valid: true, version: parseInt(match[1], 10) };
  // Also accept without hyphens
  const noHyphenRegex = /^[0-9a-f]{8}([0-9a-f]{4})([1-5])([0-9a-f]{3})([89ab][0-9a-f]{3})([0-9a-f]{12})$/;
  const m2 = trimmed.match(noHyphenRegex);
  if (m2) return { valid: true, version: parseInt(m2[2], 10) };
  return { valid: false };
}
