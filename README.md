# Creator Earnings Calculator

A production-ready **Next.js 15** app that searches any public YouTube
channel and produces an **independent** estimate of what its creator
revenue might look like, using only the **official YouTube Data API v3**.

- 🔎 Channel search — name, `@handle`, channel URL, or channel ID
- 📊 Recent performance analysis with low/expected/high monthly view bands
- 💰 Configurable earnings estimator with country RPM tiers, niche,
  content type, custom RPM override, currency, and additional income streams
- 📈 Interactive revenue breakdown + 12-month projection charts (Recharts)
- 🔗 Shareable calculator URLs (state ⇄ URL query params, Zod-validated)
- 🕘 Local recent-search history — never leaves your browser
- 🔒 Server-only YouTube API wrapper. API key never sent to the client
- 🧠 In-memory TTL cache with LRU eviction + single-flight deduplication
- 🚦 In-memory rate limiter with 429 + `Retry-After`
- 🧪 Vitest + React Testing Library — 193 tests, 72% overall / 94% lib coverage
- ⚙️ GitHub Actions CI (lint · typecheck · test · build)
- ♿ Keyboard-navigable combobox, visible focus, semantic headings, aria-live
- 🔎 SEO: metadata + OG/Twitter + `robots.ts` + `sitemap.ts` + JSON-LD

Additional standalone calculators:

- **RPM** — `/youtube-rpm-calculator`
- **CPM** — `/youtube-cpm-calculator`
- **Shorts** — `/youtube-shorts-calculator`
- **Sponsorship** — `/youtube-sponsorship-calculator`

> ⚠️ This is an **independent** tool. It is not affiliated with, endorsed
> by, or verified by YouTube or Google. All revenue figures are estimates.

---

## Table of contents

- [Quick start](#quick-start)
- [Google Cloud & YouTube API setup](#google-cloud--youtube-api-setup)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Testing](#testing)
- [Continuous integration](#continuous-integration)
- [Project structure](#project-structure)
- [How the estimator works](#how-the-estimator-works)
- [Cache implementation](#cache-implementation)
- [Rate limiting](#rate-limiting)
- [Shareable URLs](#shareable-urls)
- [Recent searches](#recent-searches)
- [Charts](#charts)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Quick start

```bash
git clone <this-repo>
cd creator-earnings-calculator

cp .env.example .env.local
# open .env.local and paste your YouTube Data API key

npm install
npm run dev
```

Open <http://localhost:3000>.

---

## Google Cloud & YouTube API setup

Exact steps to obtain a YouTube Data API v3 key:

1. Go to <https://console.cloud.google.com/> and create or select a project.
2. Navigate to **APIs & Services → Library**, find **YouTube Data API v3**,
   and click **Enable**.
3. Go to **APIs & Services → Credentials → Create credentials → API key**.
4. Copy the generated key.
5. Apply **application restrictions**. For this app the requests are made
   server-to-server, so use an **IP restriction** (your production
   host / build worker), or leave unrestricted if you're only running locally.
   Do NOT set an HTTP referrer restriction — it will reject server requests.
6. Apply **API restrictions**: restrict to **YouTube Data API v3** only.
7. Store the key as `YOUTUBE_API_KEY` — either in `.env.local` for local dev
   or as a secret in your deployment platform.
8. **Never commit `.env.local`** to git. `.gitignore` already excludes it.

The free tier gives 10,000 quota units/day. A typical channel visit
(search → channel → recent videos) costs about 100–120 units.

---

## Environment variables

Copy `.env.example` to `.env.local`:

```env
YOUTUBE_API_KEY=your-key-here

NEXT_PUBLIC_SITE_NAME=Creator Earnings Calculator
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional
YOUTUBE_TIMEOUT_MS=8000           # abort upstream requests after N ms
RATE_LIMIT_MAX=60                 # requests per window per client
RATE_LIMIT_WINDOW_MS=60000        # sliding window duration
TRUST_PROXY=1                     # honor X-Forwarded-For (only behind a real proxy)
```

- `YOUTUBE_API_KEY` — **server-only**. Never exposed to the browser.
- `NEXT_PUBLIC_SITE_URL` — canonical base URL used for OG images, sitemap,
  and JSON-LD. Set this to your production URL when deploying.
- `TRUST_PROXY` — set to `1` only when behind a proxy that overwrites the
  `X-Forwarded-For` header (Vercel, Fly, Cloudflare). Otherwise we ignore
  the header to prevent spoofing the rate limiter.

---

## Scripts

| Command                  | What it does                                    |
| ------------------------ | ----------------------------------------------- |
| `npm run dev`            | Start the dev server on port 3000               |
| `npm run build`          | Production build                                |
| `npm run start`          | Serve the production build                      |
| `npm run lint`           | ESLint (Next config + TypeScript)               |
| `npm run typecheck`      | `tsc --noEmit`                                  |
| `npm run test`           | Run the Vitest suite once (`vitest run`)        |
| `npm run test:watch`     | Vitest in watch mode                            |
| `npm run test:coverage`  | Run tests and produce a v8 coverage report      |

---

## Testing

- **Framework**: Vitest with `jsdom` environment.
- **UI**: React Testing Library + `@testing-library/user-event`.
- **Matchers**: `@testing-library/jest-dom`.
- **YouTube API**: never called from tests. All upstream fetches are mocked
  via `vi.stubGlobal("fetch", …)` or per-module `vi.mock(...)`.

Test suites at a glance:

| Layer          | Files                                                                             |
| -------------- | --------------------------------------------------------------------------------- |
| Pure functions | `parseQuery`, `format`, `performance`, `earnings`, `calculatorState`, `cache`, `rateLimit`, `recentSearches`, `simpleCalculators`, `apiHelpers` |
| Server         | `youtube` service (fetch mocked), `/api/search` · `/api/channel` · `/api/videos` route handlers |
| Components     | `ChannelSearch`, `ProfileCard`, `EarningsCalculator`                              |

Current coverage (representative):

- `src/lib/**`: ~94% lines / ~84% branches
- Overall: ~72% lines / ~81% branches

The Vitest config enforces a coverage floor of 60% across statements,
functions, branches, and lines. A regression below that fails CI.

---

## Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`:

```yaml
- npm ci
- npm run lint
- npm run typecheck
- npm run test           # YOUTUBE_API_KEY=test-key (only mocks are used)
- npm run build          # YOUTUBE_API_KEY=build-time-placeholder
```

Node version: 22 (LTS). Dependency cache is enabled via `actions/setup-node`.
The pipeline fails if any step fails.

Because all YouTube requests are mocked in tests, CI does not need a real
API key. No production secrets are stored in the repo.

---

## Project structure

```
src/
  app/
    api/
      channel/route.ts        # GET /api/channel?channelId=UC...
      search/route.ts         # GET /api/search?q=...
      videos/route.ts         # GET /api/videos?playlistId=UU...
      __tests__/routes.test.ts
    about/ · disclaimer/ · methodology/ · privacy/ · terms/
    youtube-rpm-calculator/
    youtube-cpm-calculator/
    youtube-shorts-calculator/
    youtube-sponsorship-calculator/
    layout.tsx · page.tsx · robots.ts · sitemap.ts · error.tsx · not-found.tsx
    globals.css
  components/
    ChannelSearch.tsx         # Debounced accessible combobox
    ChannelWorkspace.tsx      # Client orchestrator + URL sync
    EarningsCalculator.tsx    # Interactive estimator
    EarningsCharts.tsx        # Recharts bar + line
    CopyShareLink.tsx         # Copy-to-clipboard with a11y feedback
    RecentSearches.tsx        # localStorage history
    ProfileCard.tsx · PerformanceCard.tsx · VideosGrid.tsx
    Header.tsx · Footer.tsx · StaticPage.tsx · TransparencyBanner.tsx
    SimpleCalcLayout.tsx      # Shared layout for standalone calculators
    icons.tsx
    __tests__/                # Component tests
  lib/
    config.ts                 # publicConfig + serverEnv
    youtube.ts                # server-only API wrapper (fetch + timeout + cache)
    errors.ts                 # Public error class (safe to import anywhere)
    apiHelpers.ts             # safeErrorResponse + applyRateLimit
    cache.ts                  # Bounded TTL cache + single-flight
    rateLimit.ts              # Sliding-window rate limiter + client id
    calculatorState.ts        # CalculatorState + URL encode/decode + toEarningsInput
    earnings.ts               # calculateEarnings — pure
    performance.ts            # analyzePerformance — pure
    parseQuery.ts             # Query -> channelId / handle / name
    rpmData.ts                # Country/niche/currency benchmarks
    simpleCalculators.ts      # RPM / CPM / sponsorship — pure
    schemas.ts                # Zod schemas for request validation
    recentSearches.ts         # localStorage helpers
    format.ts                 # Number, currency, date, duration helpers
    __tests__/                # Unit tests
  types/
    youtube.ts                # Domain DTOs
```

---

## How the estimator works

### Performance snapshot

1. Fetch up to 12 recent uploads via `playlistItems` + `videos`.
2. Compute average / median view counts, upload cadence in last 30 &
   90 days, Shorts vs. long-form share.
3. Point estimate for monthly views:
   - Prefer 30-day sum if we have ≥ 3 recent uploads.
   - Otherwise scale 90-day sample down to 30 days.
   - Otherwise average across the observed span.
4. Emit low / expected / high (0.7× / 1.0× / 1.35×) around the point.

### Earnings

```
ad revenue = (monthly views × monetized%) × RPM / 1000
total      = ad revenue + sponsorships + affiliate + memberships + other
```

`RPM` comes from `country baseRpm × niche multiplier × contentType
multiplier`, unless a custom RPM is provided. Bands (low/expected/high)
scale accordingly. All results are converted to the display currency using
a static approximate FX table.

Details, benchmarks review date, and every assumption are documented in
`/methodology` inside the app.

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

> ⚠️ This cache is **process-local**. On serverless / multi-instance
> platforms (Vercel, Fly, Cloud Run) each instance keeps its own cache.
> For a shared cache use Redis / Upstash / Cloudflare KV — swap out the
> internal `Map` in `TtlCache` and keep the public interface intact.

Cached namespaces are exported as `searchCache`, `channelCache`, and
`videosCache`. Errors bypass the cache entirely so a transient upstream
failure never sticks.

---

## Rate limiting

`src/lib/rateLimit.ts` — a sliding-window limiter that gates the three
YouTube-backed API routes.

- **Configurable** via `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS`
  (defaults: 60 requests / 60 s per client id).
- **Client identifier**: takes `x-real-ip` when the platform sets it;
  honors `x-forwarded-for` **only** when `TRUST_PROXY=1` is set. Falls
  back to a shared `"anonymous"` bucket otherwise. Raw IPs are hashed —
  never stored or logged.
- **Response**: `429 RATE_LIMITED` with `Retry-After` and rate-limit
  headers (`X-RateLimit-Limit`, `-Remaining`, `-Reset`).

> ⚠️ Same caveat as the cache: the limiter is process-local. For
> distributed production deployments use Redis / Upstash Ratelimit.

---

## Shareable URLs

Calculator state round-trips through URL query parameters (Zod-validated).

- Supported params: `cid`, `mv`, `c`, `n`, `ct`, `rm`, `rpm`, `cur`, `mp`,
  `sp`, `af`, `mb`, `ot` (kept short intentionally).
- The homepage decodes params once on mount and hydrates the calculator.
- Every subsequent state change writes to the URL via `router.replace(...)`
  (no full-page reload). Browser back / forward is handled via
  `useSearchParams`.
- Invalid / unknown params fall back to safe defaults using `z.catch(...)`.
- The `Copy share link` button uses the async Clipboard API with a
  document.execCommand fallback, and surfaces success or failure via an
  `aria-live="polite"` region.
- No private information is placed in the URL — only public identifiers
  and calculator assumptions.

---

## Recent searches

`src/lib/recentSearches.ts` — localStorage-only, per browser.

- Stores at most `RECENT_MAX = 8` channels: `channelId`, `title`, `handle`,
  `thumbnail`, and a timestamp for ordering.
- Deduplicated by `channelId`, sorted most-recent-first.
- Silently no-ops if localStorage is unavailable (private mode / quota).
- `Clear history` button in the UI wipes storage.
- **Never sent to any server.**

---

## Charts

`src/components/EarningsCharts.tsx` — Recharts.

- **Monthly revenue by source** — bar chart of ads, sponsorships,
  affiliate, memberships, other.
- **12-month cumulative projection** — line chart of low / expected /
  high bands. **Constant** monthly earnings — no growth assumption baked in.
- **Currency-aware** compact formatting, non-compact in tooltips.
- **Empty state** when everything is zero.
- **Accessibility**:
  - Each chart has an `sr-only` text summary with the actual numbers.
  - `role="img"` and `aria-labelledby` on chart containers.
  - Legend + tooltip labels — data never communicated only through colour.
  - Animation is disabled when the user prefers reduced motion.

---

## Security notes

- The YouTube API key lives in `serverEnv.youtubeApiKey` and is only read
  from `src/lib/youtube.ts`, which is `import "server-only"`. The key is
  never inlined into client bundles.
- Upstream fetch has an **abort-based timeout** (default 8 s) —
  configurable via `YOUTUBE_TIMEOUT_MS`.
- Error responses go through a whitelist: only stable public error codes
  (`INVALID_QUERY`, `NOT_FOUND`, `QUOTA_EXCEEDED`, `RATE_LIMITED`,
  `UPSTREAM_TIMEOUT`, `UPSTREAM_UNAVAILABLE`, `INTERNAL_ERROR`, etc.) are
  ever returned. Raw upstream errors, stack traces, file paths, and env
  variables never reach the client. Tests assert this explicitly.
- All API-route inputs are validated with **Zod** and length/range-capped.
- URL construction uses `URL` + `URLSearchParams` — no string concat.
- Every external `target="_blank"` link uses `rel="noopener noreferrer"`.
- Image domains are allowlisted in `next.config.mjs`.
- Rate limiter clamps request volume per client id; `X-Forwarded-For` is
  only trusted with explicit `TRUST_PROXY=1`.
- Query parameter validation with `z.catch(default)` prevents malformed
  input from crashing the client.

---

## Known limitations

- **Cache & rate limiter are instance-local.** In a horizontally-scaled
  or serverless deployment, cache hit rate and rate-limit accuracy degrade
  with the number of instances. For real scale, back both with Redis or
  Upstash — the public interfaces don't change.
- **RPM benchmarks are approximations.** They come from public
  creator-economy reports and are reviewed periodically. The methodology
  page shows the last review date.
- **FX rates are static.** No live currency feed is consumed.
- **Old viral videos** may generate "long tail" views that our
  recent-uploads sample doesn't capture — the calculator lets you override
  monthly views manually.
- **Rapid new uploads** may take a few minutes to appear because of the
  channel/videos cache TTL.

---

## Deployment

### Vercel (recommended)

1. Push the repo to GitHub.
2. Import into Vercel.
3. Add environment variables in **Settings → Environment Variables**:
   - `YOUTUBE_API_KEY` (required)
   - `NEXT_PUBLIC_SITE_URL` = your production URL
   - Optionally `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`,
     `YOUTUBE_TIMEOUT_MS`, `TRUST_PROXY=1`
4. Deploy.

Because Vercel is edge/serverless, remember the cache and rate limiter
are per-instance. For production scale, back them with Upstash Redis.

### Docker / self-hosted

```bash
npm ci
npm run build
npm run start
```

### API-key restriction recommendations

- Application restriction: **IP address(es)** of your server (or none, if
  running locally).
- Do **not** set an HTTP-referrer restriction — requests are server-to-
  server, they have no `Referer` header.
- API restriction: **YouTube Data API v3** only.

---

## Troubleshooting

- **`MISSING_API_KEY`** — you didn't set `YOUTUBE_API_KEY`. Copy
  `.env.example` to `.env.local`, add the key, and restart `npm run dev`.
- **`QUOTA_EXCEEDED`** (`HTTP 429`) — you burned through the daily quota.
  Wait for reset, or request more quota in Google Cloud.
- **`INVALID_API_KEY`** — the key is wrong, disabled, or your project
  doesn't have YouTube Data API v3 enabled.
- **`UPSTREAM_TIMEOUT`** — the YouTube API took longer than
  `YOUTUBE_TIMEOUT_MS` (default 8s). Retry or bump the limit.
- **`RATE_LIMITED`** — you're hammering the local API too fast. Raise the
  limit via `RATE_LIMIT_MAX` or slow down.

---

## License

MIT. See `LICENSE` if provided, otherwise treat as MIT-style permissive.
