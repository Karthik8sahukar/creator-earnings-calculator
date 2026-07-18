import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives.
 *
 * Use these instead of `next/link` and `next/navigation` in any code
 * that renders internal URLs — they automatically prefix routes with
 * the active locale and preserve query strings + hashes when calling
 * `router.replace(pathname, { locale: "es" })` etc.
 *
 * Never use these for external URLs (YouTube, GitHub, Google) —
 * those stay on plain `<a>` tags.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
