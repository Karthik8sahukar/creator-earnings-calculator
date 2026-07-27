# New Tool Quality Checklist

Use this checklist when adding a new tool to BeHumler. Every item must be verified before merge.

## Registry

- [ ] Registered in `src/lib/tools/registry.ts`
- [ ] Unique slug (no duplicates)
- [ ] Correct category assignment
- [ ] Correct localized route (`href` matches file path)
- [ ] Search aliases included (2–4 alternative phrases)
- [ ] Tags included (5–8 relevant keywords)
- [ ] `featured` / `popular` flags set appropriately
- [ ] Related-tool metadata configured where needed

## Page Infrastructure

- [ ] Uses `createToolMetadata()` from `@/lib/engine`
- [ ] Uses `<ToolLayout>` from `@/components/engine`
- [ ] Uses `<ToolJsonLd>` from `@/components/engine`
- [ ] Uses `@/i18n/navigation` Link for internal links
- [ ] Uses shared input/output components where appropriate
- [ ] Does NOT duplicate favorite, share, breadcrumb, or tracking logic
- [ ] `generateStaticParams()` exports all locales (if static)

## SEO

- [ ] Unique title (not duplicated from another tool)
- [ ] Unique description (not duplicated from another tool)
- [ ] Canonical URL is absolute and locale-aware
- [ ] hreflang alternates generated for all 7 locales
- [ ] x-default points to English variant
- [ ] Open Graph metadata present (type, title, description, url, image)
- [ ] Twitter card metadata present (card, title, description, image)
- [ ] Default image fallback verified (`/og-default.png`)
- [ ] `robots: { index: true, follow: true }` verified
- [ ] No empty structured-data properties
- [ ] No duplicated locale path segments in URLs

## Structured Data (JSON-LD)

- [ ] BreadcrumbList schema emitted (Home → Category → Tool)
- [ ] SoftwareApplication schema emitted
- [ ] FAQPage schema emitted when FAQs exist
- [ ] No FAQPage when FAQs are empty/invalid
- [ ] All URLs are absolute
- [ ] No undefined/null/empty-string properties
- [ ] Safe serialization (no script injection)

## Content

- [ ] Clear introductory copy (1–2 sentences)
- [ ] At least 3 useful FAQs (when appropriate for the tool type)
- [ ] No filler FAQs added only to meet a count
- [ ] Formula or explanation included (when users need it)
- [ ] Examples included (when they improve usability)
- [ ] Related tools section renders correctly

## Accessibility

- [ ] Complete keyboard support (Tab, Enter, Escape)
- [ ] Visible focus states on all interactive elements
- [ ] Labels associated with all form fields (`<label htmlFor>` or `aria-label`)
- [ ] Errors announced via `role="alert"` or `aria-live`
- [ ] No nested interactive elements (`<a>` inside `<button>`, etc.)
- [ ] Buttons have meaningful accessible names
- [ ] Dynamic results use `aria-live="polite"`
- [ ] Color is not the only indication of state
- [ ] Logical tab order

## Quality

- [ ] Business logic has unit tests
- [ ] Metadata generation has tests
- [ ] At least one Playwright smoke test
- [ ] Works in English
- [ ] Works in at least one non-English locale
- [ ] Works on mobile viewport (375px)
- [ ] Handles empty input gracefully
- [ ] Handles invalid input gracefully
- [ ] Handles reset/clear actions
- [ ] Copy actions work (with feedback)
- [ ] No console errors in production build

## Validation

Run all of these and confirm they pass:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright test
```

## Manual Verification (post-deploy)

- [ ] Visit the tool in production
- [ ] Test Google Rich Results: https://search.google.com/test/rich-results?url=YOUR_URL
- [ ] Verify hreflang in page source
- [ ] Verify canonical URL in page source
- [ ] Test with Lighthouse (Performance, Accessibility, SEO)
