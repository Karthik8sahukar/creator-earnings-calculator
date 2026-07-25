/**
 * Base64 encoding/decoding utilities with proper Unicode support.
 */

/** Encode UTF-8 string to Base64. */
export function encodeBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary);
}

/** Decode Base64 to UTF-8 string. */
export function decodeBase64(input: string): string {
  const normalized = input.replace(/\s/g, "");
  if (!isValidBase64(normalized)) throw new Error("Invalid Base64 input");
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Encode UTF-8 string to Base64URL. */
export function encodeBase64Url(input: string): string {
  return encodeBase64(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode Base64URL to UTF-8 string. */
export function decodeBase64Url(input: string): string {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  return decodeBase64(base64);
}

/** Validate Base64 string. */
export function isValidBase64(str: string): boolean {
  if (str.length === 0) return true;
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0;
}

/** Get byte count of a string encoded as UTF-8. */
export function getByteCount(str: string): number {
  return new TextEncoder().encode(str).length;
}

export const SAMPLE_TEXT = "Hello, World! 🌍 — Unicode text with special chars: é, ñ, ü";
export const SAMPLE_BASE64 = "SGVsbG8sIFdvcmxkISDwn4yNIOKAlCBVbmljb2RlIHRleHQgd2l0aCBzcGVjaWFsIGNoYXJzOiDDqSwgw7EsIMO8";
