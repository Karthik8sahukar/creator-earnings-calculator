# YouTube Money Calculator

A production-ready **Next.js 15** app that searches any public YouTube
channel and produces an **independent** estimate of what its channel
revenue might look like, using only the **official YouTube Data API v3**.

- 🔎 Channel search — name, `@handle`, channel URL, or channel ID
- 📊 Recent performance analysis with low/expected/high monthly view bands
- 💰 Configurable earnings estimator with country RPM tiers, niche,
  content type, custom RPM override, currency, and additional income streams
- 📈 Interactive revenue breakdown + 12-month projection charts
  (Recharts, lazy-loaded)
- 🔗 Shareable calculator URLs (state ⇄ URL query params, Zod-validated)
- 🌐 Server-rendered channel pages with dynamic SEO metadata
- 🎨 Social sharing: Web Share API, X, LinkedIn, WhatsApp, copy link
- 🕘 Local recent-search history — never leaves your browser
- 🔒 Server-only YouTube API wrapper. API key never sent to the client
- 🧠 In-memory TTL cache with LRU eviction + single-flight deduplication
- 🚦 In-memory rate limiter with 429 + `Retry-After`
- 🩺 `/api/health` endpoint for uptime probes
- 📝 Structured logging with automatic secret redaction
- 🧯 Provider-neutral error-reporter abstraction (no-op default)
- 📉 Provider-neutral analytics abstraction (disabled by default,
  no cookie banner)
- 🧪 Vitest + React Testing Library — 285 unit tests, ~73% overall coverage
- 🎭 Playwright E2E — 32 tests across desktop / tablet / mobile viewports,
  mocked API, zero real quota consumption
- ⚙️ GitHub Actions CI — lint · typecheck · test · build + separate
  Playwright job with browser caching + report upload on failure
- ♿ Keyboard-navigable combobox, visible focus, semantic headings, aria-live
- 🔎 SEO: dynamic per-channel metadata + OG/Twitter + `robots.ts` +
  `sitemap.ts` + JSON-LD
- 🔐 Baseline security headers, image domain allowlist

Additional standalone calculators:

- **RPM** — `/youtube-rpm-calculator`
- **CPM** — `/youtube-cpm-calculator`
- **Shorts** — `/youtube-shorts-calculator`
- **Sponsorship** — `/youtube-sponsorship-calculator`

> ⚠️ This is an **independent** tool. It is not affiliated with, endorsed
> by, or verified by YouTube or Google. All revenue figures are estimates.

---

## Table of contents

- [Local development](#local-development)
- [Validation commands](#validation-commands)
- [Vercel deployment](#vercel-deployment)
- [Google Cloud & API-key setup](#google-cloud--api-key-setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
  - [Unit tests](#unit-tests)
  - [End-to-end tests](#end-to-end-tests)
- [Continuous integration](#continuous-integration)
- [Project structure](#project-structure)
- [How the estimator works](#how-the-estimator-works)
- [Health endpoint](#health-endpoint)
- [Cache implementation](#cache-implementation)
- [Rate limiting](#rate-limiting)
- [Shareable URLs](#shareable-urls)
- [Structured logging & observability](#structured-logging--observability)
- [Error reporting abstraction](#error-reporting-abstraction)
- [Analytics (disabled by default)](#analytics-disabled-by-default)
- [Bundle-size considerations](#bundle-size-considerations)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)

---

## Local development

```
npm install
cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. `.env.local` is gitignored — never commit it.

---

## Validation commands

Run the full suite locally before pushing:

```
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run test:e2e
npm run build
```

`test:e2e` boots the app under `E2E_MOCK_MODE=1` — no real YouTube API
requests are made. See [End-to-end tests](#end-to-end-tests).

---

## Vercel deployment

The app is designed to deploy on Vercel with zero custom config
(`vercel.json` is intentionally absent — the Next.js defaults are correct
for this app).

1. **Import the GitHub repository into Vercel.**
2. **Select the Next.js framework preset** (Vercel auto-detects it).
3. In **Settings → Environment Variables**, add:
   - `YOUTUBE_API_KEY` — your YouTube Data API v3 key (Production +
     Preview + Development).
4. Add the production `NEXT_PUBLIC_SITE_URL` — for example
   `https://your-domain.example`. This must be an absolute URL in
   production (Zod-validated at boot; the app will fail to start with
   a clear message if it isn't).
5. Optionally configure the rate-limit / timeout / proxy variables
   (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`, `YOUTUBE_TIMEOUT_MS`,
   `TRUST_PROXY=1`).
6. **Deploy.** Vercel builds using the same `npm run build` you use
   locally — no real API call happens during build.
7. **If you're migrating from an older deployment that set
   `NEXT_PUBLIC_SITE_NAME`, remove that env var.** The brand is now
   hardcoded in `src/lib/config.ts` (`BRAND_NAME`) so branding cannot
   drift because of a stale env value. A leftover env var has no
   effect; delete it for cleanliness.
8. Test the production API routes:
   `/api/health` should return `200` with `youtubeApiConfigured: true`.
9. **Confirm channel search** at your production URL — search for any
   real channel by name.
10. **Confirm official thumbnails** load — image domains are allowlisted
    in `next.config.mjs`.
11. **Confirm share URLs** — copy a link from the share section and open
    it in a fresh tab; the calculator state should be restored.
12. **Confirm legal pages** — `/privacy`, `/terms`, `/disclaimer`,
    `/methodology`, `/about` all render with a "Last updated" date.
13. **Confirm secrets are not visible** — open DevTools → Network / Sources
    on any page and verify `YOUTUBE_API_KEY` is nowhere in the client
    bundle or API responses. (The env schema in `src/lib/env.server.ts`
    imports `server-only`, so a build-time import into a client component
    would already have failed.)

### Preview deployment behaviour

- Every pull request gets its own preview URL. It builds with the same
  code path as production but with the environment variables you set for
  the "Preview" environment.
- Preview deployments are **not indexed by search engines** (Vercel adds
  `X-Robots-Tag: noindex` automatically for `.vercel.app` preview URLs).
- Preview deployments still make real YouTube API calls when their
  `YOUTUBE_API_KEY` is set. If you want a quota-free preview, deploy
  with `E2E_MOCK_MODE=1` — the mock refuses to activate under Vercel
  (`VERCEL=1`), so this must be paired with a special preview target.

### Production domain changes

If you swap the production domain, update `NEXT_PUBLIC_SITE_URL`
accordingly. This value drives:

- `metadataBase` for absolute OG / Twitter URLs
- `robots.txt` and `sitemap.xml`
- Canonical URLs on the channel page and legal pages
- Server-side JSON-LD

Redeploy after the change so the new URL is baked into the static output.

### Google Cloud API-key restrictions

- **API restriction (recommended)**: restrict this key to the
  **YouTube Data API v3** only. This is the primary defense — it stops
  the key being reused for other Google APIs if it ever leaks.
- **HTTP referrer restriction**: **do not** use one. Requests are made
  server-to-server and carry no `Referer` header, so a referrer
  restriction rejects every request.
- **IP restriction**: only appropriate when the deployment has stable
  outbound IP addresses. Vercel (and most serverless platforms) do
  **not** provide a single stable outbound IP by default — traffic can
  originate from many rotating egress IPs. Do not enable an IP
  restriction on Vercel unless you have a fixed-egress solution
  configured (a dedicated / static egress add-on, or an outbound proxy
  you control). Otherwise leave the application restriction empty.
- The key is only ever read by `src/lib/env.server.ts` (imports
  `server-only`) — never inlined in the client bundle.

### Quota monitoring

Track daily quota usage in the Google Cloud console:

- **APIs & Services → Dashboard** shows per-API usage.
- One typical channel visit (search → channel → recent videos) costs
  ~100–120 quota units. The free tier is 10,000 units/day.
- The in-process cache substantially reduces upstream traffic for
  repeat visitors within its TTL windows.

### Instance-local cache limitations

Vercel serverless functions run per-request across many instances. Each
instance keeps its own `TtlCache` and `SlidingWindowLimiter`, so:

- **Cache hit rate degrades** with instance count. Popular channels still
  benefit because Vercel keeps hot functions warm.
- **Rate-limit accuracy degrades** — the limit is enforced per-instance,
  so an aggressive caller can burst by up to `N × RATE_LIMIT_MAX` where
  `N` is the number of concurrent instances.
- For a globally-consistent cache and limiter, back both with Redis /
  Upstash. See [Redis migration path](#redis-migration-path).

### Redis migration path

- Swap the internal `Map` in `TtlCache` (`src/lib/cache.ts`) for a Redis
  client. The `get`/`set`/`getOrLoad` shape doesn't change.
- Swap the internal `Map` in `SlidingWindowLimiter` (`src/lib/rateLimit.ts`)
  for something like `@upstash/ratelimit`. `identifyClient` and the
  `RateLimitResult` shape stay the same.
- Nothing else in the app needs to change — the higher layers depend
  only on the public interfaces.

### Safe logging in production

- `src/lib/logger.ts` emits one JSON line per event. Every payload passes
  through `redact()` before the sink sees it — Google-style API keys,
  `key=` / `api_key=` URL params, bearer tokens, and sensitive object
  keys (apiKey, secret, password, ip, userAgent, cookie, authorization,
  referer) are replaced with `[REDACTED]`.
- One `api.request` summary line is written per API request with route,
  status, durationMs, cacheStatus, upstreamCategory, rate-limit outcome,
  and an anonymized client id — never the raw IP.
- Debug logs are gated behind `LOG_DEBUG=1` **and** a non-production
  `NODE_ENV` — impossible to accidentally enable in prod.

### Error reporting abstraction

- `src/lib/errorReporter.ts` ships with a no-op default so no third-party
  service is contacted out of the box.
- To wire Sentry / Datadog / any other provider, create a
  `errorReporter.provider.ts` module that calls `setErrorReporter(...)`
  at boot and forwards to your provider. Both `captureException` and
  `captureMessage` are redacted before dispatch.
- Only unexpected server-side errors are reported. Expected validation
  failures (Zod) and classified upstream errors (YouTubeApiError) are
  never reported — they're normal responses, not exceptions.

### Analytics — disabled by default

- `src/lib/analytics.ts` is a strongly-typed, provider-neutral tracker
  with a no-op default. **No cookie banner** ships with the app.
- To enable analytics later, set `NEXT_PUBLIC_ANALYTICS_ENABLED=1` and
  wire a provider via `setAnalytics(...)` — see the module header for
  an example. If your provider needs consent, add a banner guarded on
  `isAnalyticsEnabled()`.
- Only allow-listed events fire (`search.submitted`, `channel.selected`,
  `calculator.assumption_changed`, `share.link_copied`,
  `share.native_shared`, `share.social_opened`,
  `additional_calculator.opened`). Raw search text, IP addresses, and
  the API key can't leave the abstraction — the type system forbids it
  and a runtime scrub layer double-checks.

### E2E testing in production

Do **not** enable `E2E_MOCK_MODE` in production. The mock module refuses
to activate when `VERCEL=1` — this makes accidental activation on a
Vercel deployment structurally impossible.

### Health endpoint

`/api/health` returns `200` with:

```json
{
  "status": "ok",
  "service": "youtube-money-calculator",
  "timestamp": "…ISO date…",
  "youtubeApiConfigured": true
}
```

Wire it into an uptime service (Better Uptime, UptimeRobot, StatusCake).
It never calls YouTube, never returns environment values, and always
responds with `Cache-Control: no-store`.

### Bundle-size considerations

- Recharts is loaded via `next/dynamic({ ssr: false })` — only fetched
  on the channel page **after** the user has real data to visualize.
- Homepage first-load JS is ~130 kB (down from ~252 kB pre-optimisation).
- Additional-calculator pages sit around 108–110 kB First Load.
- Charts have a screen-reader-friendly text summary that is rendered
  synchronously, so accessibility isn't gated on the lazy load.

---

## Google Cloud & API-key setup

Exact steps to obtain a YouTube Data API v3 key:

1. Go to <https://console.cloud.google.com/> and create or select a project.
2. Navigate to **APIs & Services → Library**, find **YouTube Data API v3**,
   and click **Enable**.
3. Go to **APIs & Services → Credentials → Create credentials → API key**.
4. Copy the generated key.
5. Apply **API restrictions**: restrict this key to **YouTube Data
   API v3** only. This is the most important restriction — it stops
   the key being reused for other Google APIs if it ever leaks.
6. Choose an **application restriction** carefully:
   - **Do not** use an HTTP referrer restriction. Requests are made
     server-to-server and carry no `Referer` header, so a referrer
     restriction rejects every request.
   - Apply an **IP restriction** only if your deployment has stable
     outbound IP addresses (traditional VMs, a self-hosted server,
     or a serverless deployment configured with fixed egress).
     Vercel and similar serverless platforms do not provide a single
     stable outbound IP by default, so an IP restriction there will
     block real traffic — leave the application restriction empty
     unless you have a fixed egress path configured.
   - For local development, no application restriction is required.
7. Store the key as `YOUTUBE_API_KEY` — either in `.env.local` for local
   dev or as a secret in your deployment platform.
8. **Never commit `.env.local`.** `.gitignore` already excludes it.

The free tier gives 10,000 quota units/day. A typical channel visit
(search → channel → recent videos) costs about 100–120 units.

---

## Environment variables

Copy `.env.example` to `.env.local`:

```env
YOUTUBE_API_KEY=your-key-here

NEXT_PUBLIC_SITE_URL="http://localhost:3000"

# Optional server tuning
YOUTUBE_TIMEOUT_MS=8000           # abort upstream requests after N ms
RATE_LIMIT_MAX=60                 # requests per window per client
RATE_LIMIT_WINDOW_MS=60000        # sliding window duration
TRUST_PROXY=0                     # honor X-Forwarded-For (1 only behind a real proxy)
```

- All values are **Zod-validated at boot**. Invalid config fails fast
  with a helpful message in development and never echoes the raw values
  (they might be secrets).
- `YOUTUBE_API_KEY` — **server-only**. Lives in `src/lib/env.server.ts`
  which `import "server-only"` — a client import would fail the build.
- `NEXT_PUBLIC_SITE_URL` — canonical base URL used for OG images, sitemap,
  and JSON-LD. Must be an absolute URL in production.
- `TRUST_PROXY` — set to `1` only when behind a proxy that overwrites the
  `X-Forwarded-For` header (Vercel, Fly, Cloudflare).

---

## Scripts

| Command                   | What it does                                  |
| ------------------------- | --------------------------------------------- |
| `npm run dev`             | Start the dev server on port 3000             |
| `npm run build`           | Production build                              |
| `npm run start`           | Serve the production build                    |
| `npm run lint`            | ESLint (flat config; Next.js + TypeScript)    |
| `npm run lint:fix`        | ESLint with `--fix`                           |
| `npm run typecheck`       | `tsc --noEmit`                                |
| `npm run test`            | Vitest suite once                             |
| `npm run test:watch`      | Vitest in watch mode                          |
| `npm run test:coverage`   | Vitest + v8 coverage report                   |
| `npm run test:e2e`        | Playwright E2E (headless, mocked API)         |
| `npm run test:e2e:ui`     | Playwright with the interactive UI            |

---

## Testing

### Unit tests

- **Framework**: Vitest with the `jsdom` environment.
- **UI**: React Testing Library + `@testing-library/user-event`.
- **Matchers**: `@testing-library/jest-dom`.
- **YouTube API**: never called from tests. All upstream fetches are
  mocked via `vi.stubGlobal("fetch", …)` or per-module `vi.mock(...)`.
- **Test files**: 26 files, 285 tests, ~73% overall coverage / ~94% lib
  coverage. Vitest enforces a 60% floor.

### End-to-end tests

- **Framework**: Playwright.
- **Browser**: Chromium (single install, three viewport projects —
  1440×900, 768×1024, 375×812).
- **YouTube API**: guarded by TWO independent env checks
  (`E2E_MOCK_MODE=1` **AND** `VERCEL !== "1"`). See
  `src/lib/e2eFixtures.ts` — deterministic responses for all happy paths
  and every classified error (quota exceeded, upstream unavailable,
  hidden subs, no videos, invalid id, etc.).
- **Test files**: 7 spec files under `e2e/`. 32 tests total.

Run headless:

```
npm run test:e2e
```

Open the UI:

```
npm run test:e2e:ui
```

The Playwright config boots a dev server on port 3100 with mock mode on.

---

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and
`workflow_dispatch`. Superseded runs are cancelled via a `concurrency`
group.

Two jobs:

1. **verify** — lint · typecheck · unit test · build.
2. **e2e** — Playwright suite against a dev server in mock mode. Uses
   `actions/cache` to keep the ~120 MB Chromium download out of the hot
   path. On failure it uploads `playwright-report/` and `test-results/`
   as artifacts (7-day retention).

Node version: 22 (LTS). Dependency cache is enabled via
`actions/setup-node`. All YouTube calls are mocked in both jobs — CI
does not need and does not use a real API key.

---

## Project structure

```
e2e/                              # Playwright specs
  search.spec.ts, keyboard.spec.ts, earnings.spec.ts,
  errors.spec.ts, calculators.smoke.spec.ts, responsive.spec.ts,
  health.smoke.spec.ts
  fixtures/ids.ts                 # Fixture channel ids shared with tests

src/
  app/
    api/
      channel/route.ts            # GET /api/channel?channelId=UC...
      health/route.ts             # GET/HEAD /api/health
      search/route.ts             # GET /api/search?q=...
      videos/route.ts             # GET /api/videos?playlistId=UU...
      __tests__/                  # Route + observability tests
    channel/[channelId]/
      page.tsx                    # Server-rendered channel dashboard
      generateMetadata            # Dynamic per-channel SEO (in page.tsx)
      loading.tsx, not-found.tsx, error.tsx
      __tests__/page.test.ts
    about/, disclaimer/, methodology/, privacy/, terms/
    youtube-rpm-calculator/, youtube-cpm-calculator/,
    youtube-shorts-calculator/, youtube-sponsorship-calculator/
    layout.tsx, page.tsx, robots.ts, sitemap.ts, error.tsx, not-found.tsx
    globals.css
  components/
    ChannelSearch.tsx             # Debounced accessible combobox
    ChannelWorkspace.tsx          # Homepage search shell (navigates on select)
    ChannelDashboard.tsx          # Client wrapper on /channel/[id]
    EarningsCalculator.tsx        # Interactive estimator
    EarningsCharts.tsx            # Lightweight wrapper — sr-only summaries
    EarningsChartsCanvas.tsx      # Recharts render (lazy-loaded)
    CopyShareLink.tsx             # Calculator-state copy button
    ShareSection.tsx              # Social sharing (Web Share, X, LinkedIn, WhatsApp, copy)
    RecentSearches.tsx            # localStorage history
    ProfileCard.tsx, PerformanceCard.tsx, VideosGrid.tsx
    Header.tsx, Footer.tsx, StaticPage.tsx, TransparencyBanner.tsx
    SimpleCalcLayout.tsx          # Shared layout for standalone calculators
    icons.tsx                     # SVG icon set incl. share brand marks
    __tests__/                    # Component tests
  lib/
    config.ts                     # publicConfig + legalLastUpdatedIso
    env.public.ts                 # Zod-validated NEXT_PUBLIC_* env
    env.server.ts                 # Zod-validated server env (import "server-only")
    youtube.ts                    # server-only API wrapper (fetch + timeout + cache)
    e2eFixtures.ts                # Playwright mock-mode fixtures (server-only)
    errors.ts                     # Public error class
    apiHelpers.ts                 # safeErrorResponse + applyRateLimit + withRouteObservability
    cache.ts                      # Bounded TTL cache + single-flight
    rateLimit.ts                  # Sliding-window rate limiter + client id
    logger.ts                     # Structured logger + redact()
    observability.ts              # AsyncLocalStorage per-request context
    errorReporter.ts              # Provider-neutral error reporter (no-op default)
    analytics.ts                  # Provider-neutral analytics (disabled by default)
    calculatorState.ts            # CalculatorState + URL encode/decode
    earnings.ts                   # calculateEarnings — pure
    performance.ts                # analyzePerformance — pure
    parseQuery.ts                 # Query -> channelId / handle / name
    rpmData.ts                    # Country/niche/currency benchmarks
    simpleCalculators.ts          # RPM / CPM / sponsorship — pure
    schemas.ts                    # Zod schemas for request validation
    recentSearches.ts             # localStorage helpers (SSR-safe)
    share.ts                      # Share URL builders
    format.ts                     # Number, currency, date, duration helpers
    __tests__/                    # Unit tests
  types/
    youtube.ts                    # Domain DTOs
```

---

## How the estimator works

### Performance snapshot

1. Fetch up to 12 recent uploads via `playlistItems` + `videos`.
2. Compute average / median view counts, upload cadence in last 30 &
   90 days, Shorts vs. long-form share.
3. Point estimate for monthly views:
   - Prefer 30-day sum if we have ≥ 3 recent uploads.
   - Otherwise scale a 90-day sample down to 30 days.
   - Otherwise average across the observed span.
4. Emit low / expected / high (0.7× / 1.0× / 1.35×) around the point.

### Earnings

```
ad revenue = (monthly views × monetized%) × RPM / 1000
total      = ad revenue + sponsorships + affiliate + memberships + other
```

`RPM` is derived from `country baseRpm × niche multiplier × contentType
multiplier`, unless a custom RPM is provided. Bands (low/expected/high)
scale accordingly. All results are converted to the display currency
using a static approximate FX table.

Details, benchmark review date, and every assumption are documented on
the `/methodology` page inside the app.

---

## Health endpoint

`GET /api/health` returns `200`:

```json
{
  "status": "ok",
  "service": "youtube-money-calculator",
  "timestamp": "2026-07-17T…Z",
  "youtubeApiConfigured": true
}
```

- Never calls the YouTube API.
- Never returns environment values.
- `Cache-Control: no-store`.
- `HEAD` is also supported for probe efficiency.

`youtubeApiConfigured` is `true` when the server has an API key set;
`false` otherwise. The key itself is never in the response.

---

## Cache implementation

`src/lib/cache.ts` — a bounded in-memory TTL LRU cache with concurrent
request deduplication.

- **TTLs**
  - Search results: 45 minutes
  - Channel details: 6 hours
  - Recent videos: 2 hours
- **Max size**: 500 entries per namespace (LRU eviction beyond that).
- **Error handling**: rejected loader promises are *never* cached.
- **Single-flight**: concurrent `getOrLoad(key, …)` calls share one loader.
- **API**: `get`, `set`, `peek`, `delete`, `clear`, `getOrLoad`.

> ⚠️ This cache is **process-local**. See
> [Instance-local cache limitations](#instance-local-cache-limitations).

---

## Rate limiting

`src/lib/rateLimit.ts` — a sliding-window limiter gating the three
YouTube-backed API routes.

- **Configurable** via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`
  (defaults: 60 requests / 60 s per client id).
- **Client identifier**: takes `x-real-ip` when the platform sets it;
  honors `x-forwarded-for` **only** when `TRUST_PROXY=1`. Falls back to
  a shared `"anonymous"` bucket otherwise. Raw IPs are hashed — never
  stored or logged.
- **Response**: `429 RATE_LIMITED` with `Retry-After` and rate-limit
  headers (`X-RateLimit-Limit`, `-Remaining`, `-Reset`).

---

## Shareable URLs

Calculator state round-trips through URL query parameters (Zod-validated).

- Supported params: `cid`, `mv`, `c`, `n`, `ct`, `rm`, `rpm`, `cur`, `mp`,
  `sp`, `af`, `mb`, `ot` (kept short intentionally).
- The channel page decodes params server-side and hydrates the calculator
  with them.
- URL writes are **debounced (200 ms)** so a run of keystrokes doesn't
  push one history entry per character.
- Invalid / unknown params fall back to safe defaults via `z.catch(...)`.
- The share section produces a canonical channel URL without any exact
  earning figure. The user can additionally copy the "share this exact
  calculator state" link inside the calculator.

---

## Structured logging & observability

- `src/lib/logger.ts` — provider-neutral `Logger` interface, JSON output,
  full-payload `redact()` before every write.
- `src/lib/observability.ts` — `withContext(route, fn)` runs the handler
  inside an `AsyncLocalStorage` frame; lower layers (cache, YouTube
  wrapper, rate limiter) call `markCache`, `markUpstream`, `markRateLimit`,
  `markClient` to annotate the current request. Exactly one summary log
  is emitted per API request.
- Never logged: `YOUTUBE_API_KEY`, full upstream URLs, raw IP, user
  agent, referer, cookies, stack traces (in prod or dev), authorization
  headers.

---

## Error reporting abstraction

- `src/lib/errorReporter.ts` — no-op default. `setErrorReporter()` swaps
  the sink at boot.
- Only unexpected errors are reported. `YouTubeApiError` (classified
  upstream) and `ZodError` (validation) are treated as normal responses.
- Both the error and the context are `redact()`ed before the provider
  sees them, so a rogue message with an API key inside cannot leak.

---

## Analytics (disabled by default)

- `src/lib/analytics.ts` — strongly typed `AnalyticsEvent` union +
  provider-neutral client interface.
- Default is a no-op — no third-party service is contacted, and no
  cookie banner is required by construction.
- To enable, set `NEXT_PUBLIC_ANALYTICS_ENABLED=1` and wire a real
  provider via `setAnalytics(...)`. If the provider requires consent,
  gate the banner UI on `isAnalyticsEnabled()`.

---

## Bundle-size considerations

Reported by `next build` on the latest commit:

| Route                              | Page size | First Load JS |
| ---------------------------------- | --------- | ------------- |
| `/`                                | 3.45 kB   | 129 kB        |
| `/channel/[channelId]`             | 7.26 kB   | 137 kB        |
| `/api/health`                      | 142 B     | 103 kB        |
| `/youtube-rpm-calculator`          | 2.29 kB   | 108 kB        |
| `/youtube-cpm-calculator`          | 2.45 kB   | 108 kB        |
| `/youtube-shorts-calculator`       | 3.61 kB   | 109 kB        |
| `/youtube-sponsorship-calculator`  | 4.03 kB   | 110 kB        |
| Static legal / about pages         | 177 B     | 106 kB        |
| Shared JS                          | 102 kB    | —             |

Recharts (~40 kB) is lazy-loaded via `next/dynamic` and never enters
the initial client bundle. Screen-reader summaries are rendered
synchronously so a11y isn't gated on the lazy load.

---

## Security notes

- The YouTube API key lives in `serverEnv.youtubeApiKey` inside
  `src/lib/env.server.ts`, which `import "server-only"`. A client-
  component import fails the build.
- Every server env variable is Zod-validated at boot. Bad values fail
  fast with a helpful message that **never echoes the raw value**.
- Upstream fetch has an **abort-based timeout** (default 8 s) —
  configurable via `YOUTUBE_TIMEOUT_MS`.
- API error responses go through a whitelist. Only stable public codes
  (`INVALID_QUERY`, `NOT_FOUND`, `QUOTA_EXCEEDED`, `RATE_LIMITED`,
  `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `INTERNAL_ERROR`, etc.)
  are ever returned. Raw upstream errors, stack traces, file paths, and
  env variables never reach the client. Tests assert this explicitly.
- All API-route inputs are validated with **Zod** and length/range-capped.
- URL construction uses `URL` + `URLSearchParams` — no string concat.
- Every external `target="_blank"` link uses `rel="noopener noreferrer"`.
- Image domains are allowlisted in `next.config.mjs`.
- Baseline security headers are set globally in `next.config.mjs`
  (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
  `X-DNS-Prefetch-Control: on`). `/api/*` also gets `Cache-Control: no-store`.
- Rate limiter clamps request volume per client id; `X-Forwarded-For`
  is only trusted with explicit `TRUST_PROXY=1`.

---

## Known limitations

- **Cache & rate limiter are instance-local.** See
  [Instance-local cache limitations](#instance-local-cache-limitations)
  and [Redis migration path](#redis-migration-path).
- **RPM benchmarks are approximations.** Public creator-economy reports,
  reviewed periodically. The methodology page shows the last review date.
- **FX rates are static.** No live currency feed is consumed.
- **Old viral videos** may generate "long tail" views the recent-uploads
  sample doesn't capture — the calculator lets you override monthly
  views manually.
- **Rapid new uploads** may take a few minutes to appear because of the
  channel/videos cache TTLs.

---

## Troubleshooting

- **`MISSING_API_KEY`** — no `YOUTUBE_API_KEY`. Copy `.env.example` to
  `.env.local`, add the key, restart `npm run dev`.
- **`QUOTA_EXCEEDED`** (`HTTP 429`) — you burned through the daily quota.
  Wait for reset, or request more quota in Google Cloud.
- **`INVALID_API_KEY`** — the key is wrong, disabled, or your project
  doesn't have the YouTube Data API v3 enabled.
- **`UPSTREAM_TIMEOUT`** — the YouTube API took longer than
  `YOUTUBE_TIMEOUT_MS` (default 8 s). Retry or bump the limit.
- **`RATE_LIMITED`** — you're hammering the local API too fast. Raise
  the limit via `RATE_LIMIT_MAX` or slow down.

---

## License

MIT. See `LICENSE` if provided, otherwise treat as MIT-style permissive.
