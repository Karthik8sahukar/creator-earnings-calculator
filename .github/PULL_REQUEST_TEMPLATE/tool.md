## New Tool PR

### Tool Details

- **Slug:** `___`
- **Route:** `/[locale]/___`
- **Category:** ___
- **Registry entry added:** Yes / No

### Checklist

#### Infrastructure
- [ ] Uses `createToolMetadata()` from `@/lib/engine`
- [ ] Uses `<ToolLayout>` from `@/components/engine`
- [ ] Uses `<ToolJsonLd>` from `@/components/engine`
- [ ] Registered in `src/lib/tools/registry.ts`
- [ ] English i18n keys added to `messages/en.json`

#### SEO & Metadata
- [ ] Unique title and description
- [ ] Canonical URL verified
- [ ] Open Graph image fallback works
- [ ] JSON-LD validated (no empty fields)

#### Accessibility
- [ ] Keyboard navigable
- [ ] Labels on all inputs
- [ ] `aria-live` on dynamic results
- [ ] Focus states visible

#### Testing
- [ ] Unit tests for business logic
- [ ] Playwright smoke test
- [ ] Tested in English
- [ ] Tested in at least one other locale
- [ ] Mobile viewport tested

#### Validation
- [ ] `npm run lint` ✓
- [ ] `npm run typecheck` ✓
- [ ] `npm run test` ✓
- [ ] `npm run build` ✓

### Screenshots

_Attach desktop + mobile screenshots if visual changes._

### Notes

_Any context for reviewers._
