/**
 * URL encoding/decoding utilities.
 */

export type UrlMode = "component" | "full";

/** Encode a URL component. */
export function encodeUrlComponent(input: string): string {
  return encodeURIComponent(input);
}

/** Decode a URL component. */
export function decodeUrlComponent(input: string): string {
  return decodeURIComponent(input);
}

/** Encode a full URL. */
export function encodeFullUrl(input: string): string {
  return encodeURI(input);
}

/** Decode a full URL. */
export function decodeFullUrl(input: string): string {
  return decodeURI(input);
}

/** Safely decode - catches malformed percent encoding. */
export function safeDecode(input: string, mode: UrlMode): { result: string; error?: string } {
  try {
    const result = mode === "component" ? decodeUrlComponent(input) : decodeFullUrl(input);
    return { result };
  } catch (e) {
    return { result: "", error: "Malformed percent-encoded sequence" };
  }
}

/** Safely encode. */
export function safeEncode(input: string, mode: UrlMode): { result: string; error?: string } {
  try {
    const result = mode === "component" ? encodeUrlComponent(input) : encodeFullUrl(input);
    return { result };
  } catch (e) {
    return { result: "", error: "Unable to encode input" };
  }
}

export const COMMON_ENCODINGS: { char: string; encoded: string; name: string }[] = [
  { char: " ", encoded: "%20", name: "Space" },
  { char: "!", encoded: "%21", name: "Exclamation" },
  { char: "#", encoded: "%23", name: "Hash" },
  { char: "$", encoded: "%24", name: "Dollar" },
  { char: "&", encoded: "%26", name: "Ampersand" },
  { char: "'", encoded: "%27", name: "Single quote" },
  { char: "(", encoded: "%28", name: "Open paren" },
  { char: ")", encoded: "%29", name: "Close paren" },
  { char: "+", encoded: "%2B", name: "Plus" },
  { char: ",", encoded: "%2C", name: "Comma" },
  { char: "/", encoded: "%2F", name: "Slash" },
  { char: ":", encoded: "%3A", name: "Colon" },
  { char: "=", encoded: "%3D", name: "Equals" },
  { char: "?", encoded: "%3F", name: "Question" },
  { char: "@", encoded: "%40", name: "At sign" },
];

export const SAMPLE_URL = "https://example.com/path?name=John Doe&city=New York&tag=#coding";
