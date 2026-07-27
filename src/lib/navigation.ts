// Drop-in replacement for @/i18n/navigation after removing next-intl.
// All locale-aware navigation is now standard Next.js navigation.
export { default as Link } from "next/link";
export { redirect, usePathname, useRouter } from "next/navigation";
