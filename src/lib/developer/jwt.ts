/**
 * JWT decoding utilities. Decode only — never verifies signatures.
 */

export interface JwtHeader {
  alg?: string;
  typ?: string;
  kid?: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  iss?: string;
  sub?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface DecodedJwt {
  header: JwtHeader;
  payload: JwtPayload;
  signature: string;
}

/** Decode Base64URL string to UTF-8. */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) base64 += "=";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/** Decode a JWT token. Throws on malformed tokens. */
export function decodeJwt(token: string): DecodedJwt {
  const trimmed = token.trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT: expected 3 dot-separated parts");
  }

  let header: JwtHeader;
  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
  } catch {
    throw new Error("Invalid JWT: header is not valid Base64URL JSON");
  }

  let payload: JwtPayload;
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    throw new Error("Invalid JWT: payload is not valid Base64URL JSON");
  }

  return { header, payload, signature: parts[2] };
}

/** Check if token is expired. */
export function isExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return false;
  return Date.now() / 1000 > payload.exp;
}

/** Get time remaining or expired duration. */
export function getExpiryInfo(payload: JwtPayload): { expired: boolean; label: string } | null {
  if (!payload.exp) return null;
  const now = Date.now() / 1000;
  const diff = payload.exp - now;
  if (diff > 0) {
    return { expired: false, label: formatDuration(diff) };
  }
  return { expired: true, label: formatDuration(Math.abs(diff)) + " ago" };
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
  return `${Math.round(seconds / 86400)}d`;
}

/** Convert Unix timestamp to readable date string. */
export function unixToDate(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

export const SAMPLE_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjIsImlzcyI6ImV4YW1wbGUuY29tIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
