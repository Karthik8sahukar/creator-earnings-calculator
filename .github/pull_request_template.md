<!--
Thanks for the contribution!

Keep the PR small and focused. Every item below should be considered
before requesting review. Uncheck the ones that are genuinely N/A for
your change (don't just tick everything).
-->

## Summary

<!-- One or two sentences on what this PR does and why. -->

## Validation

- [ ] `npm run lint` passed
- [ ] `npm run typecheck` passed
- [ ] `npm run test` passed (unit)
- [ ] `npm run test:coverage` reviewed (no regressions)
- [ ] `npm run test:e2e` passed (Playwright, mocked API)
- [ ] `npm run build` passed

## Product & UX

- [ ] Accessibility checked (keyboard nav, ARIA roles, colour contrast, screen-reader summaries where appropriate)
- [ ] Mobile layout checked at 375×812
- [ ] Tablet layout checked at 768×1024
- [ ] Desktop layout checked at 1440×900
- [ ] Legal / disclaimer copy still accurate for this change (Privacy, Terms, Disclaimer, Methodology, About)
- [ ] `Last updated` date bumped if legal copy changed

## Security & operations

- [ ] No secrets committed (`YOUTUBE_API_KEY`, service tokens, credentials, etc.)
- [ ] No `.env.local` committed
- [ ] Environment variables documented in `.env.example`
- [ ] No new server-only value exposed via a `NEXT_PUBLIC_*` variable
- [ ] Structured log lines do not leak secrets or PII (see `src/lib/logger.ts`)
- [ ] YouTube API quota impact reviewed (any new endpoints, new call sites, cache TTLs)

## Notes for reviewers

<!-- Anything else the reviewer should know: known limitations, follow-ups, screenshots, etc. -->
